import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SkeletonKPI, SkeletonCard } from '../components/Loader';
import { useState, useEffect } from 'react';

const DEMO_LISTINGS = [
  { listingId: 'lst-demo-1', productId: 'Bose QC Headphones', msrp: 6320, owner: 'You', grade: 'Grade B', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200', escrowAmount: 0, buyerName: null },
  { listingId: 'lst-demo-2', productId: 'Essentials Cotton Hoodie', msrp: 2399, owner: 'You', grade: 'Grade A', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200', escrowAmount: 0, buyerName: null },
  { listingId: 'lst-demo-3', productId: 'iPhone 14 Pro Max', msrp: 76000, owner: 'You', grade: 'Grade B', escrowStatus: 'Locked', status: 'reserved', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200', escrowAmount: 68400, buyerName: 'Rahul K.' },
  { listingId: 'lst-demo-4', productId: 'Sony WH-1000XM5', msrp: 29990, owner: 'You', grade: 'Grade A', escrowStatus: 'Pending Release', status: 'sold', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200', escrowAmount: 26991, buyerName: 'Anjali M.', deliveryStatus: 'Delivered - Awaiting confirmation' },
];

export default function SellerDashboardView() {
  const { userRole, activeTab, listings, sellerMetrics, toggleListingStatus } = useAppContext();
  const { authFetch } = useAuth();
  const [escrowData, setEscrowData] = useState<any>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState('');
  
  const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';

  const displayListings = (listings.length ? listings : DEMO_LISTINGS).slice(0, 4);
  
  // Fetch escrow data from backend
  useEffect(() => {
    const fetchEscrowData = async () => {
      try {
        const response = await authFetch(`${mlApiUrl}/api/v1/escrow/seller/balance`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setEscrowData(data.data);
        } else {
          throw new Error('Fallback to calculated');
        }
      } catch (error) {
        // Calculate from listings if backend not available
        const lockedFunds = displayListings
          .filter((l: any) => l.escrowStatus === 'Locked')
          .reduce((sum: number, l: any) => sum + (l.escrowAmount || 0), 0);
        
        const pendingRelease = displayListings
          .filter((l: any) => l.escrowStatus === 'Pending Release')
          .reduce((sum: number, l: any) => sum + (l.escrowAmount || 0), 0);
        
        setEscrowData({
          total_escrow: lockedFunds + pendingRelease,
          locked_funds: lockedFunds,
          pending_release: pendingRelease,
          available_balance: 12500,
          total_lifetime_earnings: 45800
        });
      }
    };

    fetchEscrowData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!(userRole === 'seller' && activeTab === 'admin')) return null;

  const handleWithdraw = async () => {
    if (!escrowData?.available_balance || escrowData.available_balance <= 0) {
      setWithdrawMessage('No funds available to withdraw');
      setTimeout(() => setWithdrawMessage(''), 3000);
      return;
    }

    setIsWithdrawing(true);
    setWithdrawMessage('');

    try {
      const response = await authFetch(`${mlApiUrl}/api/v1/escrow/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: escrowData.available_balance,
          bank_account: 'XXXX-XXXX-1234' 
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setWithdrawMessage(`✅ ₹${escrowData.available_balance.toLocaleString()} withdrawal initiated! Funds will arrive in 2-3 business days.`);
        setEscrowData({ ...escrowData, available_balance: 0 });
      } else {
        setWithdrawMessage('❌ Withdrawal failed. Please try again.');
      }
    } catch (error) {
      setWithdrawMessage(`✅ ₹${escrowData.available_balance.toLocaleString()} withdrawal initiated! (Demo mode)`);
      setTimeout(() => {
        setEscrowData({ ...escrowData, available_balance: 0 });
      }, 1500);
    } finally {
      setIsWithdrawing(false);
      setTimeout(() => setWithdrawMessage(''), 5000);
    }
  };

  const lockedFunds = escrowData?.locked_funds || 0;
  const pendingRelease = escrowData?.pending_release || 0;
  const totalEscrow = escrowData?.total_escrow || 0;
  const availableBalance = escrowData?.available_balance || 0;

  // Show loading state while escrow data is being fetched
  if (!escrowData) {
    return (
      <section className="view-section" style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>My Local Listings</h2>
          <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>
            Hi Priya — here are the pre-owned items you're selling in Koramangala.
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#565959' }}>Loading escrow data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="view-section" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>My Local Listings</h2>
        <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>
          Hi Priya — here are the pre-owned items you're selling in Koramangala.
        </p>
      </div>

      {/* Escrow Funds Showcase - Light Theme */}
      <div style={{ 
        background: '#FFF', 
        border: '2px solid #FF9900',
        borderRadius: '12px', 
        padding: '1.75rem', 
        marginBottom: '1.5rem',
        boxShadow: '0 4px 16px rgba(255, 153, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
              <div style={{ fontSize: '0.85rem', color: '#565959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Escrow Balance
              </div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FF9900', marginBottom: '0.5rem' }}>
              ₹{totalEscrow.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#565959' }}>
              🛡️ Protected by SecondLife Escrow
            </div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #E6F4EA 0%, #D1F2EB 100%)',
            borderRadius: '12px', 
            padding: '1.25rem 1.5rem',
            border: '2px solid #137333',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#137333', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Available to Withdraw
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#137333', marginBottom: '0.75rem' }}>
              ₹{availableBalance.toLocaleString()}
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={isWithdrawing || availableBalance <= 0}
              style={{
                width: '100%',
                padding: '0.65rem 1.25rem',
                background: availableBalance > 0 ? '#FFD814' : '#E0E0E0',
                color: '#0F1111',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: isWithdrawing ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (availableBalance > 0) e.currentTarget.style.background = '#F7CA00';
              }}
              onMouseLeave={(e) => {
                if (availableBalance > 0) e.currentTarget.style.background = '#FFD814';
              }}
            >
              {isWithdrawing ? 'Processing...' : availableBalance > 0 ? 'Withdraw Funds' : 'No Funds Available'}
            </button>
          </div>
        </div>

        {withdrawMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            background: withdrawMessage.startsWith('✅') ? '#E6F4EA' : '#FCE8E6',
            color: withdrawMessage.startsWith('✅') ? '#137333' : '#C5221F',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: `1px solid ${withdrawMessage.startsWith('✅') ? '#137333' : '#C5221F'}`
          }}>
            {withdrawMessage}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          paddingTop: '1.5rem',
          borderTop: '2px solid #F0F2F2'
        }}>
          <div style={{ 
            background: '#FFF5E5', 
            borderRadius: '10px', 
            padding: '1.25rem',
            border: '2px solid #FFA500'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔒</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#B08D00', fontWeight: 700, textTransform: 'uppercase' }}>Locked in Escrow</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F1111', marginTop: '0.25rem' }}>₹{lockedFunds.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#565959', lineHeight: '1.4' }}>Buyer reserved • Awaiting delivery confirmation</div>
          </div>

          <div style={{ 
            background: '#E6F4EA', 
            borderRadius: '10px', 
            padding: '1.25rem',
            border: '2px solid #137333'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⏱️</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#137333', fontWeight: 700, textTransform: 'uppercase' }}>Pending Release</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F1111', marginTop: '0.25rem' }}>₹{pendingRelease.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#565959', lineHeight: '1.4' }}>Delivered • Auto-releasing in 24-48 hours</div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#F0F8FF', borderRadius: '8px', fontSize: '0.85rem', color: '#565959', lineHeight: '1.6', border: '1px solid #D1E7FF' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🛡️</span>
            <div>
              <strong style={{ color: '#0066C0', display: 'block', marginBottom: '0.35rem' }}>How Escrow Protects You:</strong>
              Buyer's payment is held securely until they confirm receipt and satisfaction. If there's a dispute, our AI mediator reviews photo evidence. Funds release automatically 48 hours after delivery confirmation or buyer approval.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {!sellerMetrics ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonKPI key={i} />)
        ) : [
          { label: 'Active listings', value: displayListings.filter((l: any) => l.status === 'available').length },
          { label: 'Sold this month', value: 2 },
          { label: 'CO₂ saved', value: `${sellerMetrics?.co2_saved_kg?.toFixed?.(0) || 18} kg` },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#131A22' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#565959', marginTop: '0.25rem' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {displayListings.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : displayListings.map((list: any) => (
          <div key={list.listingId} style={{ 
            background: '#FFF', 
            border: list.escrowAmount > 0 ? '2px solid ' + (list.escrowStatus === 'Locked' ? '#FFA500' : '#137333') : '1px solid #EAEAEA', 
            borderRadius: '12px', 
            padding: '1.25rem', 
            display: 'grid', 
            gridTemplateColumns: '72px minmax(0, 1fr) auto', 
            gap: '1rem', 
            alignItems: 'center',
            position: 'relative',
            boxShadow: list.escrowAmount > 0 ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
          }}>
            {list.escrowAmount > 0 && (
              <div style={{
                position: 'absolute', top: '-12px', right: '20px',
                background: list.escrowStatus === 'Locked' ? '#FFA500' : '#137333',
                color: '#FFF', padding: '0.4rem 0.85rem', borderRadius: '8px',
                fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                {list.escrowStatus === 'Locked' ? '🔒' : '⏱️'} ₹{list.escrowAmount.toLocaleString()} in Escrow
              </div>
            )}

            <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E0E0E0' }}>
              {list.image && <img src={list.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#131A22', fontSize: '1.05rem' }}>{list.productId}</div>
              <div style={{ color: '#565959', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {list.grade} · ₹{list.msrp.toLocaleString()}
              </div>
              {list.buyerName && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0066C0', background: '#F0F8FF', padding: '0.35rem 0.65rem', borderRadius: '6px', display: 'inline-block', border: '1px solid #D1E7FF' }}>
                  👤 Buyer: <strong>{list.buyerName}</strong>
                  {list.deliveryStatus && <span style={{ color: '#565959', marginLeft: '0.5rem' }}>• {list.deliveryStatus}</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span style={{ 
                padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                background: list.status === 'available' ? '#E6F4EA' : list.status === 'sold' ? '#F0F2F2' : '#FFF5E5',
                color: list.status === 'available' ? '#137333' : list.status === 'sold' ? '#565959' : '#B08D00',
                textTransform: 'capitalize',
                border: `1px solid ${list.status === 'available' ? '#137333' : list.status === 'sold' ? '#D5D9D9' : '#FFA500'}`
              }}>
                {list.status}
              </span>
              <button
                onClick={() => toggleListingStatus(list.listingId)}
                style={{ 
                  padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #D5D9D9',
                  background: list.status === 'sold' ? '#FFF' : '#FFD814',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#0F1111', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (list.status !== 'sold') e.currentTarget.style.background = '#F7CA00'; }}
                onMouseLeave={(e) => { if (list.status !== 'sold') e.currentTarget.style.background = '#FFD814'; }}
              >
                {list.status === 'sold' ? 'View Details' : 'Update'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
