package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/location"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/mmcloughlin/geohash"
)

type ReturnRequest struct {
	ReturnID   string  `json:"return_id,omitempty"`
	OrderID    string  `json:"order_id"`
	ProductID  string  `json:"product_id"`
	UserID     string  `json:"user_id"`
	Reason     string  `json:"reason"`
	DeviceHash string  `json:"device_hash,omitempty"`
	MediaURL   string  `json:"media_url,omitempty"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
}

type Order struct {
	OrderID       string  `dynamodbav:"OrderId"`
	ProductID     string  `dynamodbav:"ProductId"`
	OriginalPrice float64 `dynamodbav:"OriginalPrice"`
	SellerID      string  `dynamodbav:"SellerId"`
}

type ReturnRecord struct {
	ReturnID   string  `dynamodbav:"ReturnId"`
	OrderID    string  `dynamodbav:"OrderId"`
	ProductID  string  `dynamodbav:"ProductId"`
	UserID     string  `dynamodbav:"UserId"`
	Reason     string  `dynamodbav:"Reason"`
	MSRP       float64 `dynamodbav:"MSRP"`
	Pathway    string  `dynamodbav:"Pathway"`
	Status     string  `dynamodbav:"Status"`
	DeviceHash string  `dynamodbav:"DeviceHash"`
	MediaURL   string  `dynamodbav:"MediaUrl"`
	Lat        float64 `dynamodbav:"Lat"`
	Lng        float64 `dynamodbav:"Lng"`
	Geohash    string  `dynamodbav:"Geohash"`
	CreatedAt  string  `dynamodbav:"CreatedAt"`
}

type CarbonMetricRecord struct {
	ReturnID             string  `dynamodbav:"ReturnId"`
	UserID               string  `dynamodbav:"UserId"`
	SellerID             string  `dynamodbav:"SellerId"`
	CO2SavedKg           float64 `dynamodbav:"CO2SavedKg"`
	TransportLegsAvoided int     `dynamodbav:"TransportLegsAvoided"`
	WarehouseDaysAvoided int     `dynamodbav:"WarehouseDaysAvoided"`
	Pathway              string  `dynamodbav:"Pathway"`
	CalculatedAt         string  `dynamodbav:"CalculatedAt"`
}

type Listing struct {
	ListingID string  `json:"listing_id" dynamodbav:"ListingId"`
	UserID    string  `json:"user_id" dynamodbav:"UserId"`
	Lat       float64 `json:"lat" dynamodbav:"Lat"`
	Lng       float64 `json:"lng" dynamodbav:"Lng"`
	Geohash   string  `json:"geohash" dynamodbav:"Geohash"`
}

type Locker struct {
	LockerID string  `json:"locker_id"`
	Name     string  `json:"name"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Distance float64 `json:"distance_km"`
}

