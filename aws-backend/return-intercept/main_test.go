package main

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
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

func TestHandler_RouteRouting(t *testing.T) {
	mockDDB := &MockDynamoDBClient{
		PutItemFunc: func(ctx context.Context, params *dynamodb.PutItemInput, optFns ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error) {
			return &dynamodb.PutItemOutput{}, nil
		},
	}
	mockS3 := &MockS3Presigner{}

	ddbClient = mockDDB
	s3PresignClient = mockS3

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

		var resMap map[string]string
		json.Unmarshal([]byte(resp.Body), &resMap)
		if resMap["upload_url"] != "https://mock-presigned-url.com/upload" {
			t.Errorf("Expected mock upload URL, got %s", resMap["upload_url"])
		}
	})

	t.Run("Intercept Return Request With Scope-3 Carbon Calculations", func(t *testing.T) {
		req := events.APIGatewayProxyRequest{
			Path:       "/return/intercept",
			HTTPMethod: "POST",
			Body:       `{"order_id": "ord-999", "product_id": "p-low-tshirt", "user_id": "usr-5", "reason": "fit"}`,
		}
		resp, err := handler(context.Background(), req)
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Errorf("Expected 200, got %d", resp.StatusCode)
		}

		var resMap map[string]interface{}
		json.Unmarshal([]byte(resp.Body), &resMap)

		// Verification of carbon tracker output
		co2Saved, ok := resMap["carbon_saved_co2_kg"].(float64)
		if !ok || co2Saved != 52.5 {
			t.Errorf("Expected co2Saved 52.5 for commodity pathway, got %v", resMap["carbon_saved_co2_kg"])
		}

		legsSaved, ok := resMap["transport_legs_saved"].(float64)
		if !ok || legsSaved != 2 {
			t.Errorf("Expected 2 transport legs saved, got %v", resMap["transport_legs_saved"])
		}

		daysSaved, ok := resMap["warehouse_days_saved"].(float64)
		if !ok || daysSaved != 14 {
			t.Errorf("Expected 14 warehouse days saved, got %v", resMap["warehouse_days_saved"])
		}
	})
}
