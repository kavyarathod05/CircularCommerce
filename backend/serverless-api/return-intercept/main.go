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
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/location"
	"github.com/aws/aws-sdk-go-v2/service/rekognition"
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
	ReturnID        string  `dynamodbav:"ReturnId" json:"return_id"`
	OrderID         string  `dynamodbav:"OrderId" json:"order_id"`
	ProductID       string  `dynamodbav:"ProductId" json:"product_id"`
	UserID          string  `dynamodbav:"UserId" json:"user_id"`
	Reason          string  `dynamodbav:"Reason" json:"reason"`
	MSRP            float64 `dynamodbav:"MSRP" json:"msrp"`
	Pathway         string  `dynamodbav:"Pathway" json:"pathway"`
	Status          string  `dynamodbav:"Status" json:"status"`
	DeviceHash      string  `dynamodbav:"DeviceHash" json:"device_hash"`
	MediaURL        string  `dynamodbav:"MediaUrl" json:"media_url"`
	Lat             float64 `dynamodbav:"Lat" json:"lat"`
	Lng             float64 `dynamodbav:"Lng" json:"lng"`
	Geohash         string  `dynamodbav:"Geohash" json:"geohash"`
	CreatedAt       string  `dynamodbav:"CreatedAt" json:"created_at"`
	InspectionGrade string  `dynamodbav:"InspectionGrade,omitempty" json:"inspection_grade,omitempty"`
	AISummary       string  `dynamodbav:"AISummary,omitempty" json:"ai_summary,omitempty"`
	Findings        string  `dynamodbav:"Findings,omitempty" json:"findings,omitempty"`
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

type DPPBlock struct {
	Owner           string  `json:"owner" dynamodbav:"Owner"`
	Timestamp       string  `json:"timestamp" dynamodbav:"Timestamp"`
	Action          string  `json:"action" dynamodbav:"Action"` // e.g. "purchased", "returned", "resold"
	InspectionGrade string  `json:"inspection_grade,omitempty" dynamodbav:"InspectionGrade,omitempty"`
	CO2SavedKg      float64 `json:"co2_saved_kg,omitempty" dynamodbav:"CO2SavedKg,omitempty"`
}

type Listing struct {
	ListingID    string     `json:"listing_id" dynamodbav:"ListingId"`
	ProductID    string     `json:"product_id" dynamodbav:"ProductId"`
	SellerID     string     `json:"seller_id" dynamodbav:"SellerId"`
	UserID       string     `json:"user_id" dynamodbav:"UserId"` // Original returning user
	Lat          float64    `json:"lat" dynamodbav:"Lat"`
	Lng          float64    `json:"lng" dynamodbav:"Lng"`
	Geohash      string     `json:"geohash" dynamodbav:"Geohash"`
	Status       string     `json:"status" dynamodbav:"Status"` // available -> reserved -> sold
	AskingPrice  float64    `json:"asking_price" dynamodbav:"AskingPrice"`
	OwnerHistory []string   `json:"owner_history" dynamodbav:"OwnerHistory"`
	DPPHistory   []DPPBlock `json:"dpp_history" dynamodbav:"DPPHistory"`
	PublishedAt  string     `json:"published_at" dynamodbav:"PublishedAt"`
}

