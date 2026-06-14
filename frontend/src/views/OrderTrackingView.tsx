import { useMemo } from 'react';
import { useLogisticsTelemetry } from '../useLogisticsTelemetry';
import type { FleetVehicle, LogisticsOrder } from '../useLogisticsTelemetry';
import '../LogisticsTelemetry.css';

const STATUS_COLORS: Record<string, string> = {
  pending: '#879596',
  'picked-up': '#FF9900',
  'in-transit': '#007185',
  'out-for-delivery': '#B12704',
  delivered: '#137333',
  returned: '#C5221F',
};

const STATUS_STEPS = ['pending', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  'picked-up': 'Picked up',
  'in-transit': 'On the way',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
};

const VEHICLE_LABELS: Record<string, string> = { bike: 'Bike', van: 'Van', truck: 'Truck', 'ev-pod': 'EV Pod' };

function latLngToXY(lat: number, lng: number) {
  const x = ((lng - 77.55) / 0.25) * 90 + 5;
  const y = ((12.99 - lat) / 0.18) * 90 + 5;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

function pickActiveOrder(orders: LogisticsOrder[]) {
  const demo = orders.find(o => o.orderId === 'ORD-DEMO-BUYER' || o.customerName === 'You');
  if (demo) return demo;
  const priority = ['out-for-delivery', 'in-transit', 'picked-up', 'pending', 'delivered'];
  for (const status of priority) {
    const match = orders.find(o => o.status === status);
    if (match) return match;
  }
  return orders[0] ?? null;
}

function statusIndex(status: string) {
  const idx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);
  return idx >= 0 ? idx : 0;
}

export default function OrderTrackingView() {
  const { fleet, orders, connected, orderUpdates } = useLogisticsTelemetry();

  const activeOrder = useMemo(() => pickActiveOrder(orders), [orders]);
  const courier = useMemo(
    () => (activeOrder?.vehicleId ? fleet.find(v => v.vehicleId === activeOrder.vehicleId) : undefined),
    [fleet, activeOrder?.vehicleId],
  );

  const latestUpdate = useMemo(() => {
    if (!activeOrder) return null;
    return orderUpdates.find(u => u.orderId === activeOrder.orderId) ?? null;
  }, [orderUpdates, activeOrder]);

  if (!activeOrder) {
    return (
      <section className="view-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px dashed #D5D9D9' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#879596' }}>—</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#131A22' }}>No Active Deliveries</h2>
          <p style={{ color: '#565959', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
            You do not have any orders on the way right now. Once you purchase from the local catalog, your delivery will show up here.
          </p>
        </div>
      </section>
    );
  }

  const from = latLngToXY(activeOrder.originLat, activeOrder.originLng);
  const to = latLngToXY(activeOrder.destLat, activeOrder.destLng);
  const courierPos = courier ? latLngToXY(courier.lat, courier.lng) : null;
  const currentStep = statusIndex(activeOrder.status);

  return (
    <section className="view-section ot-root" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>Track Your Delivery</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>
            {activeOrder.productName} · {activeOrder.orderId}
          </p>
        </div>
        <div className={`lt-conn-badge ${connected ? 'lt-conn-live' : ''}`}>
          <span className="lt-conn-dot" /> {connected ? 'LIVE UPDATES' : 'CONNECTING...'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="lt-map-container" style={{ aspectRatio: '16 / 11' }}>
            <div className="lt-map-grid" />
            <svg className="lt-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#007185" strokeWidth="0.35" strokeDasharray="1 0.6" opacity="0.7" />
              <circle cx={from.x} cy={from.y} r="1.2" fill="#FF9900" />
              <text x={from.x} y={from.y + 3.5} textAnchor="middle" fill="#879596" fontSize="2">Pickup</text>
              <circle cx={to.x} cy={to.y} r="1.4" fill="#137333" />
              <text x={to.x} y={to.y + 3.5} textAnchor="middle" fill="#879596" fontSize="2">You</text>
              {courierPos && (
                <g>
                  <circle cx={courierPos.x} cy={courierPos.y} r="2.8" fill="none" stroke="#FF9900" strokeWidth="0.35" className="lt-pulse-ring" />
                  <circle cx={courierPos.x} cy={courierPos.y} r="1.3" fill="#B12704" stroke="#FFF" strokeWidth="0.3" />
                </g>
              )}
            </svg>
            <div className="lt-map-legend">
              <span><span className="lt-legend-dot" style={{ background: '#FF9900' }} /> Pickup hub</span>
              <span><span className="lt-legend-dot" style={{ background: '#137333' }} /> Your address</span>
              {courier && <span><span className="lt-legend-dot" style={{ background: '#B12704' }} /> Courier</span>}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <strong style={{ color: '#131A22' }}>Delivery progress</strong>
              <span style={{ color: STATUS_COLORS[activeOrder.status], fontWeight: 700, textTransform: 'capitalize' }}>
                {activeOrder.status.replace('-', ' ')}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUS_STEPS.length}, 1fr)`, gap: '0.5rem' }}>
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '100%', height: '4px', borderRadius: '999px',
                      background: done ? (active ? STATUS_COLORS[step] : '#137333') : '#E5E7EB',
                      marginBottom: '0.5rem',
                    }} />
                    <span style={{ fontSize: '0.72rem', color: done ? '#131A22' : '#879596', fontWeight: active ? 700 : 500 }}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="lt-progress-wrap" style={{ marginTop: '1rem' }}>
              <div className="lt-progress-bar" style={{ width: `${activeOrder.progress}%`, background: STATUS_COLORS[activeOrder.status] || '#007185' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Estimated arrival
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#131A22', lineHeight: 1.1 }}>
              {activeOrder.status === 'delivered' ? 'Delivered' : `${Math.max(0, Math.round(activeOrder.eta_minutes))} min`}
            </div>
            <p style={{ margin: '0.75rem 0 0', color: '#565959', fontSize: '0.9rem' }}>
              {activeOrder.status === 'delivered'
                ? 'Your item has arrived. Enjoy your SecondLife find.'
                : 'We will notify you when your courier is nearby.'}
            </p>
          </div>

          {courier && activeOrder.status !== 'delivered' && (
            <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Your courier
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#131A22', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {courier.driverName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#131A22' }}>{courier.driverName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#565959' }}>
                    {VEHICLE_LABELS[courier.type] || courier.type} · {Math.round(courier.speed_kmh)} km/h
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#F8F9FA', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
            <div style={{ fontWeight: 700, color: '#131A22', marginBottom: '0.75rem' }}>Order details</div>
            <div style={{ display: 'grid', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: '#565959' }}>Item</span>
                <strong style={{ color: '#131A22', textAlign: 'right' }}>{activeOrder.productName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: '#565959' }}>Delivery type</span>
                <strong style={{ color: '#131A22' }}>{activeOrder.pathway.replace('-', ' ')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ color: '#565959' }}>CO₂ saved vs new</span>
                <strong style={{ color: '#007185' }}>{activeOrder.carbonSaved_kg} kg</strong>
              </div>
            </div>
          </div>

          {latestUpdate && (
            <div style={{ background: '#FFFDF9', border: '1px solid #FFE8C7', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#B12704', fontWeight: 700, marginBottom: '0.35rem' }}>Latest update</div>
              <div style={{ color: '#131A22', fontSize: '0.9rem' }}>
                {latestUpdate.previousStatus.replace('-', ' ')} → {latestUpdate.newStatus.replace('-', ' ')}
              </div>
              <div style={{ color: '#879596', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {new Date(latestUpdate.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
