import boto3
import time
from decimal import Decimal

def setup_dynamodb():
    print("Connecting to AWS...")
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    
    table_name = 'SecondLife_Listings'
    
    # Check if table exists
    try:
        dynamodb.describe_table(TableName=table_name)
        print(f"Table {table_name} already exists. Skipping creation.")
    except dynamodb.exceptions.ResourceNotFoundException:
        print(f"Creating DynamoDB Table: {table_name}...")
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'listingId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'listingId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        
        print("Waiting for table to become ACTIVE...")
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print("Table created successfully!")

    print("Seeding initial data...")
    table = boto3.resource('dynamodb', region_name='us-east-1').Table(table_name)
    
    seed_data = [
        {
            "listingId": "LST-9021",
            "name": "Sony WH-1000XM5 Wireless Headphones",
            "msrp": Decimal('349.99'),
            "condition": "Like New",
            "discount": Decimal('15'),
            "sellerDistance": Decimal('1.2'),
            "status": "available",
            "escrowStatus": "N/A",
            "image": "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SX679_.jpg"
        },
        {
            "listingId": "LST-3844",
            "name": "Patagonia Men's Better Sweater",
            "msrp": Decimal('149.00'),
            "condition": "Minor Defect (Repaired)",
            "discount": Decimal('40'),
            "sellerDistance": Decimal('3.4'),
            "status": "reserved",
            "escrowStatus": "Locked",
            "image": "https://m.media-amazon.com/images/I/71u+fDOf3sL._AC_SY741_.jpg"
        },
        {
            "listingId": "LST-1102",
            "name": "Apple iPad Air (5th Gen)",
            "msrp": Decimal('599.00'),
            "condition": "Good",
            "discount": Decimal('20'),
            "sellerDistance": Decimal('5.1'),
            "status": "sold",
            "escrowStatus": "Released",
            "image": "https://m.media-amazon.com/images/I/61k05QwLuML._AC_SX679_.jpg"
        }
    ]
    
    for item in seed_data:
        try:
            # We use put_item with ConditionExpression to not overwrite if they already seeded it and transitioned states
            table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(listingId)'
            )
            print(f"Seeded {item['listingId']}")
        except Exception as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                print(f"Item {item['listingId']} already exists, skipping.")
            else:
                print(f"Error seeding {item['listingId']}: {e}")

    print("AWS DynamoDB Setup Complete!")

if __name__ == '__main__':
    setup_dynamodb()