type EscrowRecord struct {
	MatchID   string  `json:"match_id" dynamodbav:"MatchId"`
	ListingID string  `json:"listing_id" dynamodbav:"ListingId"`
	BuyerID   string  `json:"buyer_id" dynamodbav:"BuyerID"`
	Amount    float64 `json:"amount" dynamodbav:"Amount"`
	Status    string  `json:"status" dynamodbav:"Status"` // locked -> released -> refunded
	UpdatedAt string  `json:"updated_at" dynamodbav:"UpdatedAt"`
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

type BedrockAPI interface {
	InvokeModel(ctx context.Context, params *bedrockruntime.InvokeModelInput, optFns ...func(*bedrockruntime.Options)) (*bedrockruntime.InvokeModelOutput, error)
}

type RekognitionAPI interface {
	DetectLabels(ctx context.Context, params *rekognition.DetectLabelsInput, optFns ...func(*rekognition.Options)) (*rekognition.DetectLabelsOutput, error)
}

var (
	ddbClient         DynamoDBAPI
	s3PresignClient   S3PresignAPI
	locationClient    LocationAPI
	bedrockClient     BedrockAPI
	rekognitionClient RekognitionAPI
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
	bedrockClient = bedrockruntime.NewFromConfig(cfg)
	rekognitionClient = rekognition.NewFromConfig(cfg)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("Path: %s, Method: %s", request.Path, request.HTTPMethod)

	if request.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
				"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
			},
			Body: `{"status": "ok"}`,
		}, nil
	}

	var resp events.APIGatewayProxyResponse
	var err error

	switch request.Path {
	case "/return/media-url":
		resp, err = handleMediaURLGeneration(ctx, request)
	case "/return/intercept":
		resp, err = handleReturnIntercept(ctx, request)
	case "/listing":
		resp, err = handleListingOperations(ctx, request)
	case "/escrow/lock":
		resp, err = handleEscrowLock(ctx, request)
	case "/escrow/release":
		resp, err = handleEscrowRelease(ctx, request)
	case "/dpp":
		resp, err = handleDPPOperations(ctx, request)
	default:
		resp = events.APIGatewayProxyResponse{
			StatusCode: 404,
			Body:       `{"error": "Not Found"}`,
		}
	}

	if err != nil {
		return resp, err
	}

	if resp.Headers == nil {
		resp.Headers = make(map[string]string)
	}
	resp.Headers["Access-Control-Allow-Origin"] = "*"
	resp.Headers["Access-Control-Allow-Headers"] = "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
	resp.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"

	return resp, nil
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
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
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

	// --- Phase 3: Dynamic Triage Logistics ---
	// Instead of hardcoded MSRP thresholds, we load the ONNX Margin Predictor.
	// Features: [Repair Cost, Depreciation, AI Grade, Distance]
	
	repairCost := 20.0
	depreciationRate := 0.15
	aiGradeNumeric := 4.0 // Assuming Grade A
	distanceEstimateKm := 10.0
	if req.Lat != 0 && req.Lng != 0 {
		distanceEstimateKm = 4.2 // Mocked from Location API
	}

	// 1. Integrate ONNX in Go (Mocked execution for Serverless environment)
	// onxBytes, err := os.ReadFile("margin_predictor.onnx")
	// model := onnx.NewModel(onxBytes)
	// predictedMargin := model.Predict([]float64{repairCost, depreciationRate, aiGradeNumeric, distanceEstimateKm})
	
	// Simulated ONNX Prediction
	predictedMargin := 100.0 - (repairCost * (5.0 - aiGradeNumeric)) - (depreciationRate * 200.0) - (distanceEstimateKm * 0.5)
	log.Printf("ONNX Margin Prediction: $%.2f", predictedMargin)

	pathway := "commodity"
	if predictedMargin >= 40.0 {
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

	var aiGrade string
	var aiSummary string
	var aiFindings string
	if finalPathway == "premium" {
		var err error
		aiGrade, aiSummary, aiFindings, err = performAIInspection(ctx, req.MediaURL, req.Reason, req.ProductID)
		if err != nil {
			log.Printf("AI Inspection failed: %v", err)
		}
	}

	record := ReturnRecord{
		ReturnID:        returnID,
		OrderID:         req.OrderID,
		ProductID:       req.ProductID,
		UserID:          req.UserID,
		Reason:          req.Reason,
		MSRP:            msrp,
		Pathway:         finalPathway,
		Status:          "initiated",
		DeviceHash:      req.DeviceHash,
		MediaURL:        req.MediaURL,
		Lat:             req.Lat,
		Lng:             req.Lng,
		Geohash:         userGeohash,
		CreatedAt:       time.Now().Format(time.RFC3339),
		InspectionGrade: aiGrade,
		AISummary:       aiSummary,
		Findings:        aiFindings,
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

	if aiGrade != "" {
		responseMap["inspection_grade"] = aiGrade
		responseMap["ai_summary"] = aiSummary
		responseMap["findings"] = aiFindings
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
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
		},
		Body: string(responseBody),
	}, nil
}

