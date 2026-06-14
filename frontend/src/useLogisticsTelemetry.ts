import { useState, useEffect, useRef, useCallback } from 'react';

export interface FleetVehicle {
  vehicleId: string; type: string; status: string; driverId: string; driverName: string;
  hub: string; lat: number; lng: number; heading: number; speed_kmh: number;
  fuel_pct: number; capacity_used: number; capacity_total: number;
  ordersCarrying: number; eta_minutes: number; last_ping: string;
}

export interface LogisticsOrder {
  orderId: string; productName: string; status: string; progress: number;
  originHub: string; destinationHub: string; originLat: number; originLng: number;
  destLat: number; destLng: number; vehicleId: string | null; eta_minutes: number;
  customerName: string; pathway: string; carbonSaved_kg: number;
  createdAt: string; updatedAt: string;
}

export interface LogisticsAlert {
  alertId: string; type: string; severity: string; message: string;
  timestamp: string; vehicleId: string; lat: number; lng: number;
}

export interface FleetMetrics {
  totalFleetSize: number; activeVehicles: number; idleVehicles: number;
  returningVehicles: number; fleetUtilization: number; totalOrders: number;
  ordersInTransit: number; ordersDelivered: number; ordersPending: number;
  avgETA: number; totalCarbonSaved_kg: number; onTimeRate: number;
  alertCount: number; avgSpeed_kmh: number; timestamp: string;
}

export interface OrderUpdate {
  orderId: string; previousStatus: string; newStatus: string; timestamp: string;
}

const DEFAULT_METRICS: FleetMetrics = {
  totalFleetSize: 0, activeVehicles: 0, idleVehicles: 0, returningVehicles: 0,
  fleetUtilization: 0, totalOrders: 0, ordersInTransit: 0, ordersDelivered: 0,
  ordersPending: 0, avgETA: 0, totalCarbonSaved_kg: 0, onTimeRate: 0,
  alertCount: 0, avgSpeed_kmh: 0, timestamp: new Date().toISOString(),
};

