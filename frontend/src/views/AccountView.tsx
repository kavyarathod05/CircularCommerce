import { useAppContext } from '../context/AppContext';

export default function AccountView() {
  const { userRole, activeTab, userMetrics, dppData } = useAppContext();
  return (
    <>
      {/* ACCOUNT VIEW */}
        {userRole === 'buyer' && activeTab === 'account' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#131A22' }}>Your Account Balance</h2>
                    <span style={{ backgroundColor: '#E6F4EA', color: '#137333', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Prime Member</span>
                  </div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: '#131A22' }}>₹1,240.50</div>
                  <div style={{ color: '#565959', fontSize: '0.95rem', marginTop: '0.5rem' }}>Available to use on your next purchase</div>
                </div>

                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Product Verification & Traceability</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.05rem' }}>Authenticity Trail</strong>
                    <span style={{ color: '#879596', fontSize: '0.85rem', backgroundColor: '#F8F9FA', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>ID: {dppData?.listing_id || '9f8a-4b2c'}</span>
                  </div>
                  <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '1rem', border: '1px solid #EAEAEA' }}>
                    {dppData && dppData.dpp_history ? (
                      dppData.dpp_history.map((block: any, idx: number) => (
                        <p key={idx} style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#565959' }}>{block.action}</span>
                          <strong>{new Date(block.timestamp).toLocaleDateString()} ({block.owner})</strong>
                        </p>
                      ))
                    ) : (
                      <>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Origin</span> <strong>Factory A, Vietnam</strong></p>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Purchased</span> <strong>Oct 12, 2026</strong></p>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Transferred</span> <strong>Oct 15, 2026</strong></p>
                      </>
                    )}
                  </div>
                  <button className="btn-action" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#131A22', border: '1px solid #D5D9D9', marginTop: '1.5rem', cursor: 'pointer', fontWeight: '500' }}>View Digital Receipt</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#131A22' }}>Your Orders & Returns</h3>
                  <div style={{ padding: '1.25rem', border: '1px solid #EAEAEA', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <h4 style={{ color: 'var(--amazon-orange, #FF9900)', margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Bose QuietComfort Headphones</h4>
                    <p style={{ margin: '0.5rem 0', color: '#131A22', fontSize: '0.9rem' }}>✓ Return Initiated: Today, 10:42 AM</p>
                    <p style={{ margin: '0.5rem 0', color: '#131A22', fontSize: '0.9rem' }}>✓ Item Received - Refund Processed</p>
                    <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: '#FFF8F0', borderLeft: '4px solid var(--amazon-orange, #FF9900)', borderRadius: '0 4px 4px 0' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Local Match Found - Transferring to Escrow</strong>
                    </div>
                    <p style={{ margin: 0, color: '#879596', fontSize: '0.85rem' }}>Awaiting local handoff completion</p>
                  </div>
                </div>

                <div className="panel" style={{ backgroundColor: '#E6F4EA', borderRadius: '12px', padding: '1.5rem', border: '1px solid #CEEAD6' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#137333' }}>Climate Pledge Impact</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'center' }}>
                    <span style={{ color: '#0D652D', fontSize: '0.9rem' }}>CO2 Avoided by Local Return:</span>
                    <strong style={{ color: '#137333', fontSize: '1.1rem' }}>{userMetrics?.co2_saved_kg ? userMetrics.co2_saved_kg.toFixed(1) : 18.4} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'center' }}>
                    <span style={{ color: '#0D652D', fontSize: '0.9rem' }}>Tree Equivalent:</span>
                    <strong style={{ color: '#137333', fontSize: '1.1rem' }}>{userMetrics?.trees_planted ? userMetrics.trees_planted.toFixed(2) : 0.87} trees</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
    </>
  );
}
