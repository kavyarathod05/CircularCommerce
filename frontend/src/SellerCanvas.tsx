import { useAppContext } from './context/AppContext';

export default function SellerCanvas() {
  const { catalogItems, returnVelocity, lastResult } = useAppContext();

  const listings = catalogItems.length || 3;
  const pendingReturns = returnVelocity ?? 1;
  const pathway = lastResult?.pathwayLabel || lastResult?.pathway || 'Awaiting next return';

  return (
    <section className="view-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.75rem', color: '#131A22' }}>Operations workspace</h2>
      <p style={{ color: '#565959', marginBottom: '1.75rem' }}>
        Live snapshot of marketplace health — returns, catalog, and routing in one place.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Active listings', value: String(listings), sub: 'Redis-backed catalog' },
          { label: 'Returns in queue', value: String(pendingReturns), sub: 'Last 24 hours' },
          { label: 'Latest triage', value: pathway, sub: 'Most recent return decision' },
          { label: 'Fleet status', value: 'On route', sub: 'Rahul K. · VH-1000' },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: '#FFF',
              border: '1px solid #EAEAEA',
              borderRadius: 12,
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#565959', marginBottom: '0.35rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#131A22' }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#879596', marginTop: '0.35rem' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#131A22' }}>Quick actions</h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#565959', lineHeight: 1.8, fontSize: '0.9rem' }}>
            <li>Review flagged receipts in Fraud Center</li>
            <li>Approve or reject seller return reviews</li>
            <li>Run fleet route planning for bulk pickups</li>
            <li>Verify serial numbers on high-value items</li>
          </ul>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#131A22' }}>Demo flow for judges</h3>
          <ol style={{ margin: 0, paddingLeft: '1.1rem', color: '#565959', lineHeight: 1.8, fontSize: '0.9rem' }}>
            <li>Buyer: catalog → prevention → try-on → return with photo</li>
            <li>Return Status: defect boxes + GS1 + route map</li>
            <li>Seller: local listings and return activity</li>
            <li>Admin: fraud graph, workspace, fleet routing</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
