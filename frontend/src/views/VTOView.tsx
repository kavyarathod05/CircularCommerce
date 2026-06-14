import { useAppContext } from '../context/AppContext';

export default function VTOView() {
  const { userRole, activeTab, setActiveTab, mediaUrl, handleFileChange } = useAppContext();
  return (
    <>
      {/* VTO VIEW */}
        {userRole === 'buyer' && activeTab === 'vto' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Virtual Try-On Experience</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>Preview Generator</h3>
                <div className="image-heatmap-container" style={{ height: '400px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', overflow: 'hidden' }}>
                  {mediaUrl ? (
                     <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <img src={mediaUrl} alt="VTO Source" style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.8 }} />
                       <div style={{ position: 'absolute', top: '40%', left: '35%', border: '2px dashed var(--amazon-orange, #FF9900)', width: '30%', height: '30%', backgroundColor: 'rgba(255, 153, 0, 0.2)' }}></div>
                       <div style={{ position: 'absolute', bottom: '10%', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>Generating Preview...</div>
                     </div>
                  ) : (
                     <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#879596' }}>Upload a photo to see a preview</span>
                     </div>
                  )}
                </div>
              </div>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>Your Style Match</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#131A22' }}>Upload a photo of yourself</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '2px dashed var(--amazon-orange, #FF9900)', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#FFFDF9' }} />
                  </div>
                  <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '1rem', border: '1px solid #EAEAEA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EAEAEA' }}>
                      <span style={{ color: '#565959' }}>Item</span>
                      <span style={{ fontWeight: '600' }}>Bose QuietComfort</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EAEAEA' }}>
                      <span style={{ color: '#565959' }}>Style Match</span>
                      <span style={{ color: 'var(--success-green, #008A00)', fontWeight: 'bold' }}>Excellent</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ color: '#565959' }}>Recommendation</span>
                      <span style={{ color: 'var(--success-green, #008A00)', fontWeight: 'bold' }}>Highly Recommended</span>
                    </div>
                  </div>
                  <button className="btn-action" onClick={() => setActiveTab('prevention')} style={{ padding: '1rem', backgroundColor: 'var(--amazon-orange, #FF9900)', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Confirm & Add to Cart</button>
                </div>
              </div>
            </div>
          </section>
        )}
    </>
  );
}
