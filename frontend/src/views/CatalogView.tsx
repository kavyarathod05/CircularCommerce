import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SkeletonCard, EmptyState } from '../components/Loader';

const FALLBACK_IMAGE = (productId: string) => {
  const p = productId.toLowerCase();
  if (p.includes('iphone') || p.includes('smartphone')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500';
  if (p.includes('hoodie') || p.includes('shirt')) return 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500';
  if (p.includes('jacket') || p.includes('leather')) return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500';
  if (p.includes('jeans')) return 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500';
  if (p.includes('bose') || p.includes('headphone')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';
};

export default function CatalogView() {
  const { userRole, activeTab, catalogItems, isCatalogLoading, addToCart } = useAppContext();
  const [gs1Modal, setGs1Modal] = useState<any>(null);

  if (!(userRole === 'buyer' && activeTab === 'catalog')) return null;

  const items = catalogItems.slice(0, 6);

  return (
    <section className="view-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.8rem', color: '#131A22' }}>Local Finds Near You</h2>
      <p style={{ color: '#565959', marginBottom: '1.5rem' }}>Pre-owned items from sellers in Koramangala — fast pickup, lower emissions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {isCatalogLoading && items.length === 0 ? (
          // Skeleton shimmer — 6 placeholder cards
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : items.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              title="No items nearby right now"
              message="Check back tomorrow — new returns are listed daily."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              }
            />
          </div>
        ) : (
          items.map((item: any, idx: number) => {
            const img = item.image || FALLBACK_IMAGE(item.productId);
            const gs1 = item.gs1;
            return (
              <div key={item.listingId || idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: '#FFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  <img src={img} alt={item.productId} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  {gs1?.verified && (
                    <button
                      type="button"
                      onClick={() => setGs1Modal({ ...gs1, productId: item.productId })}
                      style={{
                        position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: 'rgba(255,255,255,0.95)', border: '1px solid #BFEAF1', borderRadius: '999px',
                        padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, color: '#007185', cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#137333', display: 'inline-block' }} />
                      GS1 Verified
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0F1111', margin: '0 0 0.35rem' }}>{item.productId}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.35rem', color: '#B12704', fontWeight: 'bold' }}>₹{(item.currentPrice || Math.round(item.msrp * 0.8)).toLocaleString()}</span>
                    <span style={{ fontSize: '0.85rem', color: '#565959', textDecoration: 'line-through' }}>₹{item.msrp.toLocaleString()}</span>
                    {item.discountApplied && (
                      <span style={{ fontSize: '0.72rem', color: '#137333', fontWeight: 700 }}>{item.discountApplied} off</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#565959', marginBottom: '0.5rem' }}>
                    {item.grade} · Ships from {item.owner}
                  </div>
                  {item.isFlashDeal && (
                    <div style={{ fontSize: '0.75rem', color: '#B12704', marginBottom: '0.5rem', fontWeight: 600 }}>High demand nearby</div>
                  )}
                  <button
                    style={{ marginTop: 'auto', padding: '0.7rem', fontSize: '0.95rem', borderRadius: '999px', backgroundColor: '#FFD814', border: '1px solid #FCD200', color: '#0F1111', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {gs1Modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
          onClick={() => setGs1Modal(null)}
        >
          <div
            style={{ background: '#FFF', borderRadius: 14, padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E6F4EA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#137333', fontWeight: 800 }}>✓</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#131A22' }}>GS1 Authenticity Certificate</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#565959' }}>{gs1Modal.productId}</p>
              </div>
            </div>
            <div style={{ background: '#F0FBFC', border: '1px solid #BFEAF1', borderRadius: 10, padding: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: '#565959' }}>Brand</span><strong>{gs1Modal.brand}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span style={{ color: '#565959' }}>GTIN</span><strong style={{ fontFamily: 'monospace' }}>{gs1Modal.gtin}</strong></div>
              <div style={{ fontSize: '0.75rem', color: '#879596', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '0.5rem' }}>Ledger: {gs1Modal.ledgerHash}</div>
            </div>
            <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: '#137333', fontWeight: 600 }}>Verified on GS1 Global Registry (demo)</p>
            <button onClick={() => setGs1Modal(null)} style={{ marginTop: '1rem', width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #D5D9D9', background: '#FFF', fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
