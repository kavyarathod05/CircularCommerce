import { useLogisticsTelemetry } from '../useLogisticsTelemetry';

export default function SellerDeliveryOverview() {
  const { orders, metrics, connected } = useLogisticsTelemetry();
  const active = orders.filter(o => !['delivered', 'returned'].includes(o.status)).slice(0, 6);
  const recentDelivered = orders.filter(o => o.status === 'delivered').slice(0, 3);

  return (
    <section className="view-section" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>Deliveries</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>Orders leaving your store and reaching customers today.</p>
        </div>
        <span style={{ padding: '0.35rem 0.9rem', borderRadius: '999px', background: connected ? '#E6F4EA' : '#F3F4F6', color: connected ? '#137333' : '#879596', fontSize: '0.78rem', fontWeight: 700 }}>
          {connected ? 'Live' : 'Connecting'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'In transit', value: metrics.ordersInTransit },
          { label: 'Delivered today', value: metrics.ordersDelivered },
          { label: 'Avg ETA', value: `${Math.round(metrics.avgETA)} min` },
          { label: 'On-time rate', value: `${metrics.onTimeRate}%` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#131A22' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#565959', marginTop: '0.25rem' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.25rem' }}>
        <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#131A22' }}>Active shipments</h3>
          {active.length === 0 ? (
            <p style={{ color: '#879596', margin: 0 }}>No active deliveries right now.</p>
          ) : active.map(o => (
            <div key={o.orderId} style={{ padding: '0.85rem 0', borderBottom: '1px solid #F0F2F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <strong style={{ color: '#131A22' }}>{o.productName}</strong>
                <span style={{ color: '#007185', fontWeight: 600, textTransform: 'capitalize' }}>{o.status.replace('-', ' ')}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#565959', marginTop: '0.25rem' }}>
                {o.orderId} · ETA {Math.round(o.eta_minutes)} min · {o.customerName}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#131A22' }}>Recently delivered</h3>
          {recentDelivered.length === 0 ? (
            <p style={{ color: '#879596', margin: 0 }}>Completed deliveries will appear here.</p>
          ) : recentDelivered.map(o => (
            <div key={o.orderId} style={{ padding: '0.85rem 0', borderBottom: '1px solid #F0F2F2' }}>
              <strong style={{ color: '#131A22' }}>{o.productName}</strong>
              <div style={{ fontSize: '0.85rem', color: '#565959', marginTop: '0.25rem' }}>
                Delivered to {o.customerName} · saved {o.carbonSaved_kg} kg CO₂
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
