"""
SecondLife Commerce — Real-Time Logistics WebSocket Server
==========================================================
Standalone Socket.IO server that runs alongside the FastAPI service.
Broadcasts live telemetry at configurable intervals (~2 s).

Run:  python logistics_ws_server.py
Listens on port 8765 by default.
"""

import asyncio
import socketio
import uvicorn
from logistics_telemetry import LogisticsTelemetryEngine

# Create Socket.IO async server with CORS
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# Wrap in ASGI app
app = socketio.ASGIApp(sio, socketio_path="/socket.io")

# Telemetry engine (shared across connections)
engine = LogisticsTelemetryEngine(fleet_size=12, active_orders=24)

# Track connected clients
connected_clients: set = set()


@sio.event
async def connect(sid, environ):
    connected_clients.add(sid)
    print(f"[WS] Client connected: {sid}  (total: {len(connected_clients)})")
    # Send initial full state snapshot on connect
    await sio.emit("fleet:snapshot", engine.get_fleet_snapshot(), to=sid)
    await sio.emit("order:snapshot", engine.get_orders_snapshot(), to=sid)
    await sio.emit("fleet:metrics", engine.get_metrics(), to=sid)
    await sio.emit("alert:history", engine.get_alerts(), to=sid)


@sio.event
async def disconnect(sid):
    connected_clients.discard(sid)
    print(f"[WS] Client disconnected: {sid}  (total: {len(connected_clients)})")


@sio.event
async def request_snapshot(sid, data=None):
    """Client can explicitly request a full snapshot."""
    await sio.emit("fleet:snapshot", engine.get_fleet_snapshot(), to=sid)
    await sio.emit("order:snapshot", engine.get_orders_snapshot(), to=sid)
    await sio.emit("fleet:metrics", engine.get_metrics(), to=sid)
    await sio.emit("alert:history", engine.get_alerts(), to=sid)


@sio.event
async def subscribe_channel(sid, data):
    """Let clients subscribe to specific channels (future use)."""
    channel = data.get("channel", "all") if isinstance(data, dict) else "all"
    print(f"[WS] {sid} subscribed to channel: {channel}")
    await sio.emit("subscribed", {"channel": channel}, to=sid)


# ---------------------------------------------------------------------------
# Background telemetry broadcast loop
# ---------------------------------------------------------------------------
async def telemetry_loop():
    """Runs forever, ticking the simulation and broadcasting deltas."""
    while True:
        if connected_clients:
            events = engine.tick()
            await sio.emit("fleet:position", events["fleet_positions"])
            await sio.emit("fleet:metrics", events["metrics"])
            if events["order_updates"]:
                await sio.emit("order:status", events["order_updates"])
                # Also send updated full order list for consistency
                await sio.emit("order:snapshot", engine.get_orders_snapshot())
            if events["alerts"]:
                await sio.emit("alert:dispatch", events["alerts"])
        else:
            # Still tick to keep sim alive
            engine.tick()
        await asyncio.sleep(2)


@sio.event
async def ping_check(sid, data=None):
    await sio.emit("pong_check", {"status": "alive", "clients": len(connected_clients)}, to=sid)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import signal

    _bg_task = None

    async def start_background():
        global _bg_task
        _bg_task = asyncio.ensure_future(telemetry_loop())

    async def shutdown():
        if _bg_task:
            _bg_task.cancel()

    @sio.event
    async def startup(sid=None, data=None):
        pass  # handled below

    async def main():
        print("=" * 60)
        print("  SecondLife Commerce — Logistics Telemetry WS Server")
        print("  Listening on ws://0.0.0.0:8765/socket.io")
        print("=" * 60)

        config = uvicorn.Config(app, host="0.0.0.0", port=8765, log_level="info")
        server = uvicorn.Server(config)

        # Start the telemetry broadcast loop alongside uvicorn
        loop = asyncio.get_event_loop()
        bg = loop.create_task(telemetry_loop())

        try:
            await server.serve()
        finally:
            bg.cancel()

    asyncio.run(main())

