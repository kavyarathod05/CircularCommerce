import { useAppContext } from '../context/AppContext';

export default function SellerDashboardView() {
  const { userRole, activeTab, productId, msrp, listings, sellerMetrics, toggleListingStatus } = useAppContext();
  return (
    <>
      {/* SELLER DASHBOARD VIEW */}
        {userRole === 'seller' && activeTab === 'admin' && (
          <section className="view-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Seller Central Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Warehouse Avoidance Rate</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>{sellerMetrics?.warehouse_avoidance_rate || 68.4}%</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>↑ 12.4% vs Last Month</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Scope-3 Carbon Avoided</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>{sellerMetrics?.co2_saved_kg ? sellerMetrics.co2_saved_kg.toFixed(1) : 847.2} Kg</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>🌍 {sellerMetrics?.trees_planted ? sellerMetrics.trees_planted.toFixed(1) : 40.3} Trees Planted Equiv.</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Capital Recovery Value</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>₹{sellerMetrics?.capital_recovery_value ? sellerMetrics.capital_recovery_value.toLocaleString() : '4.28M'}</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>✓ 82.6% Recovery Rate</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Escrow Locked Funds</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>₹{sellerMetrics?.escrow_locked_funds ? sellerMetrics.escrow_locked_funds.toLocaleString() : '145,200'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--amazon-orange, #FF9900)', marginTop: '0.5rem', fontWeight: 'bold' }}>Live from MatchesTable</div>
              </div>
            </div>

            <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Active SecondLife Listings & Escrow States</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EAEAEA', color: '#565959' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Listing ID</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Product</th>
                    <th style={{ padding: '1rem 0.5rem' }}>MSRP Value</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Current Owner</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Item Condition</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Escrow status</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Listing status</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(list => (
                    <tr key={list.listingId} style={{ borderBottom: '1px solid #F0F2F2' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold', color: '#131A22' }}>{list.listingId}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#565959' }}>{list.productId}</td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>₹{list.msrp}</td>
                      <td style={{ padding: '1rem 0.5rem', color: '#565959' }}>{list.owner}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: list.grade.includes('A') ? '#137333' : list.grade.includes('B') ? '#B08D00' : '#C5221F' }}>
                          {list.grade}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: '#565959' }}>{list.escrowStatus}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold',
                          backgroundColor: list.status === 'available' ? '#E6F4EA' : list.status === 'reserved' ? '#FFF8E1' : '#F3F4F6',
                          color: list.status === 'available' ? '#137333' : list.status === 'reserved' ? '#B08D00' : '#565959'
                        }}>
                          {list.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <button 
                          style={{ padding: '0.4rem 0.8rem', backgroundColor: '#FFF', border: '1px solid #D5D9D9', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', color: '#0F1111', fontWeight: '600' }} 
                          onClick={() => toggleListingStatus(list.listingId)}
                        >
                          Transition State
                        </button>
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                     <tr><td colSpan={8} style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#FAFBFC' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#131A22', fontSize: '1.1rem' }}>No Active Listings</h4>
                        <p style={{ color: '#565959', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>You currently have no processed returns available in your local marketplace. As returns are approved by the AI triage, they will automatically appear here for local buyers.</p>
                     </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </>
  );
}