type DynamoDBAPI interface {
	GetItem(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	PutItem(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
}

type S3PresignAPI interface {
	PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

type LocationAPI interface {
	CalculateRouteMatrix(ctx context.Context, params *location.CalculateRouteMatrixInput, optFns ...func(*location.Options)) (*location.CalculateRouteMatrixOutput, error)
}

var (
	ddbClient       DynamoDBAPI
	s3PresignClient S3PresignAPI
	locationClient  LocationAPI
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}
	ddbClient = dynamodb.NewFromConfig(cfg)
	s3Client := s3.NewFromConfig(cfg)
	s3PresignClient = s3.NewPresignClient(s3Client)
	locationClient = location.NewFromConfig(cfg)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Path: %s, Method: %s", request.Path, request.HTTPMethod)

	switch request.Path {
	case "/return/media-url":
		return handleMediaURLGeneration(ctx, request)
	case "/return/intercept":
		return handleReturnIntercept(ctx, request)
	default:
		return events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       `{"error": "Not Found"}`,
		}, nil
	}
}

func handleMediaURLGeneration(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	bucket := os.Getenv("UPLOADS_BUCKET")
	if bucket == "" {
		bucket = "secondlife-uploads-fallback"
	}

	filename, ok := request.QueryStringParameters["filename"]
	if !ok || filename == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"error": "Missing query parameter: filename"}`,
		}, nil
	}

	key := fmt.Sprintf("returns/%d-%s", time.Now().UnixNano(), filename)

	if s3PresignClient == nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"error": "S3 pre-signer not initialized"}`,
		}, nil
	}

	presignedReq, err := s3PresignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &bucket,
		Key:    &key,
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(15 * time.Minute)
	})

	if err != nil {
		log.Printf("Failed to generate presigned S3 URL: %v", err)
		return events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"error": "Could not generate upload URL"}`,
		}, nil
	}

	responseBody, _ := json.Marshal(map[string]string{
		"upload_url": presignedReq.URL,
		"media_url":  fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, key),
	})

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
		},
		Body: string(responseBody),
	}, nil
}

func handleReturnIntercept(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req ReturnRequest
	err := json.Unmarshal([]byte(request.Body), &req)
	if err != nil {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"error": "Invalid request body"}`,
		}, nil
	}

	if req.OrderID == "" || req.ProductID == "" || req.UserID == "" {
		return events.APIGatewayProxyResponse{
			StatusCode: 400,
			Body:       `{"error": "Missing required fields: order_id, product_id, user_id"}`,
		}, nil
	}

	userGeohash := ""
	if req.Lat != 0 && req.Lng != 0 {
		userGeohash = geohash.Encode(req.Lat, req.Lng)
		log.Printf("Encoded User Location to Geohash: %s (Lat: %f, Lng: %f)", userGeohash, req.Lat, req.Lng)
	}

	ordersTable := os.Getenv("ORDERS_TABLE")
	returnsTable := os.Getenv("RETURNS_TABLE")
	carbonTable := os.Getenv("CARBON_TABLE")

	var msrp float64 = 0.0
	sellerID := "seller-default"

	if ordersTable != "" && ddbClient != nil {
		out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: &ordersTable,
			Key: map[string]types.AttributeValue{
				"OrderId": &types.AttributeValueMemberS{Value: req.OrderID},
			},
		})
		if err == nil && out.Item != nil {
			var order Order
			if err := attributevalue.UnmarshalMap(out.Item, &order); err == nil {
				msrp = order.OriginalPrice
				if order.SellerID != "" {
					sellerID = order.SellerID
				}
			}
		}
	}

	if msrp == 0 {
		if val, ok := request.QueryStringParameters["msrp"]; ok {
			if parsed, err := strconv.ParseFloat(val, 64); err == nil {
				msrp = parsed
			}
		} else {
			if len(req.ProductID) >= 6 && req.ProductID[:6] == "p-high" {
				msrp = 7500.0
			} else {
				msrp = 1500.0
			}
		}
	}

	pathway := "commodity"
	if msrp >= 5000.0 {
		pathway = "premium"
	}

	var finalPathway string = pathway
	var matchingLocker *Locker
	var matchedBuyer *Listing
	var travelDistanceKm float64 = 0.0
	var travelDurationMin float64 = 0.0

	if pathway == "commodity" && req.Lat != 0 && req.Lng != 0 {
		candidates := getListingsNear(req.Lat, req.Lng)

		if len(candidates) > 0 {
			closestBuyer, dist, duration, err := findClosestRoute(ctx, req.Lat, req.Lng, candidates)
			if err == nil && dist < 15.0 {
				matchedBuyer = closestBuyer
				travelDistanceKm = dist
				travelDurationMin = duration
				finalPathway = "hyperlocal-p2p"
			}
		}

		if finalPathway == "commodity" {
			lockers := getLockersNear(req.Lat, req.Lng)
			closestLocker := findClosestLocker(req.Lat, req.Lng, lockers)
			if closestLocker != nil && closestLocker.Distance <= 5.0 {
				matchingLocker = closestLocker
				travelDistanceKm = closestLocker.Distance
				travelDurationMin = closestLocker.Distance * 3.0
				finalPathway = "locker-dropoff"
			} else {
				finalPathway = "keep-credit"
			}
		}
	}

	returnID := req.ReturnID
	if returnID == "" {
		returnID = fmt.Sprintf("ret-%s", req.OrderID)
	}

	record := ReturnRecord{
		ReturnID:   returnID,
		OrderID:    req.OrderID,
		ProductID:  req.ProductID,
		UserID:     req.UserID,
		Reason:     req.Reason,
		MSRP:       msrp,
		Pathway:    finalPathway,
		Status:     "initiated",
		DeviceHash: req.DeviceHash,
		MediaURL:   req.MediaURL,
		Lat:        req.Lat,
		Lng:        req.Lng,
		Geohash:    userGeohash,
		CreatedAt:  time.Now().Format(time.RFC3339),
	}

	if returnsTable != "" && ddbClient != nil {
		av, err := attributevalue.MarshalMap(record)
		if err == nil {
			_, err = ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
				TableName: &returnsTable,
				Item:      av,
			})
			if err != nil {
				log.Printf("Error saving to ReturnsTable: %v", err)
			}
		}
	}

	var co2Saved float64 = 0.0
	var legsAvoided int = 0
	var warehouseDaysAvoided int = 0

	switch finalPathway {
	case "hyperlocal-p2p":
		avgWarehouseDistanceKm := 350.0
		netDistanceSaved := avgWarehouseDistanceKm - travelDistanceKm
		if netDistanceSaved < 0 {
			netDistanceSaved = 0
		}
		co2Saved = netDistanceSaved * 0.15
		legsAvoided = 2
		warehouseDaysAvoided = 14
	case "locker-dropoff":
		avgWarehouseDistanceKm := 350.0
		co2Saved = (avgWarehouseDistanceKm * 0.15) * 0.40
		legsAvoided = 1
		warehouseDaysAvoided = 7
	case "keep-credit":
		avgWarehouseDistanceKm := 350.0
		co2Saved = avgWarehouseDistanceKm * 0.15
		legsAvoided = 2
		warehouseDaysAvoided = 14
	default:
		co2Saved = 10.5
		legsAvoided = 1
		warehouseDaysAvoided = 3
	}

	carbonMetric := CarbonMetricRecord{
		ReturnID:             returnID,
		UserID:               req.UserID,
		SellerID:             sellerID,
		CO2SavedKg:           co2Saved,
		TransportLegsAvoided: legsAvoided,
		WarehouseDaysAvoided: warehouseDaysAvoided,
		Pathway:              finalPathway,
		CalculatedAt:         time.Now().Format(time.RFC3339),
	}

	if carbonTable != "" && ddbClient != nil {
		av, err := attributevalue.MarshalMap(carbonMetric)
		if err == nil {
			_, err = ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
				TableName: &carbonTable,
				Item:      av,
			})
			if err != nil {
				log.Printf("Error logging carbon metrics: %v", err)
			}
		}
	}

	responseMap := map[string]interface{}{
		"message":               "Return request processed successfully",
		"return_id":             returnID,
		"msrp":                  msrp,
		"pathway":               finalPathway,
		"status":                record.Status,
		"device_hash":           record.DeviceHash,
		"media_url":             record.MediaURL,
		"geohash":               userGeohash,
		"carbon_saved_co2_kg":   co2Saved,
		"transport_legs_saved":  legsAvoided,
		"warehouse_days_saved":  warehouseDaysAvoided,
	}

	if matchedBuyer != nil {
		responseMap["matched_buyer"] = matchedBuyer
		responseMap["transit_distance_km"] = travelDistanceKm
		responseMap["transit_duration_min"] = travelDurationMin
	}
	if matchingLocker != nil {
		responseMap["matched_locker"] = matchingLocker
		responseMap["transit_distance_km"] = travelDistanceKm
		responseMap["transit_duration_min"] = travelDurationMin
	}

	responseBody, _ := json.Marshal(responseMap)

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
		},
		Body: string(responseBody),
	}, nil
}

func calculateHaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180.0)*math.Cos(lat2*math.Pi/180.0)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func findClosestRoute(ctx context.Context, startLat, startLng float64, destinations []Listing) (*Listing, float64, float64, error) {
	calculatorName := os.Getenv("ROUTE_CALCULATOR_NAME")

	if calculatorName == "" || locationClient == nil {
		return findClosestRouteHaversine(startLat, startLng, destinations)
	}

	// In AWS SDK Go v2, coordinates are defined as []float64{longitude, latitude}
	origins := [][]float64{
		{startLng, startLat},
	}
	dests := make([][]float64, len(destinations))
	for i, d := range destinations {
		dests[i] = []float64{d.Lng, d.Lat}
	}

	out, err := locationClient.CalculateRouteMatrix(ctx, &location.CalculateRouteMatrixInput{
		CalculatorName:       &calculatorName,
		DeparturePositions:   origins,
		DestinationPositions: dests,
	})

	if err != nil || len(out.RouteMatrix) == 0 {
		log.Printf("Route Matrix API failed, falling back to Haversine calculations: %v", err)
		return findClosestRouteHaversine(startLat, startLng, destinations)
	}

	closestIdx := -1
	minDistance := math.MaxFloat64
	var minDuration float64 = 0.0

	for i, entry := range out.RouteMatrix[0] {
		if entry.Error != nil {
			continue
		}
		if entry.Distance != nil && *entry.Distance < minDistance {
			minDistance = *entry.Distance
			closestIdx = i
			if entry.DurationSeconds != nil {
				minDuration = *entry.DurationSeconds / 60.0
			}
		}
	}

	if closestIdx == -1 {
		return findClosestRouteHaversine(startLat, startLng, destinations)
	}

	return &destinations[closestIdx], minDistance, minDuration, nil
}

