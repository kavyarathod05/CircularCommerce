import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

const SELLER_UPDATES = [
  { title: 'Bose QC Headphones listed', detail: 'Graded B and listed for local buyers', time: 'Today, 10:32 AM', status: 'Live' },
  { title: 'Hoodie return processed', detail: 'Buyer chose locker drop-off', time: 'Today, 9:58 AM', status: 'Done' },
  { title: 'Package check passed', detail: 'Serial matched shipping record', time: 'Yesterday', status: 'Verified' },
];

const ADMIN_UPDATES = [
  ...SELLER_UPDATES,
  { title: 'Receipt review opened', detail: 'Return flagged for edited purchase date', time: 'Yesterday', status: 'Review' },
  { title: 'Linked accounts flagged', detail: '3 accounts share same device fingerprint', time: '2 days ago', status: 'Alert' },
];

export default function ProcessingLogsView({ variant }: { variant: 'seller' | 'admin' }) {
  const { userRole, activeTab } = useAppContext();
  const rows = useMemo(() => (variant === 'admin' ? ADMIN_UPDATES : SELLER_UPDATES), [variant]);

  if (!userRole || activeTab !== 'logs') return null;

  return (
    <section className="view-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#131A22' }}>
          {variant === 'admin' ? 'Processing Center' : 'Return Activity'}
        </h2>
        <p style={{ margin: '0.35rem 0 0', color: '#565959' }}>
          {variant === 'admin'
            ? 'Recent returns, reviews, and exceptions across the marketplace.'
            : 'What happened recently with returns from your listings.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#131A22' }}>{row.title}</div>
              <div style={{ color: '#565959', fontSize: '0.9rem', marginTop: '0.25rem' }}>{row.detail}</div>
              <div style={{ color: '#879596', fontSize: '0.8rem', marginTop: '0.35rem' }}>{row.time}</div>
            </div>
            <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', background: '#F3F4F6', fontSize: '0.78rem', fontWeight: 700, color: '#565959', whiteSpace: 'nowrap' }}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