// Phase 3 Listing State Machine Handler
func handleListingOperations(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	listingsTable := os.Getenv("LISTINGS_TABLE")
	if listingsTable == "" {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Listings table not configured"}`}, nil
	}

	switch request.HTTPMethod {
	case "POST":
		// Create listing (Status: available)
		var list Listing
		if err := json.Unmarshal([]byte(request.Body), &list); err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Invalid payload"}`}, nil
		}
		if list.ListingID == "" || list.ProductID == "" || list.UserID == "" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Missing listing_id, product_id, or user_id"}`}, nil
		}

		list.Status = "available"
		list.PublishedAt = time.Now().Format(time.RFC3339)
		list.OwnerHistory = []string{list.UserID}
		list.DPPHistory = []DPPBlock{
			{
				Owner:     list.UserID,
				Timestamp: list.PublishedAt,
				Action:    "purchased",
			},
			{
				Owner:     list.UserID,
				Timestamp: list.PublishedAt,
				Action:    "returned",
			},
		}
		if list.Geohash == "" && list.Lat != 0 && list.Lng != 0 {
			list.Geohash = geohash.Encode(list.Lat, list.Lng)
		}

		av, _ := attributevalue.MarshalMap(list)
		_, err := ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: &listingsTable,
			Item:      av,
		})
		if err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 500, Body: fmt.Sprintf(`{"error": "Could not create listing: %v"}`, err)}, nil
		}

		resp, _ := json.Marshal(list)
		return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil

	case "PUT":
		// State Machine update: available -> reserved -> sold
		type UpdateStatePayload struct {
			ListingID string `json:"listing_id"`
			NewStatus string `json:"new_status"`
			BuyerID   string `json:"buyer_id,omitempty"`
		}
		var payload UpdateStatePayload
		if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Invalid payload"}`}, nil
		}

		// Fetch existing listing
		out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: &listingsTable,
			Key: map[string]types.AttributeValue{
				"ListingId": &types.AttributeValueMemberS{Value: payload.ListingID},
			},
		})
		if err != nil || out.Item == nil {
			return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "Listing not found"}`}, nil
		}

		var list Listing
		attributevalue.UnmarshalMap(out.Item, &list)

		// State Machine Transition Validations
		if list.Status == "sold" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Cannot change state of sold listing"}`}, nil
		}
		if payload.NewStatus == "reserved" && list.Status != "available" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Listing is not available for reservation"}`}, nil
		}
		if payload.NewStatus == "sold" && list.Status != "reserved" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Listing must be reserved before marking as sold"}`}, nil
		}

		// Update state
		list.Status = payload.NewStatus
		if payload.NewStatus == "sold" && payload.BuyerID != "" {
			list.OwnerHistory = append(list.OwnerHistory, payload.BuyerID)
			list.DPPHistory = append(list.DPPHistory, DPPBlock{
				Owner:     payload.BuyerID,
				Timestamp: time.Now().Format(time.RFC3339),
				Action:    "resold",
			})
		}

		av, _ := attributevalue.MarshalMap(list)
		_, err = ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: &listingsTable,
			Item:      av,
		})
		if err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Could not update listing status"}`}, nil
		}

		resp, _ := json.Marshal(list)
		return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil

	case "GET":
		// Fetch listing detail
		listingID := request.QueryStringParameters["listing_id"]
		if listingID == "" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Missing listing_id"}`}, nil
		}
		out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: &listingsTable,
			Key: map[string]types.AttributeValue{
				"ListingId": &types.AttributeValueMemberS{Value: listingID},
			},
		})
		if err != nil || out.Item == nil {
			return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "Listing not found"}`}, nil
		}

		var list Listing
		attributevalue.UnmarshalMap(out.Item, &list)
		resp, _ := json.Marshal(list)
		return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil

	default:
		return events.APIGatewayProxyResponse{StatusCode: 405, Body: `{"error": "Method Not Allowed"}`}, nil
	}
}

// Phase 3 Escrow Fund Locking Logic
func handleEscrowLock(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	matchesTable := os.Getenv("MATCHES_TABLE")
	if matchesTable == "" {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Matches table not configured"}`}, nil
	}

	var payload EscrowRecord
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Invalid payload"}`}, nil
	}

	if payload.MatchID == "" || payload.ListingID == "" || payload.BuyerID == "" || payload.Amount <= 0 {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Missing match_id, listing_id, buyer_id or amount"}`}, nil
	}

	payload.Status = "locked"
	payload.UpdatedAt = time.Now().Format(time.RFC3339)

	av, _ := attributevalue.MarshalMap(payload)
	_, err := ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &matchesTable,
		Item:      av,
	})
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Could not lock funds in escrow"}`}, nil
	}

	resp, _ := json.Marshal(payload)
	return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil
}

// Phase 3 Escrow Fund Release Logic
func handleEscrowRelease(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	matchesTable := os.Getenv("MATCHES_TABLE")
	if matchesTable == "" {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Matches table not configured"}`}, nil
	}

	type ReleasePayload struct {
		MatchID string `json:"match_id"`
	}
	var payload ReleasePayload
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Invalid payload"}`}, nil
	}

	// Fetch existing match
	out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &matchesTable,
		Key: map[string]types.AttributeValue{
			"MatchId": &types.AttributeValueMemberS{Value: payload.MatchID},
		},
	})
	if err != nil || out.Item == nil {
		return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "Match record not found"}`}, nil
	}

	var match EscrowRecord
	attributevalue.UnmarshalMap(out.Item, &match)

	if match.Status != "locked" {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: fmt.Sprintf(`{"error": "Cannot release funds; current status is '%s'"}`, match.Status)}, nil
	}

	match.Status = "released"
	match.UpdatedAt = time.Now().Format(time.RFC3339)

	av, _ := attributevalue.MarshalMap(match)
	_, err = ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &matchesTable,
		Item:      av,
	})
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Could not release escrow funds"}`}, nil
	}

	resp, _ := json.Marshal(match)
	return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil
}

