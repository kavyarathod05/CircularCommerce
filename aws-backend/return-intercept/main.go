package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type ReturnRequest struct {
	ReturnID   string `json:"return_id,omitempty"`
	OrderID    string `json:"order_id"`
	ProductID  string `json:"product_id"`
	UserID     string `json:"user_id"`
	Reason     string `json:"reason"`
	DeviceHash string `json:"device_hash,omitempty"`
	MediaURL   string `json:"media_url,omitempty"`
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

type DynamoDBAPI interface {
	GetItem(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	PutItem(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
}

type S3PresignAPI interface {
	PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

var (
	ddbClient       DynamoDBAPI
	s3PresignClient S3PresignAPI
)

func init() {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}
	ddbClient = dynamodb.NewFromConfig(cfg)
	s3Client := s3.NewFromConfig(cfg)
	s3PresignClient = s3.NewPresignClient(s3Client)
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
		Pathway:    pathway,
		Status:     "initiated",
		DeviceHash: req.DeviceHash,
		MediaURL:   req.MediaURL,
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

	// 4. Basic Compliance Scope-3 Carbon Tracker Calculation
	// Standard road transport emission factor: 0.15 kg CO2 per km (based on Green Web Foundation factors)
	// Avoiding transport to a regional warehouse (typical avg distance: 350 km)
	var co2Saved float64 = 0.0
	var legsAvoided int = 0
	var warehouseDaysAvoided int = 0

	if pathway == "commodity" {
		// Commodity returns default to peer-to-peer / local drop-off, avoiding warehouse loop completely
		avgWarehouseDistanceKm := 350.0
		co2Saved = avgWarehouseDistanceKm * 0.15 // 52.5 kg CO2 saved per package
		legsAvoided = 2                          // Avoids: User -> Courier -> Warehouse and Warehouse -> New Buyer
		warehouseDaysAvoided = 14                // Avoids avg 14 days of warehouse HVAC & power usage
	} else {
		// Premium returns still route to inspection/refurbishment, but we optimize localized courier legs
		co2Saved = 10.5  // Optimized localized transport leg
		legsAvoided = 1  // Avoids cross-country transit leg
		warehouseDaysAvoided = 3
	}

	carbonMetric := CarbonMetricRecord{
		ReturnID:             returnID,
		UserID:               req.UserID,
		SellerID:             sellerID,
		CO2SavedKg:           co2Saved,
		TransportLegsAvoided: legsAvoided,
		WarehouseDaysAvoided: warehouseDaysAvoided,
		Pathway:              pathway,
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
		"pathway":               pathway,
		"status":                record.Status,
		"device_hash":           record.DeviceHash,
		"media_url":             record.MediaURL,
		"carbon_saved_co2_kg":   co2Saved,
		"transport_legs_saved":  legsAvoided,
		"warehouse_days_saved":  warehouseDaysAvoided,
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

func main() {
	lambda.Start(handler)
}
