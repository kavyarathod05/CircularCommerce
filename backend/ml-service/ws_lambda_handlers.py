"""
SecondLife Commerce — API Gateway WebSocket Lambda Handlers
============================================================
Handles $connect, $disconnect, sendMessage, and scheduled
telemetry tick broadcasts for the real-time logistics dashboard.

Connections are tracked in a DynamoDB "WsConnections" table.
Each tick, EventBridge triggers the broadcast_tick handler which
posts telemetry data back to all connected clients via the
API Gateway Management API.
"""

import os
import json
import boto3
import logging
from datetime import datetime
from logistics_telemetry import LogisticsTelemetryEngine

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# DynamoDB table for tracking WebSocket connections
CONNECTIONS_TABLE = os.environ.get("WS_CONNECTIONS_TABLE", "WsConnections")
dynamodb = boto3.resource("dynamodb")
connections_table = dynamodb.Table(CONNECTIONS_TABLE)

# Shared telemetry engine (persisted in Lambda execution context between warm invocations)
_engine = LogisticsTelemetryEngine(fleet_size=12, active_orders=24)


def connect_handler(event, context):
    """$connect route — store connection ID in DynamoDB."""
    connection_id = event["requestContext"]["connectionId"]
    try:
        connections_table.put_item(
            Item={
                "connectionId": connection_id,
                "connectedAt": datetime.utcnow().isoformat() + "Z",
            }
        )
        logger.info(f"[WS] Connected: {connection_id}")
    except Exception as e:
        logger.error(f"[WS] Failed to store connection {connection_id}: {e}")
        return {"statusCode": 500, "body": "Failed to connect"}
    return {"statusCode": 200, "body": "Connected"}


def disconnect_handler(event, context):
    """$disconnect route — remove connection ID from DynamoDB."""
    connection_id = event["requestContext"]["connectionId"]
    try:
        connections_table.delete_item(Key={"connectionId": connection_id})
        logger.info(f"[WS] Disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"[WS] Failed to remove connection {connection_id}: {e}")
    return {"statusCode": 200, "body": "Disconnected"}


def message_handler(event, context):
    """Default route — handle client messages (request_snapshot, subscribe, etc.)."""
    connection_id = event["requestContext"]["connectionId"]
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    endpoint_url = f"https://{domain}/{stage}"

    body = json.loads(event.get("body", "{}"))
    action = body.get("action", "")

    apigw = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)

    if action == "request_snapshot":
        # Send full state snapshot to requesting client
        snapshot = {
            "type": "snapshot",
            "fleet": _engine.get_fleet_snapshot(),
            "orders": _engine.get_orders_snapshot(),
            "metrics": _engine.get_metrics(),
            "alerts": _engine.get_alerts(),
        }
        _post_to_connection(apigw, connection_id, snapshot)
    elif action == "ping":
        _post_to_connection(apigw, connection_id, {"type": "pong", "status": "alive"})

    return {"statusCode": 200, "body": "OK"}


def broadcast_tick(event, context):
    """
    Scheduled handler (EventBridge every 2 seconds or 1 minute with batching).
    Ticks the simulation and broadcasts to ALL connected WebSocket clients.
    """
    ws_api_endpoint = os.environ.get("WS_API_ENDPOINT", "")
    if not ws_api_endpoint:
        logger.error("[WS] WS_API_ENDPOINT not configured")
        return {"statusCode": 500}

    apigw = boto3.client("apigatewaymanagementapi", endpoint_url=ws_api_endpoint)

    # Tick simulation
    events_data = _engine.tick()

    # Build message payload
    message = {
        "type": "tick",
        "fleet_positions": events_data["fleet_positions"],
        "metrics": events_data["metrics"],
        "order_updates": events_data.get("order_updates", []),
        "alerts": events_data.get("alerts", []),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    # Get all connected clients
    try:
        response = connections_table.scan(ProjectionExpression="connectionId")
        connections = response.get("Items", [])
    except Exception as e:
        logger.error(f"[WS] Failed to scan connections: {e}")
        return {"statusCode": 500}

    # Broadcast to each
    stale_connections = []
    for conn in connections:
        conn_id = conn["connectionId"]
        try:
            _post_to_connection(apigw, conn_id, message)
        except apigw.exceptions.GoneException:
            stale_connections.append(conn_id)
        except Exception as e:
            logger.warning(f"[WS] Failed to post to {conn_id}: {e}")
            stale_connections.append(conn_id)

    # Clean up stale connections
    for conn_id in stale_connections:
        try:
            connections_table.delete_item(Key={"connectionId": conn_id})
            logger.info(f"[WS] Cleaned stale connection: {conn_id}")
        except Exception:
            pass

    logger.info(
        f"[WS] Broadcast tick to {len(connections) - len(stale_connections)} clients "
        f"({len(stale_connections)} stale removed)"
    )
    return {"statusCode": 200}


def _post_to_connection(apigw_client, connection_id: str, data: dict):
    """Send JSON data to a WebSocket connection via API Gateway Management API."""
    apigw_client.post_to_connection(
        ConnectionId=connection_id,
        Data=json.dumps(data, default=str).encode("utf-8"),
    )
