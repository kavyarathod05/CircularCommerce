import { useAppContext } from '../context/AppContext';

type NavItem = { tab: string; label: string };

function NavButton({ tab, label, activeTab, setActiveTab }: NavItem & { activeTab: string; setActiveTab: (t: string) => void }) {
  const active = activeTab === tab;
  return (
    <button
      style={{
        textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none',
        backgroundColor: active ? '#FFF5E5' : 'transparent',
        color: active ? 'var(--amazon-orange, #FF9900)' : '#131A22',
        fontWeight: active ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s',
      }}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );
}

function NavSection({ title, items, activeTab, setActiveTab }: { title: string; items: NavItem[]; activeTab: string; setActiveTab: (t: string) => void }) {
  return (
    <>
      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>{title}</div>
      {items.map(item => (
        <NavButton key={item.tab} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
      ))}
    </>
  );
}

export default function Sidebar() {
  const { userRole, setUserRole, activeTab, setActiveTab } = useAppContext();

  const buyerNav: NavItem[] = [
    { tab: 'catalog', label: 'Browse Catalog' },
    { tab: 'vto', label: 'Try Before You Buy' },
    { tab: 'prevention', label: 'Cart & Checkout' },
  ];
  const buyerOrders: NavItem[] = [
    { tab: 'wizard', label: 'Start a Return' },
    { tab: 'result', label: 'Return Status' },
    { tab: 'logistics', label: 'Track Delivery' },
  ];
  const sellerNav: NavItem[] = [
    { tab: 'admin', label: 'My Listings' },
    { tab: 'logs', label: 'Return Activity' },
  ];
  const sellerOps: NavItem[] = [
    { tab: 'logistics', label: 'Deliveries' },
    { tab: 'fraud', label: 'Return Reviews' },
    { tab: 'serial', label: 'Package Checks' },
  ];
  const adminNav: NavItem[] = [
    { tab: 'fraud', label: 'Fraud Center' },
    { tab: 'serial', label: 'Package Verification' },
    { tab: 'inventory', label: 'Inventory' },
    { tab: 'logs', label: 'Processing Center' },
  ];
  const adminOps: NavItem[] = [
    { tab: 'logistics', label: 'Fleet Operations' },
    { tab: 'nsga2', label: 'Route Planning' },
    { tab: 'routing', label: 'Fleet Planning' },
    { tab: 'workspace', label: 'Operations Workspace' },
  ];

  return (
    <>
      {userRole && (
        <div className="sidebar" style={{
          width: '280px', minWidth: '280px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E7E7E7',
          display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
          padding: '1.5rem', boxSizing: 'border-box', overflow: 'hidden',
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

          <div className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {userRole === 'buyer' && (
              <>
                <NavSection title="Shop" items={buyerNav} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavSection title="Orders" items={buyerOrders} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavSection title="Account" items={[{ tab: 'account', label: 'Your Account' }]} activeTab={activeTab} setActiveTab={setActiveTab} />
              </>
            )}
            {userRole === 'seller' && (
              <>
                <NavSection title="Store" items={sellerNav} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavSection title="Operations" items={sellerOps} activeTab={activeTab} setActiveTab={setActiveTab} />
              </>
            )}
            {userRole === 'admin' && (
              <>
                <NavSection title="Trust & Safety" items={adminNav} activeTab={activeTab} setActiveTab={setActiveTab} />
                <NavSection title="Logistics" items={adminOps} activeTab={activeTab} setActiveTab={setActiveTab} />
              </>
            )}
          </div>

          <div className="user-profile-btn" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#F8F9FA', cursor: 'pointer', border: '1px solid #EAEAEA' }} onClick={() => setUserRole(null)}>
            <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#131A22', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {userRole === 'buyer' ? 'B' : userRole === 'admin' ? 'A' : 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#131A22' }}>
                {userRole === 'buyer' ? 'Buyer' : userRole === 'admin' ? 'Admin' : 'Seller'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#879596' }}>Switch role</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
