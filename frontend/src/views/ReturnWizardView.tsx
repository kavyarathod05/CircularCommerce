import { useAppContext } from '../context/AppContext';

export default function ReturnWizardView() {
  const { userRole, activeTab, orderId, setOrderId, productId, setProductId, reason, setReason, lat, setLat, lng, setLng, mediaUrl, setMediaUrl, consoleLogs, isEvaluating, handleFileChange, runTriageSimulation } = useAppContext();
  return (
    <>
      {/* RETURN WIZARD VIEW */}
        {userRole === 'buyer' && activeTab === 'wizard' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Return Center</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Start a Return</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Select Item from Order History</label>
                    <select 
                      value={productId} 
                      onChange={e => {
                        setProductId(e.target.value);
                        if (e.target.value.includes('headphones')) setMediaUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500');
                        if (e.target.value.includes('smartphone')) setMediaUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500');
                        if (e.target.value.includes('tshirt')) setMediaUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500');
                      }}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '1rem', backgroundColor: '#F8F9FA' }}
                    >
                      <option value="p-headphones-premium">Bose QuietComfort Headphones</option>
                      <option value="p-tshirt-commodity">Essentials Cotton T-Shirt</option>
                      <option value="p-smartphone-premium">iPhone 14 Pro Max</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Why are you returning this?</label>
                    <select 
                      value={reason} 
                      onChange={e => setReason(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '1rem', backgroundColor: '#F8F9FA' }}
                    >
                      <option value="fit">Too big / wrong fit</option>
                      <option value="damaged">Damaged during shipping (scratches/cracks)</option>
                      <option value="defective">Defective / does not work properly</option>
                      <option value="changed-mind">Changed mind / wrong style</option>
                    </select>
                  </div>

                  <details style={{ fontSize: '0.85rem', color: '#565959', cursor: 'pointer', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <summary style={{ fontWeight: 'bold' }}>🛠️ Hackathon Demo Controls (Optional)</summary>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Simulate Order ID</label>
                        <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Simulate GPS Proximity (Lat/Lng)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="Lat" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                          <input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="Lng" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                        </div>
                      </div>
                    </div>
                  </details>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Upload a photo of the item (Required)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '2px dashed var(--amazon-orange, #FF9900)', padding: '1.5rem', borderRadius: '8px', width: '100%', boxSizing: 'border-box', backgroundColor: '#FFFDF9', cursor: 'pointer' }} />
                    {mediaUrl && (
                      <div style={{ marginTop: '0.5rem', border: '1px solid #EAEAEA', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={mediaUrl} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={runTriageSimulation} 
                    disabled={isEvaluating} 
                    style={{ marginTop: '1rem', padding: '1rem', backgroundColor: isEvaluating ? '#D5D9D9' : 'var(--amazon-orange, #FF9900)', color: isEvaluating ? '#565959' : '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: isEvaluating ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                  >
                    {isEvaluating ? 'Processing Return...' : 'Submit Return Request'}
                  </button>
                </div>
              </div>

              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Return Progress</h3>
                <div style={{ padding: '1.25rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '400px', overflowY: 'auto' }}>
                  {consoleLogs.map((log, index) => {
                    let logClass = '#565959'
                    let icon = '⏳'
                    if (log.includes('✓')) {
                      icon = '✅'
                      logClass = '#131A22'
                    } else if (log.includes('Error') || log.includes('Failed')) {
                      icon = '❌'
                      logClass = '#C5221F'
                    } else if (log.includes('✨') || log.includes('AI')) {
                      icon = '✨'
                      logClass = '#131A22'
                    }
                    
                    let cleanLog = log.replace('✨ ', '').replace('✓ ', '');
                    
                    return (
                      <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: logClass, lineHeight: 1.4, fontWeight: log.includes('✓') || log.includes('✨') ? '600' : 'normal', borderBottom: '1px solid #EAEAEA', paddingBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <span>{cleanLog}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}
    </>
  );
}
