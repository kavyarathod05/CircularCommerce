import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
  const { userRole, setUserRole, activeTab, setActiveTab } = useAppContext();
  return (
    <>
      {/* SIDEBAR NAVIGATION - Fixed Design Issues */}
      {userRole && (
        <div className="sidebar" style={{ 
          width: '280px', 
          minWidth: '280px', 
          backgroundColor: '#FFFFFF', 
          borderRight: '1px solid #E7E7E7', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          position: 'sticky', 
          top: 0, 
          padding: '1.5rem', 
          boxSizing: 'border-box' 
        }}>
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div className="logo-box" style={{ padding: '0.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#131A22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h1 className="logo-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: '800', color: '#131A22' }}>
              SecondLife<br /><span style={{ color: 'var(--amazon-orange, #FF9900)' }}>Commerce</span>
            </h1>
          </div>

          <div className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, overflowY: 'auto' }}>
            {userRole === 'buyer' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Shopping</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'catalog' ? '#FFF5E5' : 'transparent', color: activeTab === 'catalog' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'catalog' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('catalog')}>Browse Catalog</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'vto' ? '#FFF5E5' : 'transparent', color: activeTab === 'vto' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'vto' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('vto')}>Virtual Try-On</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'prevention' ? '#FFF5E5' : 'transparent', color: activeTab === 'prevention' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'prevention' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('prevention')}>Your Cart</button>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Returns</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'wizard' ? '#FFF5E5' : 'transparent', color: activeTab === 'wizard' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'wizard' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('wizard')}>Start a Return</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'result' ? '#FFF5E5' : 'transparent', color: activeTab === 'result' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'result' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('result')}>Return Status</button>

                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Logistics</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'logistics' ? '#FFF5E5' : 'transparent', color: activeTab === 'logistics' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'logistics' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('logistics')}>🛰️ Live Tracking</button>

                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Settings</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'account' ? '#FFF5E5' : 'transparent', color: activeTab === 'account' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'account' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('account')}>Your Account</button>
              </>
            )}
            {userRole === 'seller' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Dashboard</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'admin' ? '#FFF5E5' : 'transparent', color: activeTab === 'admin' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'admin' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('admin')}>Seller Workspace</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'result' ? '#FFF5E5' : 'transparent', color: activeTab === 'result' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'result' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('result')}>Processing Logs</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'inventory' ? '#FFF5E5' : 'transparent', color: activeTab === 'inventory' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'inventory' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('inventory')}>📦 Unit Inventory</button>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Logistics</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'logistics' ? '#FFF5E5' : 'transparent', color: activeTab === 'logistics' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'logistics' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('logistics')}>🛰️ Fleet Telemetry</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'nsga2' ? '#FFF5E5' : 'transparent', color: activeTab === 'nsga2' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'nsga2' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('nsga2')}>🧬 NSGA-II Routing</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'routing' ? '#FFF5E5' : 'transparent', color: activeTab === 'routing' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'routing' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('routing')}>🌱 Sustainable Fleet</button>

                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Security</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'fraud' ? '#FFF5E5' : 'transparent', color: activeTab === 'fraud' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'fraud' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('fraud')}>Fraud Investigations</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'serial' ? '#FFF5E5' : 'transparent', color: activeTab === 'serial' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'serial' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('serial')}>Serial Verification</button>
              </>
            )}
          </div>
          
          <div className="user-profile-btn" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#F8F9FA', cursor: 'pointer', border: '1px solid #EAEAEA' }} onClick={() => setUserRole(null)}>
            <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#131A22', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {userRole === 'buyer' ? 'B' : 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#131A22' }}>{userRole === 'buyer' ? 'Buyer Persona' : 'Seller Persona'}</span>
              <span style={{ fontSize: '0.75rem', color: '#879596' }}>Switch Role</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
