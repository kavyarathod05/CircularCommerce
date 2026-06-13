package main

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
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
	t.Setenv("LISTINGS_TABLE", "Listings")
	t.Setenv("MATCHES_TABLE", "Matches")
	t.Setenv("RETURNS_TABLE", "Returns")
	t.Setenv("CARBON_TABLE", "CarbonMetrics")

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

	t.Run("Premium Pathway with AI Inspection", func(t *testing.T) {
		req := events.APIGatewayProxyRequest{
			Path:       "/return/intercept",
			HTTPMethod: "POST",
			Body:       `{"order_id": "ord-premium-ai", "product_id": "p-high-headphones", "user_id": "usr-11", "reason": "damaged", "lat": 38.8951, "lng": -77.0364, "media_url": "https://s3.amazonaws.com/uploads/box.jpg"}`,
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

		if resMap["pathway"] != "premium" {
			t.Errorf("Expected pathway 'premium', got %v", resMap["pathway"])
		}
		if resMap["inspection_grade"] != "Grade C" {
			t.Errorf("Expected grade 'Grade C', got %v", resMap["inspection_grade"])
		}
		if resMap["ai_summary"] == "" {
			t.Errorf("Expected ai_summary to be populated")
		}
	})

	t.Run("Listing State Machine Transitions", func(t *testing.T) {
		// Mock Listings Table Put/Get
		var savedListing Listing
		mockDDB.PutItemFunc = func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
			attributevalue.UnmarshalMap(params.Item, &savedListing)
			return &dynamodb.PutItemOutput{}, nil
		}
		mockDDB.GetItemFunc = func(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
			itemMap, _ := attributevalue.MarshalMap(savedListing)
			return &dynamodb.GetItemOutput{Item: itemMap}, nil
		}

		// 1. Create Listing
		createReq := events.APIGatewayProxyRequest{
			Path:       "/listing",
			HTTPMethod: "POST",
			Body:       `{"listing_id": "lst-101", "product_id": "p-shoes", "user_id": "usr-1", "asking_price": 4000.0}`,
		}
		resp, _ := handler(context.Background(), createReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to create listing: %s", resp.Body)
		}
		if savedListing.Status != "available" {
			t.Errorf("Expected status available, got %s", savedListing.Status)
		}

		// 2. Reserve Listing
		reserveReq := events.APIGatewayProxyRequest{
			Path:       "/listing",
			HTTPMethod: "PUT",
			Body:       `{"listing_id": "lst-101", "new_status": "reserved"}`,
		}
		resp, _ = handler(context.Background(), reserveReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to reserve listing: %s", resp.Body)
		}
		if savedListing.Status != "reserved" {
			t.Errorf("Expected status reserved, got %s", savedListing.Status)
		}

		// 3. Mark Sold
		soldReq := events.APIGatewayProxyRequest{
			Path:       "/listing",
			HTTPMethod: "PUT",
			Body:       `{"listing_id": "lst-101", "new_status": "sold", "buyer_id": "buyer-99"}`,
		}
		resp, _ = handler(context.Background(), soldReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to mark listing as sold: %s", resp.Body)
		}
		if savedListing.Status != "sold" {
			t.Errorf("Expected status sold, got %s", savedListing.Status)
		}
	})

	t.Run("Escrow Lock and Release", func(t *testing.T) {
		var savedEscrow EscrowRecord
		mockDDB.PutItemFunc = func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
			attributevalue.UnmarshalMap(params.Item, &savedEscrow)
			return &dynamodb.PutItemOutput{}, nil
		}
		mockDDB.GetItemFunc = func(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
			itemMap, _ := attributevalue.MarshalMap(savedEscrow)
			return &dynamodb.GetItemOutput{Item: itemMap}, nil
		}

		// 1. Lock funds
		lockReq := events.APIGatewayProxyRequest{
			Path:       "/escrow/lock",
			HTTPMethod: "POST",
			Body:       `{"match_id": "m-202", "listing_id": "lst-101", "buyer_id": "buyer-99", "amount": 3500.0}`,
		}
		resp, _ := handler(context.Background(), lockReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to lock escrow: %s", resp.Body)
		}
		if savedEscrow.Status != "locked" {
			t.Errorf("Expected status locked, got %s", savedEscrow.Status)
		}

		// 2. Release funds
		releaseReq := events.APIGatewayProxyRequest{
			Path:       "/escrow/release",
			HTTPMethod: "POST",
			Body:       `{"match_id": "m-202"}`,
		}
		resp, _ = handler(context.Background(), releaseReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to release escrow: %s", resp.Body)
		}
		if savedEscrow.Status != "released" {
			t.Errorf("Expected status released, got %s", savedEscrow.Status)
		}
	})

	t.Run("DPP History Trail", func(t *testing.T) {
		var savedListing Listing
		savedListing.ListingID = "lst-dpp"
		savedListing.ProductID = "p-watch"
		savedListing.Status = "available"
		savedListing.OwnerHistory = []string{"usr-init"}
		savedListing.DPPHistory = []DPPBlock{
			{Owner: "usr-init", Action: "purchased", Timestamp: "2026-06-10"},
		}

		mockDDB.GetItemFunc = func(ctx context.Context, params *dynamodb.GetItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error) {
			itemMap, _ := attributevalue.MarshalMap(savedListing)
			return &dynamodb.GetItemOutput{Item: itemMap}, nil
		}
		mockDDB.PutItemFunc = func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
			attributevalue.UnmarshalMap(params.Item, &savedListing)
			return &dynamodb.PutItemOutput{}, nil
		}

		// Append block
		appendReq := events.APIGatewayProxyRequest{
			Path:       "/dpp",
			HTTPMethod: "POST",
			Body:       `{"listing_id": "lst-dpp", "new_block": {"owner": "buyer-2", "action": "returned", "inspection_grade": "Grade A"}}`,
		}
		resp, _ := handler(context.Background(), appendReq)
		if resp.StatusCode != 200 {
			t.Fatalf("Failed to append DPP block: %s", resp.Body)
		}

		if len(savedListing.DPPHistory) != 2 {
			t.Fatalf("Expected 2 blocks in history, got %d", len(savedListing.DPPHistory))
		}
		if savedListing.DPPHistory[1].Action != "returned" || savedListing.DPPHistory[1].InspectionGrade != "Grade A" {
			t.Errorf("Mismatch in appended block values: %v", savedListing.DPPHistory[1])
		}
	})
}
