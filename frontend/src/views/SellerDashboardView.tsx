import { useAppContext } from '../context/AppContext';

const DEMO_LISTINGS = [
  { listingId: 'lst-demo-1', productId: 'Bose QC Headphones', msrp: 6320, owner: 'You', grade: 'Grade B', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
  { listingId: 'lst-demo-2', productId: 'Essentials Cotton Hoodie', msrp: 2399, owner: 'You', grade: 'Grade A', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200' },
  { listingId: 'lst-demo-3', productId: 'iPhone 14 Pro Max', msrp: 76000, owner: 'You', grade: 'Grade B', escrowStatus: 'Locked', status: 'reserved', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200' },
];

export default function SellerDashboardView() {
  const { userRole, activeTab, listings, sellerMetrics, toggleListingStatus } = useAppContext();
  if (!(userRole === 'seller' && activeTab === 'admin')) return null;

  const displayListings = (listings.length ? listings : DEMO_LISTINGS).slice(0, 3);

  return (
    <section className="view-section" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>My Local Listings</h2>
        <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>
          Hi Priya — here are the pre-owned items you're selling in Koramangala.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Active listings', value: displayListings.length },
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
        {displayListings.map(list => (
          <div key={list.listingId} style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.25rem', display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(list as any).image && <img src={(list as any).image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#131A22', fontSize: '1.05rem' }}>{list.productId}</div>
              <div style={{ color: '#565959', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {list.grade} · ₹{list.msrp.toLocaleString()} · {list.escrowStatus}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: list.status === 'available' ? '#E6F4EA' : list.status === 'sold' ? '#F0F2F2' : '#FFF5E5', color: list.status === 'available' ? '#137333' : list.status === 'sold' ? '#565959' : '#B08D00' }}>
                {list.status}
              </span>
              <button
                onClick={() => toggleListingStatus(list.listingId)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #D5D9D9', background: '#FFD814', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#0F1111' }}
              >
                Update status
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
