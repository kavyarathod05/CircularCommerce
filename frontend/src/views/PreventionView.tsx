import { useAppContext } from '../context/AppContext';

export default function PreventionView() {
  const { userRole, activeTab, setActiveTab, cartItems, returnVelocity, setReturnVelocity, showPreventionAlert, frictionScore, evaluateFriction, removeFromCart } = useAppContext();

  if (!(userRole === 'buyer' && activeTab === 'prevention')) return null;

  const bracketing = cartItems.some(item =>
    cartItems.filter(i => i.name === item.name).length > 1
  );

  return (
    <section className="view-section" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.8rem', color: '#131A22' }}>Cart & Checkout</h2>
      <p style={{ color: '#565959', marginBottom: '1.5rem' }}>We check your cart for sizing and return patterns before you checkout.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Your cart</h3>
          {cartItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#F8F9FA', borderRadius: '8px', color: '#565959' }}>
              Your cart is empty. <button onClick={() => setActiveTab('catalog')} style={{ border: 'none', background: 'none', color: '#007185', fontWeight: 700, cursor: 'pointer' }}>Browse local finds</button>
            </div>
          ) : cartItems.map((item, idx) => (
            <div key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid #F0F2F2', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <strong>{item.name}</strong>
                <div style={{ color: '#565959', fontSize: '0.85rem', marginTop: '0.2rem' }}>Size {item.size}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#B12704' }}>₹{item.price.toLocaleString()}</div>
                <button onClick={() => removeFromCart(idx)} style={{ border: 'none', background: 'none', color: '#C5221F', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.25rem' }}>Remove</button>
              </div>
            </div>
          ))}

          <details style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#565959' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Demo: adjust return history</summary>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label>Past returns (7 days)</label>
              <input type="number" min={0} max={10} value={returnVelocity} onChange={e => { setReturnVelocity(parseInt(e.target.value) || 0); evaluateFriction(); }} style={{ width: 70, padding: '0.4rem', borderRadius: '6px', border: '1px solid #D5D9D9' }} />
            </div>
          </details>
        </div>

        <div style={{ background: '#FFF', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA', position: 'sticky', top: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>Checkout review</h3>
          {!frictionScore && cartItems.length > 0 && (
            <p style={{ color: '#879596', fontSize: '0.9rem' }}>Analyzing your cart...</p>
          )}

          {showPreventionAlert && frictionScore && (
            <>
              <div style={{
                background: frictionScore.intercept ? '#FFF5E5' : '#E6F4EA',
                border: `1px solid ${frictionScore.intercept ? '#FFE8C7' : '#CEEAD6'}`,
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <div style={{ fontWeight: 800, color: frictionScore.intercept ? '#B12704' : '#137333', marginBottom: '0.35rem' }}>
                  {frictionScore.intercept ? 'Higher return risk detected' : 'Good fit for checkout'}
                </div>
                <p style={{ margin: 0, color: '#565959', fontSize: '0.9rem', lineHeight: 1.5 }}>{frictionScore.message}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#F8F9FA', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#565959' }}>Return risk</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: frictionScore.intercept ? '#C5221F' : '#137333' }}>
                    {frictionScore.returnRiskPercent ?? Math.round(frictionScore.returnProbability * 100)}%
                  </div>
                </div>
                <div style={{ background: '#F8F9FA', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#565959' }}>Fit confidence</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#131A22' }}>
                    {frictionScore.fitConfidencePercent ?? Math.round((1 - frictionScore.returnProbability) * 100)}%
                  </div>
                </div>
              </div>

              {(frictionScore.reasons?.length > 0 || bracketing) && (
                <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', color: '#565959', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {frictionScore.reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  {bracketing && !frictionScore.reasons?.includes('Multiple sizes of the same item in cart') && (
                    <li>Multiple sizes of the same item in cart</li>
                  )}
                </ul>
              )}

              {frictionScore.intercept ? (
                <button onClick={() => setActiveTab('vto')} style={{ width: '100%', padding: '0.75rem', background: '#131A22', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  Try before you buy
                </button>
              ) : (
                <button style={{ width: '100%', padding: '0.75rem', background: '#FFD814', color: '#0F1111', border: '1px solid #FCD200', borderRadius: '999px', fontWeight: 700, cursor: 'pointer' }}>
                  Proceed to checkout
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
