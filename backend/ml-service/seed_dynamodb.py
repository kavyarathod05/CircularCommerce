import boto3
import time
from decimal import Decimal

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

def create_table(table_name, key_schema, attribute_definitions, global_secondary_indexes=None):
    try:
        print(f"Creating {table_name}...")
        kwargs = {
            'TableName': table_name,
            'KeySchema': key_schema,
            'AttributeDefinitions': attribute_definitions,
            'BillingMode': 'PAY_PER_REQUEST'
        }
        if global_secondary_indexes:
            kwargs['GlobalSecondaryIndexes'] = global_secondary_indexes
            
        dynamodb.create_table(**kwargs)
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"{table_name} created successfully.")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"{table_name} already exists.")

def setup_tables():
    # 1. OrdersTable
    create_table(
        'OrdersTable',
        [{'AttributeName': 'OrderId', 'KeyType': 'HASH'}],
        [{'AttributeName': 'OrderId', 'AttributeType': 'S'}]
    )
    
    # 2. ReturnsTable
    create_table(
        'ReturnsTable',
        [{'AttributeName': 'ReturnId', 'KeyType': 'HASH'}],
        [
            {'AttributeName': 'ReturnId', 'AttributeType': 'S'},
            {'AttributeName': 'UserId', 'AttributeType': 'S'}
        ],
        global_secondary_indexes=[{
            'IndexName': 'UserId-index',
            'KeySchema': [{'AttributeName': 'UserId', 'KeyType': 'HASH'}],
            'Projection': {'ProjectionType': 'ALL'}
        }]
    )
    
    # 3. ListingsTable
    create_table(
        'ListingsTable',
        [{'AttributeName': 'ListingId', 'KeyType': 'HASH'}],
        [
            {'AttributeName': 'ListingId', 'AttributeType': 'S'},
            {'AttributeName': 'Geohash', 'AttributeType': 'S'}
        ],
        global_secondary_indexes=[{
            'IndexName': 'Geohash-index',
            'KeySchema': [{'AttributeName': 'Geohash', 'KeyType': 'HASH'}],
            'Projection': {'ProjectionType': 'ALL'}
        }]
    )
    
    # 4. MatchesTable
    create_table(
        'MatchesTable',
        [{'AttributeName': 'MatchId', 'KeyType': 'HASH'}],
        [{'AttributeName': 'MatchId', 'AttributeType': 'S'}]
    )

def seed_data():
    resource = boto3.resource('dynamodb', region_name='us-east-1')
    
    print("Seeding OrdersTable...")
    orders = resource.Table('OrdersTable')
    orders.put_item(Item={'OrderId': 'ORD-1', 'ProductId': 'p-smartphone', 'OriginalPrice': Decimal('95000'), 'SellerId': 'S1'})
    orders.put_item(Item={'OrderId': 'ORD-2', 'ProductId': 'p-smartphone', 'OriginalPrice': Decimal('90000'), 'SellerId': 'S2'})
    
    print("Seeding ReturnsTable...")
    returns = resource.Table('ReturnsTable')
    # usr-1 will have 4 returns to trigger the predictive friction limit
    for i in range(4):
        returns.put_item(Item={'ReturnId': f'RET-U1-{i}', 'UserId': 'usr-12', 'DeviceId': 'D1', 'IPAddress': '192.168.1.1', 'TrustScore': Decimal('80')})
    # usr-2
    returns.put_item(Item={'ReturnId': 'RET-U2-1', 'UserId': 'usr-2', 'DeviceId': 'D1', 'IPAddress': '192.168.1.1', 'TrustScore': Decimal('30')})
    
    print("Seeding ListingsTable...")
    listings = resource.Table('ListingsTable')
    listings.put_item(Item={
        'ListingId': 'LST-1', 
        'ProductId': 'p-smartphone', 
        'Price': Decimal('85000'), 
        'Geohash': 'gcpvj', 
        'Status': 'available',
        'OwnerId': 'B001',
        'PriceThreshold': Decimal('100000'),
        'ElectronicsAffinity': Decimal('0.9'),
        'ApparelAffinity': Decimal('0.1'),
        'RecencyScore': Decimal('0.8')
    })
    listings.put_item(Item={
        'ListingId': 'LST-2', 
        'ProductId': 'p-smartphone', 
        'Price': Decimal('87000'), 
        'Geohash': 'gcpvj', 
        'Status': 'available',
        'OwnerId': 'B002',
        'PriceThreshold': Decimal('90000'),
        'ElectronicsAffinity': Decimal('0.8'),
        'ApparelAffinity': Decimal('0.2'),
        'RecencyScore': Decimal('0.9')
    })
    
    print("Seeding complete.")

if __name__ == '__main__':
    setup_tables()
    # Adding a short delay to ensure indexes are fully active
    time.sleep(5)
    seed_data()