export function useLogisticsTelemetry() {
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([]);
  const [metrics, setMetrics] = useState<FleetMetrics>(DEFAULT_METRICS);
  const [connected, setConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsMode = useRef(false);

  const mlApiUrl = (import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000');
  const wsUrl = (import.meta.env.VITE_WS_URL || 'http://127.0.0.1:8765');

  // Detect if the WS URL is an AWS API Gateway WebSocket endpoint (wss://)
  const isAwsWs = wsUrl.startsWith('wss://');

  const loadInitialSnapshot = useCallback(async () => {
    try {
      const [fleetRes, ordRes, metricsRes, alertsRes] = await Promise.all([
        fetch(`${mlApiUrl}/api/v1/logistics/fleet`),
        fetch(`${mlApiUrl}/api/v1/logistics/orders`),
        fetch(`${mlApiUrl}/api/v1/logistics/metrics`),
        fetch(`${mlApiUrl}/api/v1/logistics/alerts`),
      ]);
      const [fleetJson, ordJson, metricsJson, alertsJson] = await Promise.all([
        fleetRes.json(), ordRes.json(), metricsRes.json(), alertsRes.json(),
      ]);
      if (fleetJson.status === 'success') setFleet(fleetJson.data);
      if (ordJson.status === 'success') setOrders(ordJson.data);
      if (metricsJson.status === 'success') setMetrics(metricsJson.data);
      if (alertsJson.status === 'success') setAlerts(alertsJson.data);
      setConnected(true);
    } catch (e) {
      console.error('[Telemetry] Initial snapshot failed', e);
    }
  }, [mlApiUrl]);

  // Try WebSocket first, fall back to REST polling
  useEffect(() => {
    let socket: any = null;
    let nativeWs: WebSocket | null = null;
    let destroyed = false;
    let pollingStarted = false;

    function startPolling() {
      if (wsMode.current || destroyed || pollingStarted) return;
      pollingStarted = true;
      setConnected(true);
      console.log('[Telemetry] REST polling mode');

      const poll = async () => {
        try {
          const res = await fetch(`${mlApiUrl}/api/v1/logistics/tick`);
          const json = await res.json();
          if (json.status === 'success' && json.data) {
            const d = json.data;
            if (d.fleet_positions) setFleet(d.fleet_positions);
            if (d.metrics) setMetrics(d.metrics);
            if (d.order_updates?.length) {
              setOrderUpdates(prev => [...d.order_updates, ...prev].slice(0, 50));
            }
            if (d.alerts?.length) {
              setAlerts(prev => [...d.alerts, ...prev].slice(0, 30));
            }
          }
          const ordRes = await fetch(`${mlApiUrl}/api/v1/logistics/orders`);
          const ordJson = await ordRes.json();
          if (ordJson.status === 'success') setOrders(ordJson.data);
        } catch (e) { console.error('[Telemetry] Poll error', e); }
      };

      poll();
      intervalRef.current = setInterval(poll, 2500);
    }

    // ---- Strategy A: AWS API Gateway WebSocket (native WebSocket) ----
    function tryAwsWebSocket() {
      try {
        nativeWs = new WebSocket(wsUrl);

        nativeWs.onopen = () => {
          if (destroyed) return;
          wsMode.current = true;
          setConnected(true);
          console.log('[Telemetry] AWS WebSocket connected');
          // Request initial snapshot
          nativeWs?.send(JSON.stringify({ action: 'request_snapshot' }));
        };

        nativeWs.onmessage = (event) => {
          if (destroyed) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'snapshot') {
              // Full snapshot from server
              if (msg.fleet) setFleet(msg.fleet);
              if (msg.orders) setOrders(msg.orders);
              if (msg.metrics) setMetrics(msg.metrics);
              if (msg.alerts) setAlerts(msg.alerts);
            } else if (msg.type === 'tick') {
              // Incremental tick update
              if (msg.fleet_positions) setFleet(msg.fleet_positions);
              if (msg.metrics) setMetrics(msg.metrics);
              if (msg.order_updates?.length) {
                setOrderUpdates(prev => [...msg.order_updates, ...prev].slice(0, 50));
              }
              if (msg.alerts?.length) {
                setAlerts(prev => [...msg.alerts, ...prev].slice(0, 30));
              }
            }
          } catch (e) {
            console.error('[Telemetry] Parse error', e);
          }
        };

        nativeWs.onclose = () => {
          if (!destroyed) {
            setConnected(false);
            console.log('[Telemetry] AWS WebSocket closed, falling back to REST');
            startPolling();
          }
        };

        nativeWs.onerror = () => {
          console.log('[Telemetry] AWS WebSocket error, falling back to REST');
          nativeWs?.close();
          if (!destroyed) startPolling();
        };
      } catch {
        if (!destroyed) startPolling();
      }
    }

    // ---- Strategy B: Socket.IO WebSocket (local dev / SocketCluster-style) ----
    async function trySocketIO() {
      try {
        const { io } = await import('socket.io-client');
        socket = io(wsUrl, { transports: ['websocket', 'polling'], reconnectionAttempts: 3, timeout: 4000 });

        socket.on('connect', () => {
          if (destroyed) return;
          wsMode.current = true;
          setConnected(true);
          console.log('[Telemetry] Socket.IO connected');
        });

        socket.on('fleet:snapshot', (data: FleetVehicle[]) => { if (!destroyed) setFleet(data); });
        socket.on('fleet:position', (data: FleetVehicle[]) => { if (!destroyed) setFleet(data); });
        socket.on('order:snapshot', (data: LogisticsOrder[]) => { if (!destroyed) setOrders(data); });
        socket.on('order:status', (data: OrderUpdate[]) => {
          if (!destroyed) setOrderUpdates(prev => [...data, ...prev].slice(0, 50));
        });
        socket.on('fleet:metrics', (data: FleetMetrics) => { if (!destroyed) setMetrics(data); });
        socket.on('alert:dispatch', (data: LogisticsAlert[]) => {
          if (!destroyed) setAlerts(prev => [...data, ...prev].slice(0, 30));
        });
        socket.on('alert:history', (data: LogisticsAlert[]) => { if (!destroyed) setAlerts(data); });

        socket.on('disconnect', () => { if (!destroyed) setConnected(false); });
        socket.on('connect_error', () => {
          console.log('[Telemetry] Socket.IO failed, falling back to REST polling');
          socket?.disconnect();
          if (!destroyed) startPolling();
        });
      } catch {
        if (!destroyed) startPolling();
      }
    }

    // ---- Strategy C: REST Polling Fallback ----
    // (startPolling defined above)

    // ---- Connect ----
    loadInitialSnapshot();

    if (isAwsWs) {
      tryAwsWebSocket();
    } else {
      trySocketIO();
      // If Socket.IO is unavailable, don't wait for multiple retries before showing live updates
      const fallbackTimer = setTimeout(() => {
        if (!destroyed && !wsMode.current) startPolling();
      }, 3000);
      return () => {
        destroyed = true;
        clearTimeout(fallbackTimer);
        socket?.disconnect();
        nativeWs?.close();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    return () => {
      destroyed = true;
      socket?.disconnect();
      nativeWs?.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadInitialSnapshot, isAwsWs, mlApiUrl, wsUrl]);

  return { fleet, orders, alerts, metrics, connected, orderUpdates };
}
