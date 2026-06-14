import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export default function VTOView() {
  const { userRole, activeTab, catalogItems } = useAppContext();
  
  const [selectedSku, setSelectedSku] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [vtoResult, setVtoResult] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      setIsCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        // Mirror the image if it's a front facing camera
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setUserImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserImage(event.target?.result as string);
        stopCamera();
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const runVTO = async () => {
    if (!userImage || !selectedSku) {
      alert("Please capture/upload a photo and select a product first.");
      return;
    }
    
    setIsGenerating(true);
    setVtoResult(null);
    
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
      const resp = await fetch(`${mlApiUrl}/api/v1/ml/vto/drape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_image_base64: userImage,
          clothing_sku: selectedSku
        })
      });
      
      const data = await resp.json();
      if (data.status === 'success') {
        setVtoResult(data.data);
      } else {
        alert("VTO Backend error: " + data.error);
      }
    } catch (err) {
      console.error("VTO failed", err);
      alert("VTO Backend error: Server Unreachable");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {userRole === 'buyer' && activeTab === 'vto' && (
        <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Virtual Try-On Experience</h2>
          
          {/* PRODUCT SELECTION */}
          <div style={{ marginBottom: '2rem' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#131A22' }}>1. Select a Product to Try On</h3>
             <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', WebkitOverflowScrolling: 'touch' }}>
                {catalogItems.length === 0 && <span style={{ color: '#879596' }}>No products available. Please check the Catalog first.</span>}
                {catalogItems.map((item: any) => (
                   <div 
                      key={item.productId} 
                      onClick={() => setSelectedSku(item.productId)}
                      style={{ 
                         minWidth: '200px', padding: '1rem', border: selectedSku === item.productId ? '2px solid #FF9900' : '1px solid #EAEAEA', 
                         borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedSku === item.productId ? '#FFFDF9' : '#FFF',
                         textAlign: 'center', transition: 'all 0.2s ease', boxShadow: selectedSku === item.productId ? '0 4px 12px rgba(255,153,0,0.1)' : 'none'
                      }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {item.productId.includes('iPhone') || item.productId.includes('smartphone') ? '📱' :
                         item.productId.includes('Jacket') ? '🧥' :
                         item.productId.includes('Hoodie') || item.productId.includes('Shirt') ? '👕' :
                         item.productId.includes('Jeans') ? '👖' :
                         item.productId.includes('headphones') ? '🎧' : '📦'}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#131A22' }}>{item.productId}</div>
                      <div style={{ fontSize: '0.8rem', color: '#565959', marginTop: '0.25rem' }}>₹{item.msrp}</div>
                   </div>
                ))}
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            
            {/* CAMERA / GALLERY INPUT */}
            <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>2. Capture Your Photo</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                 {!isCameraOn ? (
                    <button onClick={startCamera} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#131A22', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      📷 Start Camera
                    </button>
                 ) : (
                    <button onClick={capturePhoto} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#C5221F', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      📸 Capture Snapshot
                    </button>
                 )}
                 <label style={{ flex: 1, padding: '0.75rem', backgroundColor: '#F8F9FA', color: '#131A22', border: '1px solid #D5D9D9', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    🖼️ Upload Gallery
                    <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} />
                 </label>
              </div>

              <div style={{ height: '400px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '2px dashed #D5D9D9', overflow: 'hidden', position: 'relative' }}>
                 <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }}></video>
                 <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                 {!isCameraOn && userImage && (
                    <img src={userImage} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 )}
                 {!isCameraOn && !userImage && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#879596', gap: '1rem' }}>
                       <span style={{ fontSize: '3rem' }}>👤</span>
                       <span>Turn on the camera or upload a photo</span>
                    </div>
                 )}
              </div>
            </div>

            {/* VTO RESULT */}
            <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>3. Magic Try-On Results</h3>
              
              <button 
                 onClick={runVTO} 
                 disabled={!userImage || !selectedSku || isGenerating}
                 style={{ 
                    width: '100%', padding: '1rem', 
                    backgroundColor: (!userImage || !selectedSku) ? '#F8F9FA' : '#FF9900', 
                    color: (!userImage || !selectedSku) ? '#879596' : '#FFF', 
                    border: (!userImage || !selectedSku) ? '1px solid #D5D9D9' : 'none', 
                    borderRadius: '8px', fontWeight: 'bold', 
                    cursor: (!userImage || !selectedSku || isGenerating) ? 'not-allowed' : 'pointer', 
                    fontSize: '1rem', marginBottom: '1.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: (!userImage || !selectedSku) ? 'none' : '0 4px 12px rgba(255,153,0,0.2)'
                 }}>
                 {isGenerating ? '🎨 Processing Diffusion GAN...' : '✨ Try It On Now'}
              </button>

              <div style={{ flexGrow: 1, minHeight: '350px', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px solid #EAEAEA', overflow: 'hidden', position: 'relative' }}>
                {vtoResult ? (
                   <div style={{ width: '100%', height: '100%' }}>
                      <img src={vtoResult.draped_image_url} alt="VTO Result" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      <div style={{ position: 'absolute', bottom: '15px', right: '15px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #EAEAEA', minWidth: '200px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: '#131A22' }}>Size Match:</strong> 
                            <span style={{ color: '#008A00', fontWeight: 'bold' }}>{(vtoResult.fit_analysis.size_match_confidence * 100).toFixed(0)}%</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ color: '#131A22' }}>Stress Points:</strong> 
                            <span style={{ color: '#565959' }}>{vtoResult.fit_analysis.predicted_stress_points.join(', ')}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong style={{ color: '#131A22' }}>Return Probability:</strong> 
                            <span style={{ color: '#007185', fontWeight: 'bold' }}>{vtoResult.fit_analysis.return_probability_reduction}</span>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#879596' }}>
                      {isGenerating ? (
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                            <span>Applying AR Overlay...</span>
                         </div>
                      ) : (
                         <span>Your personalized preview will appear here</span>
                      )}
                   </div>
                )}
              </div>
            </div>

          </div>
        </section>
      )}
    </>
  );
}