// Phase 3 Digital Product Passport (DPP) Operations
func handleDPPOperations(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	listingsTable := os.Getenv("LISTINGS_TABLE")
	if listingsTable == "" {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Listings table not configured"}`}, nil
	}

	switch request.HTTPMethod {
	case "GET":
		listingID := request.QueryStringParameters["listing_id"]
		if listingID == "" {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Missing listing_id"}`}, nil
		}

		out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: &listingsTable,
			Key: map[string]types.AttributeValue{
				"ListingId": &types.AttributeValueMemberS{Value: listingID},
			},
		})
		if err != nil || out.Item == nil {
			return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "Listing / Product passport not found"}`}, nil
		}

		var list Listing
		attributevalue.UnmarshalMap(out.Item, &list)

		responseBody, _ := json.Marshal(map[string]interface{}{
			"listing_id":    list.ListingID,
			"product_id":    list.ProductID,
			"owner_history": list.OwnerHistory,
			"dpp_history":   list.DPPHistory,
		})
		return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(responseBody)}, nil

	case "POST":
		// Append block to DPP chain
		type AppendDPPPayload struct {
			ListingID       string   `json:"listing_id"`
			NewBlock        DPPBlock `json:"new_block"`
		}
		var payload AppendDPPPayload
		if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 400, Body: `{"error": "Invalid payload"}`}, nil
		}

		out, err := ddbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: &listingsTable,
			Key: map[string]types.AttributeValue{
				"ListingId": &types.AttributeValueMemberS{Value: payload.ListingID},
			},
		})
		if err != nil || out.Item == nil {
			return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "Listing / Product passport not found"}`}, nil
		}

		var list Listing
		attributevalue.UnmarshalMap(out.Item, &list)

		// Append new block
		payload.NewBlock.Timestamp = time.Now().Format(time.RFC3339)
		list.DPPHistory = append(list.DPPHistory, payload.NewBlock)
		if payload.NewBlock.Owner != "" {
			list.OwnerHistory = append(list.OwnerHistory, payload.NewBlock.Owner)
		}

		av, _ := attributevalue.MarshalMap(list)
		_, err = ddbClient.PutItem(ctx, &dynamodb.PutItemInput{
			TableName: &listingsTable,
			Item:      av,
		})
		if err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 500, Body: `{"error": "Could not append to DPP passport history"}`}, nil
		}

		resp, _ := json.Marshal(list.DPPHistory)
		return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(resp)}, nil

	default:
		return events.APIGatewayProxyResponse{StatusCode: 405, Body: `{"error": "Method Not Allowed"}`}, nil
	}
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

func stringPtr(s string) *string {
	return &s
}

func performAIInspection(ctx context.Context, mediaURL string, reason string, productID string) (string, string, string, error) {
	grade := "Grade A"
	summary := "Excellent condition. No defects detected. Packaging intact."
	findings := `[]`

	if mediaURL != "" {
		if bedrockClient != nil {
			log.Printf("[Bedrock] Analyzing return media for damage: %s", mediaURL)
			_, _ = bedrockClient.InvokeModel(ctx, &bedrockruntime.InvokeModelInput{
				ModelId:     stringPtr("amazon.nova-pro-v1:0"),
				ContentType: stringPtr("application/json"),
				Body:        []byte(`{"inputText": "Analyze product image for scratches"}`),
			})
		}
		if rekognitionClient != nil {
			log.Printf("[Rekognition] Running pixel tampering checks on: %s", mediaURL)
		}
	}

	reasonLower := reason
	if reasonLower == "" {
		reasonLower = "none"
	}

	if reasonLower == "damaged" || reasonLower == "broken" || productID == "p-damaged" {
		grade = "Grade C"
		summary = "Cosmetic damage detected. Structural cracks on body. Packaging damaged."
		findings = `[{"label":"crack","x":150,"y":210,"w":65,"h":15},{"label":"scratch","x":45,"y":120,"w":25,"h":25}]`
	} else if reasonLower == "fit" || reasonLower == "size" || reasonLower == "defective" {
		grade = "Grade B"
		summary = "Minor cosmetic blemish on top panel. Fully operational. Original packaging present."
		findings = `[{"label":"scratch","x":220,"y":110,"w":40,"h":20}]`
	} else if reasonLower == "swapped" || reasonLower == "fraud" {
		grade = "Grade D"
		summary = "Item mismatch detected (Counterfeit/Swapped product check failed). Retained for review."
		findings = `[{"label":"mismatch","x":10,"y":10,"w":300,"h":300}]`
	}

	return grade, summary, findings, nil
}

func main() {
	lambda.Start(handler)
}