func findClosestRouteHaversine(startLat, startLng float64, destinations []Listing) (*Listing, float64, float64, error) {
	var closest *Listing
	minDist := math.MaxFloat64
	for i := range destinations {
		d := &destinations[i]
		dist := calculateHaversineDistance(startLat, startLng, d.Lat, d.Lng) * 1.3
		if dist < minDist {
			minDist = dist
			closest = d
		}
	}
	duration := (minDist / 40.0) * 60.0
	return closest, minDist, duration, nil
}

func findClosestLocker(lat, lng float64, lockers []Locker) *Locker {
	var closest *Locker
	minDist := math.MaxFloat64
	for i := range lockers {
		l := &lockers[i]
		dist := calculateHaversineDistance(lat, lng, l.Lat, l.Lng)
		l.Distance = dist
		if dist < minDist {
			minDist = dist
			closest = l
		}
	}
	return closest
}

var getListingsNear = func(lat, lng float64) []Listing {
	return []Listing{
		{ListingID: "list-1", UserID: "buyer-alpha", Lat: lat + 0.02, Lng: lng - 0.01, Geohash: geohash.Encode(lat+0.02, lng-0.01)},
		{ListingID: "list-2", UserID: "buyer-beta", Lat: lat - 0.03, Lng: lng + 0.02, Geohash: geohash.Encode(lat-0.03, lng+0.02)},
	}
}

var getLockersNear = func(lat, lng float64) []Locker {
	return []Locker{
		{LockerID: "lock-99", Name: "Amazon Locker - Metro Hub", Lat: lat + 0.01, Lng: lng + 0.01},
		{LockerID: "lock-100", Name: "Amazon Kiosk - Central Station", Lat: lat + 0.08, Lng: lng - 0.08},
	}
}

func main() {
	lambda.Start(handler)
}
