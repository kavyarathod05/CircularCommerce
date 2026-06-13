package main

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/location"
	locTypes "github.com/aws/aws-sdk-go-v2/service/location/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type MockDynamoDBClient struct {
	GetItemFunc func(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	PutItemFunc func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
}

func (m *MockDynamoDBClient) GetItem(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
	if m.GetItemFunc != nil {
		return m.GetItemFunc(ctx, params, optFns...)
	}
	return &dynamodb.GetItemOutput{}, nil
}

func (m *MockDynamoDBClient) PutItem(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
	if m.PutItemFunc != nil {
		return m.PutItemFunc(ctx, params, optFns...)
	}
	return &dynamodb.PutItemOutput{}, nil
}

type MockS3Presigner struct {
	PresignPutObjectFunc func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error)
}

func (m *MockS3Presigner) PresignPutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.PresignOptions)) (*v4.PresignedHTTPRequest, error) {
	if m.PresignPutObjectFunc != nil {
		return m.PresignPutObjectFunc(ctx, params, optFns...)
	}
	return &v4.PresignedHTTPRequest{URL: "https://mock-presigned-url.com/upload"}, nil
}

type MockLocationClient struct {
	CalculateRouteMatrixFunc func(ctx context.Context, params *location.CalculateRouteMatrixInput, optFns ...func(*location.Options)) (*location.CalculateRouteMatrixOutput, error)
}

func (m *MockLocationClient) CalculateRouteMatrix(ctx context.Context, params *location.CalculateRouteMatrixInput, optFns ...func(*location.Options)) (*location.CalculateRouteMatrixOutput, error) {
	if m.CalculateRouteMatrixFunc != nil {
		return m.CalculateRouteMatrixFunc(ctx, params, optFns...)
	}
	dist := 5.2
	dur := 12.5 * 60.0
	return &location.CalculateRouteMatrixOutput{
		RouteMatrix: [][]locTypes.RouteMatrixEntry{
			{
				{
					Distance:        &dist,
					DurationSeconds: &dur,
				},
				{
					Distance:        &dist,
					DurationSeconds: &dur,
				},
			},
		},
	}, nil
}

func TestHandler_RouteRouting(t *testing.T) {
	t.Setenv("ROUTE_CALCULATOR_NAME", "SecondLifeRouteCalculator")

	mockDDB := &MockDynamoDBClient{
		PutItemFunc: func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
			return &dynamodb.PutItemOutput{}, nil
		},
	}
	mockS3 := &MockS3Presigner{}
	mockLoc := &MockLocationClient{}

	ddbClient = mockDDB
	s3PresignClient = mockS3
	locationClient = mockLoc

	t.Run("404 Route NotFound", func(t *testing.T) {
		req := events.APIGatewayProxyRequest{
			Path:       "/invalid-route",
			HTTPMethod: "GET",
		}
		resp, err := handler(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if resp.StatusCode != 404 {
			t.Errorf("Expected 404, got %d", resp.StatusCode)
		}
	})

	t.Run("Generate Pre-Signed S3 URL", func(t *testing.T) {
		req := events.APIGatewayProxyRequest{
			Path:       "/return/media-url",
			HTTPMethod: "GET",
			QueryStringParameters: map[string]string{
				"filename": "test-photo.jpg",
			},
		}
		resp, err := handler(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Errorf("Expected 200, got %d", resp.StatusCode)
		}
	})

	t.Run("Commodity Spatial Hyperlocal P2P Match", func(t *testing.T) {
		req := events.APIGatewayProxyRequest{
			Path:       "/return/intercept",
			HTTPMethod: "POST",
			Body:       `{"order_id": "ord-p2p", "product_id": "p-low-tshirt", "user_id": "usr-9", "reason": "fit", "lat": 38.8951, "lng": -77.0364}`,
		}
		resp, err := handler(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Fatalf("Expected 200, got %d. Body: %s", resp.StatusCode, resp.Body)
		}

		var resMap map[string]interface{}
		json.Unmarshal([]byte(resp.Body), &resMap)

		if resMap["pathway"] != "hyperlocal-p2p" {
			t.Errorf("Expected pathway 'hyperlocal-p2p', got %v", resMap["pathway"])
		}

		geohashVal, ok := resMap["geohash"].(string)
		if !ok || len(geohashVal) == 0 {
			t.Errorf("Expected geohash to be populated")
		}

		if resMap["transit_distance_km"].(float64) != 5.2 {
			t.Errorf("Expected mocked transit distance 5.2, got %v", resMap["transit_distance_km"])
		}
	})

	t.Run("Commodity Fallback to Locker Dropoff", func(t *testing.T) {
		// Override getListingsNear to return nil so it bypasses P2P match
		oldListingsFunc := getListingsNear
		getListingsNear = func(lat, lng float64) []Listing { return nil }
		defer func() { getListingsNear = oldListingsFunc }()

		mockLoc.CalculateRouteMatrixFunc = func(ctx context.Context, params *location.CalculateRouteMatrixInput, optFns ...func(*location.Options)) (*location.CalculateRouteMatrixOutput, error) {
			return &location.CalculateRouteMatrixOutput{}, errors.New("route matrix failed")
		}

		req := events.APIGatewayProxyRequest{
			Path:       "/return/intercept",
			HTTPMethod: "POST",
			Body:       `{"order_id": "ord-locker", "product_id": "p-low-tshirt", "user_id": "usr-10", "reason": "fit", "lat": 38.8951, "lng": -77.0364}`,
		}
		resp, err := handler(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Fatalf("Expected 200, got %d. Body: %s", resp.StatusCode, resp.Body)
		}

		var resMap map[string]interface{}
		json.Unmarshal([]byte(resp.Body), &resMap)

		if resMap["pathway"] != "locker-dropoff" {
			t.Errorf("Expected pathway 'locker-dropoff', got %v", resMap["pathway"])
		}
	})
}
