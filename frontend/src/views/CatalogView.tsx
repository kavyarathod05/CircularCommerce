import { useAppContext } from '../context/AppContext';

export default function CatalogView() {
  const { userRole, activeTab, productId, msrp, catalogItems, isCatalogLoading, addToCart } = useAppContext();
  return (
    <>
      {/* CATALOG VIEW */}
        {userRole === 'buyer' && activeTab === 'catalog' && (
          <section className="view-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--brutalist-font, sans-serif)', marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Recommended For You</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {isCatalogLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', gridColumn: '1 / -1', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px dashed #D5D9D9' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                  <h3 style={{ color: '#131A22', marginBottom: '0.5rem' }}>Curating Local Finds...</h3>
                  <p style={{ color: '#565959', maxWidth: '400px', margin: '0 auto' }}>We are matching you with SecondLife items available in your immediate zip code to minimize delivery emissions.</p>
                </div>
              ) : catalogItems.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', gridColumn: '1 / -1', backgroundColor: '#FFFDF9', borderRadius: '12px', border: '1px dashed #FF9900' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
                  <h3 style={{ color: '#131A22', marginBottom: '0.5rem' }}>No Local Items Found</h3>
                  <p style={{ color: '#565959', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' }}>There are currently no peer-to-peer returned items available in your immediate radius. Expand your search area or check back tomorrow as new local returns are processed daily.</p>
                  <button className="btn-action" style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #D5D9D9', backgroundColor: '#FFF', fontWeight: 'bold', cursor: 'pointer' }}>Expand Search to 50km</button>
                </div>
              ) : (
                catalogItems.map((item, idx) => (
                  <div key={idx} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#FFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                    <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={
                        item.productId.includes('iPhone') || item.productId.includes('smartphone') ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500' :
                        item.productId.includes('Jacket') ? 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' :
                        item.productId.includes('Hoodie') || item.productId.includes('Shirt') ? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500' :
                        item.productId.includes('Jeans') ? 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' :
                        item.productId.includes('Controller') ? 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500' :
                        item.productId.includes('iPad') ? 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500' :
                        item.productId.includes('Keyboard') ? 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500' :
                        item.productId.includes('Echo') ? 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500' :
                        item.productId.includes('Bottle') ? 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500' :
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
                      } alt={item.productId} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '0.5rem 0' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0F1111', margin: '0 0 0.5rem 0' }}>{item.productId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.4rem', color: '#B12704', fontWeight: 'bold' }}>₹{Math.floor(item.currentPrice || item.msrp * 0.9)}</span>
                        <span style={{ fontSize: '0.85rem', color: '#565959', textDecoration: 'line-through' }}>₹{item.msrp}</span>
                        {item.discountApplied && (
                          <span style={{ fontSize: '0.75rem', color: '#B12704', fontWeight: 'bold', marginLeft: '0.5rem' }}>({item.discountApplied} OFF)</span>
                        )}
                      </div>
                      
                      {item.isFlashDeal && (
                        <div style={{ fontSize: '0.75rem', color: '#B12704', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          ⚡ Flash Deal (High Local Demand)
                        </div>
                      )}
                      
                      {item.recommendedSize && (
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#007185', backgroundColor: '#F0FBFC', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                          ✓ <b>AI Recommended Size: {item.recommendedSize}</b>
                        </div>
                      )}
                      
                      {item.certificateUrl && (
                        <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#007185', textDecoration: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          View GS1 Authenticity Certificate
                        </a>
                      )}
                      
                      <p style={{ color: '#565959', fontSize: '0.85rem', flexGrow: 1, margin: '0.5rem 0' }}>Ships from {item.owner}</p>
                      <button className="btn-action" style={{ padding: '0.75rem', fontSize: '0.95rem', borderRadius: '100px', backgroundColor: '#FFD814', border: '1px solid #FCD200', color: '#0F1111', cursor: 'pointer', fontWeight: '500', marginTop: 'auto' }} onClick={() => addToCart(item)}>Add to Cart</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
    </>
  );
}
