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
    
    catalog = [
        { "ListingId": 'lst-101', "ProductId": 'Bose QC Headphones', "Price": Decimal('25000'), "Geohash": 'gcpvj', "Status": 'reserved', "OwnerId": 'usr-arjun' },
        { "ListingId": 'lst-102', "ProductId": 'iPhone 14 Pro Max', "Price": Decimal('120000'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-naman' },
        { "ListingId": 'lst-103', "ProductId": 'Vintage Leather Jacket', "Price": Decimal('12500'), "Geohash": 'gcpvj', "Status": 'sold', "OwnerId": 'usr-kavya' },
        { "ListingId": 'lst-104', "ProductId": 'Sony DualSense Controller', "Price": Decimal('5999'), "Geohash": 'gcpvj', "Status": 'reserved', "OwnerId": 'usr-priya' },
        { "ListingId": 'lst-105', "ProductId": 'iPad Pro 11-inch', "Price": Decimal('85000'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-rahul' },
        { "ListingId": 'lst-106', "ProductId": 'Keychron Mechanical Keyboard', "Price": Decimal('8500'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-amit' },
        { "ListingId": 'lst-107', "ProductId": 'Essentials Cotton Hoodie', "Price": Decimal('2999'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-customer' },
        { "ListingId": 'lst-108', "ProductId": 'Levis Denim Jeans', "Price": Decimal('3499'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-sara' },
        { "ListingId": 'lst-109', "ProductId": 'Amazon Echo Dot', "Price": Decimal('4499'), "Geohash": 'gcpvj', "Status": 'reserved', "OwnerId": 'usr-dev' },
        { "ListingId": 'lst-110', "ProductId": 'Basic White T-Shirt', "Price": Decimal('999'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-sneha' },
        { "ListingId": 'lst-111', "ProductId": 'Milton Thermosteel Bottle', "Price": Decimal('1200'), "Geohash": 'gcpvj', "Status": 'available', "OwnerId": 'usr-vikas' }
    ]
    
    for item in catalog:
        item['Grade'] = 'Grade A'
        item['PriceThreshold'] = item['Price']
        item['EscrowStatus'] = 'Locked (₹19,000)' if item['Status'] == 'reserved' else ('Released' if item['Status'] == 'sold' else 'N/A')
        listings.put_item(Item=item)
    
    print("Seeding complete.")

if __name__ == '__main__':
    setup_tables()
    # Adding a short delay to ensure indexes are fully active
    time.sleep(5)
    seed_data()
