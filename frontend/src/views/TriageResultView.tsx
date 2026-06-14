import { useAppContext } from '../context/AppContext';

const PATHWAY_NEXT: Record<string, string> = {
  'hyperlocal-p2p': 'Matched to a local buyer nearby',
  'locker-dropoff': 'Drop off at a nearby locker',
  'refurbish': 'Sent for refurbishment',
  'premium': 'Instant refund approved',
};

const PRODUCT_NAMES: Record<string, string> = {
  'p-headphones-premium': 'Bose QuietComfort Headphones',
  'p-smartphone-premium': 'iPhone 14 Pro Max',
  'p-tshirt-commodity': 'Essentials Cotton T-Shirt',
};

export default function TriageResultView() {
  const { userRole, activeTab, lastResult } = useAppContext();
  if (!(userRole === 'buyer' && activeTab === 'result')) return null;

  const imageUrl = lastResult?.inspectionImageUrl || lastResult?.mediaUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
  const productName = lastResult ? (PRODUCT_NAMES[lastResult.productId] || lastResult.productId) : '';
  const gs1 = lastResult?.gs1;

  return (
    <section className="view-section" style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.8rem', color: '#131A22' }}>Return Status</h2>
      <p style={{ color: '#565959', marginBottom: '1.5rem' }}>Your return has been reviewed and routed.</p>

      {!lastResult ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#F8F9FA', borderRadius: '12px', border: '1px dashed #D5D9D9' }}>
          No return submitted yet. Start a return from the Returns section.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#131A22' }}>Refund summary</h3>
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Return ID</span><strong>#RET-{lastResult.orderId.substring(0, 4)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Item</span><strong>{productName}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Refund</span><strong style={{ color: '#137333' }}>₹{lastResult.msrp.toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Condition</span><strong>{lastResult.grade}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Next step</span><strong style={{ color: '#FF9900' }}>{lastResult.pathwayLabel || PATHWAY_NEXT[lastResult.pathway] || 'Return confirmed'}</strong></div>
              </div>
              <p style={{ margin: '1rem 0 0', padding: '0.85rem', background: '#F8F9FA', borderRadius: '8px', color: '#565959', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {lastResult.summary}
              </p>
            </div>

            <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#131A22' }}>Condition check</h3>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: '10px', overflow: 'hidden', background: '#F8F9FA', border: '1px solid #EAEAEA' }}>
                <img src={imageUrl} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {lastResult.bboxes.map((box, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${(box.x / 320) * 100}%`,
                      top: `${(box.y / 320) * 100}%`,
                      width: `${(box.w / 320) * 100}%`,
                      height: `${(box.h / 320) * 100}%`,
                      border: '2px solid #C5221F',
                      background: 'rgba(197, 34, 31, 0.18)',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.8)',
                    }}
                    title={box.label}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                {lastResult.bboxes.map((box, idx) => (
                  <span key={idx} style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '999px', background: '#FCE8E6', color: '#C5221F', fontWeight: 600 }}>
                    {box.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#131A22' }}>Return route</h3>
              <p style={{ margin: '0 0 0.75rem', color: '#565959', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {lastResult.pathway === 'locker-dropoff'
                  ? `Locker drop-off · ${lastResult.transit_distance_km?.toFixed(1) || '1.4'} km away`
                  : `Local buyer match · ${lastResult.transit_distance_km?.toFixed(1) || '3.2'} km · escrow locked`}
              </p>
              <div style={{ height: '140px', borderRadius: '10px', overflow: 'hidden', background: '#0a0f18', position: 'relative', border: '1px solid #1a2533' }}>
                <svg viewBox="0 0 320 140" style={{ width: '100%', height: '100%' }}>
                  <path d="M 30,70 Q 160,30 290,70" stroke="#007185" strokeWidth="3" strokeDasharray="8 6" fill="none" />
                  <circle cx="30" cy="70" r="8" fill="#FF9900" />
                  <text x="30" y="95" textAnchor="middle" fill="#CCC" fontSize="11">You</text>
                  <circle cx="290" cy="70" r="8" fill="#137333" />
                  <text x="290" y="95" textAnchor="middle" fill="#CCC" fontSize="11">{lastResult.pathway === 'locker-dropoff' ? 'Locker' : 'Buyer'}</text>
                  <circle cx="170" cy="48" r="6" fill="#B12704" />
                  <text x="170" y="38" textAnchor="middle" fill="#FF9900" fontSize="10">In transit</text>
                </svg>
              </div>
              <div style={{ marginTop: '0.85rem', padding: '0.85rem', background: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1', fontSize: '0.9rem' }}>
                Saved <strong>{lastResult.carbon_saved_co2_kg?.toFixed(1) || '28.6'} kg CO₂</strong> vs shipping back to a central warehouse.
              </div>
            </div>

            <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#131A22' }}>Product authenticity (GS1)</h3>
              {gs1 ? (
                <div style={{ background: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#565959' }}>GTIN</span>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{gs1.gtin}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#565959' }}>Brand</span>
                    <strong>{gs1.brand}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#879596', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Ledger: {gs1.ledgerHash}
                  </div>
                  <div style={{ marginTop: '0.75rem', color: '#137333', fontWeight: 700, fontSize: '0.85rem' }}>Verified authentic listing</div>
                </div>
              ) : (
                <p style={{ color: '#879596', margin: 0 }}>Authenticity record unavailable.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
