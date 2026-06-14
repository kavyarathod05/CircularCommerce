import boto3
import time

def create_vto_table():
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    table_name = 'VtoSessionsTable'
    
    try:
        print(f"Creating {table_name}...")
        dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'SessionId', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'SessionId', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        print(f"{table_name} created successfully.")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"{table_name} already exists.")
    except Exception as e:
        print(f"Failed to create table: {e}")

if __name__ == '__main__':
    create_vto_table()
