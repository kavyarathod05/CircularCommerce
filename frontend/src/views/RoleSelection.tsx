import { useAppContext } from '../context/AppContext';

export default function RoleSelection() {
  const { userRole, setUserRole, setActiveTab } = useAppContext();
  const cardStyle = {
    padding: '2rem 2.25rem',
    borderRadius: '12px',
    fontSize: '1.1rem',
    width: '260px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'transform 0.2s, boxShadow 0.2s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #EAEAEA',
    backgroundColor: '#FFFFFF',
    color: '#131A22',
  };

  return (
    <>
      {!userRole && (
        <section className="view-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#131A22', marginBottom: '0.75rem' }}>Welcome to SecondLife Commerce</h2>
            <p style={{ color: '#565959', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Shop pre-owned items locally, track deliveries, and manage returns — all in one place.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'center' }}>
            <button style={{ ...cardStyle, borderColor: 'var(--amazon-orange, #FF9900)' }} onClick={() => { setUserRole('buyer'); setActiveTab('catalog'); }}>
              <strong style={{ fontSize: '1.15rem' }}>Shop as a buyer</strong>
              <span style={{ color: '#565959', fontSize: '0.9rem' }}>Browse catalog, try items, track orders, start returns</span>
            </button>
            <button style={{ ...cardStyle, backgroundColor: '#131A22', color: '#FFFFFF', borderColor: '#131A22' }} onClick={() => { setUserRole('seller'); setActiveTab('admin'); }}>
              <strong style={{ fontSize: '1.15rem' }}>Sell on SecondLife</strong>
              <span style={{ color: '#D5D9D9', fontSize: '0.9rem' }}>Manage listings, inventory, deliveries, and return checks</span>
            </button>
            <button style={cardStyle} onClick={() => { setUserRole('admin'); setActiveTab('fraud'); }}>
              <strong style={{ fontSize: '1.15rem' }}>Admin console</strong>
              <span style={{ color: '#565959', fontSize: '0.9rem' }}>Fraud, fleet planning, route planning, and operations</span>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
