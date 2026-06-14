import { useAppContext } from '../context/AppContext';

export default function RoleSelection() {
  const { userRole, setUserRole, setActiveTab } = useAppContext();
  return (
    <>
      {/* ROLE SELECTION SCREEN */}
        {!userRole && (
          <section className="view-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--brutalist-font, sans-serif)', fontSize: '2.5rem', fontWeight: '800', color: '#131A22', textAlign: 'center' }}>Welcome to SecondLife Commerce</h2>
            <p style={{ color: '#565959', fontSize: '1.1rem' }}>Please select your persona to continue.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              <button 
                className="btn-action" 
                style={{ padding: '2.5rem', borderRadius: '12px', fontSize: '1.25rem', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', backgroundColor: '#FFFFFF', border: '2px solid var(--amazon-orange, #FF9900)', color: '#131A22', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                onClick={() => { setUserRole('buyer'); setActiveTab('catalog'); }}
              >
                <span style={{ fontSize: '4rem' }}>🛍️</span>
                <span style={{ fontWeight: 'bold' }}>I am a Buyer</span>
              </button>
              <button 
                className="btn-action" 
                style={{ padding: '2.5rem', borderRadius: '12px', fontSize: '1.25rem', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', backgroundColor: '#131A22', border: '2px solid #131A22', color: '#FFFFFF', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                onClick={() => { setUserRole('seller'); setActiveTab('admin'); }}
              >
                <span style={{ fontSize: '4rem' }}>📦</span>
                <span style={{ fontWeight: 'bold' }}>I am a Seller</span>
              </button>
            </div>
          </section>
        )}
    </>
  );
}
