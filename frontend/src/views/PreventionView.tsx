import { useAppContext } from '../context/AppContext';

export default function PreventionView() {
  const { userRole, activeTab, setActiveTab, cartItems, returnVelocity, setReturnVelocity, showPreventionAlert, frictionScore, evaluateFriction, removeFromCart } = useAppContext();
  return (
    <>
      {/* PRE-CHECKOUT PREVENTION VIEW */}
        {userRole === 'buyer' && activeTab === 'prevention' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Checkout & Cart Review</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Your Shopping Cart</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cartItems.length === 0 ? (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px dashed #D5D9D9' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.6 }}>🛒</div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#131A22', fontSize: '1.1rem' }}>Your Cart is Empty</h4>
                      <p style={{ color: '#565959', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 auto', maxWidth: '300px' }}>You haven't added any items yet. Browse our local catalog to find sustainable, peer-to-peer returns in your area.</p>
                      <button className="btn-action" onClick={() => setActiveTab('catalog')} style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '20px', border: '1px solid var(--amazon-orange, #FF9900)', backgroundColor: '#FFF', color: 'var(--amazon-orange, #FF9900)', fontWeight: 'bold', cursor: 'pointer' }}>Browse Catalog</button>
                    </div>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} style={{ padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#131A22' }}>{item.name}</span>
                          <span style={{ color: '#B12704', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.9rem', color: '#565959', backgroundColor: '#FFF', padding: '0.2rem 0.5rem', border: '1px solid #EAEAEA', borderRadius: '4px' }}>
                            Size: <strong>{item.size}</strong>
                          </div>
                          <button style={{ background: 'none', border: 'none', color: '#C5221F', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => removeFromCart(idx)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <details style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#565959', cursor: 'pointer', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <summary style={{ fontWeight: 'bold' }}>🛠️ Hackathon Demo Controls (Account History)</summary>
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <label style={{ fontWeight: 'bold', color: '#131A22' }}>Simulate Historical Returns (Past 7 Days):</label>
                      <input type="number" value={returnVelocity} onChange={e => { setReturnVelocity(parseInt(e.target.value)); evaluateFriction(); }} style={{ padding: '0.5rem', width: '80px', borderRadius: '4px', border: '1px solid #D5D9D9', textAlign: 'center' }} />
                    </div>
                  </details>
                </div>
              </div>

              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: '#131A22' }}>Smart Fit Check</h3>
                <p style={{ fontSize: '0.9rem', color: '#565959', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  Find your perfect fit and help us reduce return emissions! 🌍
                </p>

                {showPreventionAlert && frictionScore && (
                  <div style={{
                    backgroundColor: frictionScore.intercept ? '#FCE8E6' : '#E6F4EA',
                    border: `1px solid ${frictionScore.intercept ? '#FAD2CF' : '#CEEAD6'}`,
                    padding: '1.5rem', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{frictionScore.intercept ? '⚠️' : '✅'}</span>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: frictionScore.intercept ? '#C5221F' : '#137333' }}>
                        {frictionScore.intercept ? 'Fit Uncertainty Detected' : 'Perfect Match!'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.95rem', color: '#131A22', lineHeight: 1.5 }}>
                      {frictionScore.intercept ? (
                        <>
                          <p style={{ marginBottom: '1.5rem' }}>
                            Ordering multiple sizes increases carbon footprint. Unsure about the fit?
                          </p>
                          <button className="btn-action" onClick={() => setActiveTab('vto')} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#131A22', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                            Try It On Virtually 👗
                          </button>
                        </>
                      ) : (
                        <>
                          <p>High fit confidence based on your profile: <b>{((1 - frictionScore.returnProbability) * 100).toFixed(0)}%</b></p>
                          <button className="btn-action" style={{ marginTop: '1.5rem', width: '100%', backgroundColor: '#FFD814', color: '#0F1111', padding: '0.75rem', borderRadius: '100px', border: '1px solid #FCD200', fontWeight: 'bold', cursor: 'pointer' }}>
                            Proceed to Checkout
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {showPreventionAlert && frictionScore && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid #EAEAEA', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#131A22', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📊</span> Smart Fit Insights
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ minWidth: '100px', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${frictionScore.intercept ? '#C5221F' : '#137333'}` }}>
                        <div style={{ fontSize: '0.75rem', color: '#565959', marginBottom: '0.25rem' }}>Fit Confidence</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: frictionScore.intercept ? '#C5221F' : '#137333' }}>
                          {((1 - frictionScore.returnProbability) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#565959', lineHeight: '1.5' }}>
                        {cartItems.filter(i => i.name === 'Essentials Cotton Hoodie').length > 1 ? (
                          <span><b>Heads up:</b> You have multiple sizes of the same item in your cart. Ordering just one perfect size helps reduce carbon emissions from returns!</span>
                        ) : (
                          <span><b>Looks good:</b> Your sizing profile closely matches these items based on historical purchase data.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {showPreventionAlert && !frictionScore && cartItems.length > 0 && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#131A22' }}>
                      Information for your order
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#565959', lineHeight: '1.5' }}>
                      {cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1) && (
                        <p style={{ marginBottom: '1rem' }}>
                          <b>Fit Note:</b> You have added multiple sizes (M and L) of the same garment. Sizing metrics indicate the "Essentials Cotton Hoodie" runs true-to-size. We recommend selecting your usual size.
                        </p>
                      )}
                      {returnVelocity > 3 && (
                        <p>
                          <b>Account Note:</b> We noticed a higher than usual return rate on your account. Please double-check sizing guides to ensure a perfect fit before ordering.
                        </p>
                      )}
                      {!(cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1)) && returnVelocity <= 3 && (
                         <p>Analyzing fit and account velocity...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
    </>
  );
}
