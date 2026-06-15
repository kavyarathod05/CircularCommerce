import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

type VtoResult = {
  tryon_image_url?: string;
  draped_image_url?: string;
  size_match_pct?: number;
  stress_points?: string;
  return_probability?: number;
  recommended_size?: string;
  model_used?: string;
  cached?: boolean;
  fit_analysis?: {
    size_match_confidence?: number;
    predicted_stress_points?: string[];
    return_probability_reduction?: string;
  };
};

// Professional AI-themed loader component
function AILoader({ statusMsg, progressSteps }: { statusMsg: string; progressSteps: string[] }) {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '3rem 2rem',
      background: 'linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%)'
    }}>
      {/* Animated AI Brain Icon */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        {/* Outer spinning ring */}
        <div style={{
          width: 100,
          height: 100,
          border: '3px solid transparent',
          borderTopColor: '#667eea',
          borderRightColor: '#764ba2',
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite',
          position: 'absolute',
          top: -10,
          left: -10,
        }} />
        
        {/* Middle pulsing ring */}
        <div style={{
          width: 80,
          height: 80,
          border: '2px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        
        {/* Inner icon */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '2.5rem',
        }}>
          🤖
        </div>
      </div>

      {/* Main status message */}
      <div style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#131A22',
        marginBottom: '1rem',
        textAlign: 'center',
      }}>
        {statusMsg || 'Processing your virtual try-on...'}
      </div>

      {/* Progress indicator bar */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        height: 4,
        background: '#EAEAEA',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          animation: 'loading-bar 2s ease-in-out infinite',
          borderRadius: 4,
        }} />
      </div>

      {/* Progress steps */}
      {progressSteps.length > 0 && (
        <div style={{
          width: '100%',
          maxWidth: 450,
          background: '#FFF',
          padding: '1.5rem',
          borderRadius: 12,
          border: '1px solid #EAEAEA',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#565959',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              width: 8,
              height: 8,
              background: '#667eea',
              borderRadius: '50%',
              animation: 'pulse 1s ease-in-out infinite',
            }} />
            Processing Steps
          </div>
          {progressSteps.map((step, i) => (
            <div
              key={i}
              style={{
                padding: '0.6rem 0',
                fontSize: '0.875rem',
                color: i === progressSteps.length - 1 ? '#667eea' : '#879596',
                fontWeight: i === progressSteps.length - 1 ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderBottom: i < progressSteps.length - 1 ? '1px solid #F0F0F0' : 'none',
                animation: i === progressSteps.length - 1 ? 'fade-in 0.3s ease-in' : 'none',
              }}
            >
              {i === progressSteps.length - 1 ? (
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #667eea',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0,
                }} />
              ) : (
                <div style={{
                  width: 20,
                  height: 20,
                  background: '#D3F4E7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}>
                  ✓
                </div>
              )}
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI processing note */}
      <div style={{
        marginTop: '1.5rem',
        fontSize: '0.8rem',
        color: '#879596',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        ⚡ Powered by state-of-the-art AI diffusion models
        <br />
        <span style={{ fontSize: '0.75rem' }}>
          First-time processing may take 30-60 seconds
        </span>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FitScoreCard({ result }: { result: VtoResult }) {
  const matchPct = result.size_match_pct ?? (result.fit_analysis?.size_match_confidence ?? 0) * 100;
  const stress = result.stress_points ?? result.fit_analysis?.predicted_stress_points?.join(', ') ?? '—';
  const returnRisk = result.return_probability ?? result.fit_analysis?.return_probability_reduction ?? '—';

  return (
    <div style={{
      position: 'absolute', bottom: 15, right: 15, left: 15,
      background: 'rgba(255,255,255,0.97)', padding: '1rem 1.15rem', borderRadius: 12,
      fontSize: '0.85rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #EAEAEA',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <strong style={{ color: '#131A22', fontSize: '0.95rem' }}>Fit analysis</strong>
        {result.recommended_size && (
          <span style={{ fontSize: '0.75rem', background: '#F0FBFC', color: '#007185', padding: '0.2rem 0.55rem', borderRadius: 999, fontWeight: 700 }}>
            Best size: {result.recommended_size}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 8, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959' }}>Size match</div>
          <div style={{ fontWeight: 800, color: matchPct >= 75 ? '#137333' : '#B08D00', fontSize: '1.2rem' }}>{matchPct.toFixed(0)}%</div>
        </div>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 8, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959' }}>Stress</div>
          <div style={{ fontWeight: 600, color: '#565959', fontSize: '0.78rem', lineHeight: 1.3 }}>{stress}</div>
        </div>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 8, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959' }}>Return risk</div>
          <div style={{ fontWeight: 800, color: '#007185', fontSize: '0.95rem' }}>
            {typeof returnRisk === 'number' ? `${returnRisk.toFixed(0)}%` : returnRisk}
          </div>
        </div>
      </div>
      {result.model_used && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#879596', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span>Engine: {result.model_used}{result.cached ? ' · cached' : ''}</span>
          {result.model_used.includes('kolors') && (
            <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFF', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>
              ⚡ KOLORS AI
            </span>
          )}
          {result.model_used.includes('idm-vton') && (
            <span style={{ background: '#D3F4E7', color: '#137333', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>
              IDM-VTON
            </span>
          )}
          {result.model_used.includes('local') && (
            <span style={{ background: '#FFF3CD', color: '#856404', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700 }}>
              LOCAL OVERLAY
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function VTOView() {
  const { userRole, activeTab, catalogItems } = useAppContext();
  const [selectedSku, setSelectedSku] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [heightCm, setHeightCm] = useState(170);
  const [targetSize, setTargetSize] = useState('M');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [vtoResult, setVtoResult] = useState<VtoResult | null>(null);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';

  const isApparel = /hoodie|shirt|jacket|jeans|cotton/i.test(selectedSku);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraOn(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch {
      alert('Camera access denied or unavailable.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.translate(canvasRef.current.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      setUserFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
      setUserImage(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUserFile(file);
    setUserImage(URL.createObjectURL(file));
    stopCamera();
  };

  const getProductImage = (sku: string) => {
    const item = catalogItems.find((i: any) => i.productId === sku);
    if (item?.image) return item.image;
    if (/headphone|bose/i.test(sku)) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
    if (/hoodie|shirt/i.test(sku)) return 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800';
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
  };

  const runVTO = async () => {
    if ((!userFile && !userImage) || !selectedSku) {
      alert('Please add a photo and select a product.');
      return;
    }

    setIsGenerating(true);
    setVtoResult(null);
    setProgressSteps([]);
    
    const addProgress = (step: string) => {
      setProgressSteps(prev => [...prev, step]);
      setStatusMsg(step);
    };

    addProgress('📸 Processing your photo...');

    try {
      let photoBlob: Blob;
      if (userFile) {
        photoBlob = userFile;
      } else if (userImage) {
        photoBlob = await (await fetch(userImage)).blob();
      } else {
        throw new Error('No photo');
      }

      const formData = new FormData();
      formData.append('photo', photoBlob, 'user.jpg');
      formData.append('product_id', selectedSku);
      formData.append('height_cm', String(heightCm));
      formData.append('target_size', targetSize);

      addProgress('📏 Estimating body measurements...');
      await new Promise(r => setTimeout(r, 800)); // Allow UI update

      addProgress(isApparel ? '🤖 Initializing Kolors AI Virtual Try-On...' : '🎨 Processing product image...');

      const resp = await fetch(`${mlApiUrl}/api/vto/generate`, { method: 'POST', body: formData });
      const json = await resp.json();

      if (json.status === 'success' && json.data) {
        addProgress('✨ Virtual try-on complete!');
        setVtoResult(json.data);
        setStatusMsg('');
        
        // Show model quality indicator
        const modelUsed = json.data.model_used || '';
        if (modelUsed.includes('kolors')) {
          addProgress('⚡ Powered by Kolors AI (Best Quality)');
        } else if (modelUsed.includes('idm')) {
          addProgress('🎯 Powered by IDM-VTON');
        } else if (modelUsed.includes('cached')) {
          addProgress('💾 Retrieved from cache');
        }
        
        return;
      }
      throw new Error(json.detail || json.error || 'VTO failed');
    } catch (err) {
      console.warn('Orchestrator VTO failed, trying legacy endpoint', err);
      addProgress('⚙️ Using fallback overlay engine...');
      try {
        const b64 = userImage || (userFile ? await blobToDataUrl(userFile) : '');
        const resp = await fetch(`${mlApiUrl}/api/v1/ml/vto/drape`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_image_base64: b64, clothing_sku: selectedSku }),
        });
        const data = await resp.json();
        if (data.status === 'success') setVtoResult(data.data);
        else alert('Could not generate preview.');
      } catch {
        alert('Try-on failed. Check backend is running on port 8000.');
      }
    } finally {
      setIsGenerating(false);
      if (!vtoResult) {
        setStatusMsg('');
        setProgressSteps([]);
      }
    }
  };

  async function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  useEffect(() => {
    if (catalogItems.length > 0 && !selectedSku) {
      setSelectedSku(catalogItems[0].productId);
    }
  }, [catalogItems, selectedSku]);

  const previewUrl = vtoResult?.tryon_image_url || vtoResult?.draped_image_url;

  if (!(userRole === 'buyer' && activeTab === 'vto')) return null;

  return (
    <section className="view-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Kolors VTO Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#FFF',
        padding: '1rem 1.5rem',
        borderRadius: 12,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ fontSize: '2rem' }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            Kolors AI Virtual Try-On Enabled
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>
            State-of-the-art AI generates photorealistic try-on results with accurate garment draping
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '0.5rem 1rem',
          borderRadius: 8,
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          ACTIVE
        </div>
      </div>

      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.8rem', color: '#131A22' }}>Try Before You Buy</h2>
      <p style={{ color: '#565959', marginBottom: '1.5rem' }}>
        Upload your photo — powered by <strong>Kolors AI Virtual Try-On</strong> for photorealistic garment fitting and size recommendations.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#131A22' }}>1. Select product</h3>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {catalogItems.map((item: any) => (
            <div
              key={item.productId}
              onClick={() => setSelectedSku(item.productId)}
              style={{
                minWidth: 180, padding: '0.85rem', cursor: 'pointer', borderRadius: 8, textAlign: 'center',
                border: selectedSku === item.productId ? '2px solid #FF9900' : '1px solid #EAEAEA',
                background: selectedSku === item.productId ? '#FFFDF9' : '#FFF',
              }}
            >
              <img src={item.image || getProductImage(item.productId)} alt="" style={{ height: 64, objectFit: 'contain', width: '100%' }} />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: 6 }}>{item.productId}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: '#FFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #EAEAEA' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>2. Your photo & measurements</h3>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            {!isCameraOn ? (
              <button onClick={startCamera} style={{ flex: 1, padding: '0.65rem', background: '#131A22', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Camera</button>
            ) : (
              <button onClick={capturePhoto} style={{ flex: 1, padding: '0.65rem', background: '#C5221F', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Capture</button>
            )}
            <label style={{ flex: 1, padding: '0.65rem', background: '#F8F9FA', border: '1px solid #D5D9D9', borderRadius: 8, textAlign: 'center', fontWeight: 700, cursor: 'pointer' }}>
              Upload
              <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#565959' }}>Your height (cm)</label>
              <input type="number" min={140} max={210} value={heightCm} onChange={e => setHeightCm(Number(e.target.value) || 170)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #D5D9D9', marginTop: 4 }} />
            </div>
            {isApparel && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#565959' }}>Size to try</label>
                <select value={targetSize} onChange={e => setTargetSize(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #D5D9D9', marginTop: 4 }}>
                  {['S', 'M', 'L', 'XL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ height: 320, background: '#F8F9FA', borderRadius: 10, overflow: 'hidden', border: '2px dashed #D5D9D9', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!isCameraOn && userImage && <img src={userImage} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {!isCameraOn && !userImage && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#879596' }}>Add a clear front-facing photo</div>
            )}
          </div>
        </div>

        <div style={{ background: '#FFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #EAEAEA', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>3. Your preview</h3>
          <button
            onClick={runVTO}
            disabled={!userImage || !selectedSku || isGenerating}
            style={{
              width: '100%', padding: '0.85rem', marginBottom: '1rem', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: !userImage || !selectedSku ? '#F8F9FA' : '#FF9900', color: !userImage || !selectedSku ? '#879596' : '#FFF',
            }}
          >
            {isGenerating ? (statusMsg || 'Generating…') : 'Generate try-on'}
          </button>
          <div style={{ flex: 1, minHeight: 360, background: '#F8F9FA', borderRadius: 10, border: '1px solid #EAEAEA', overflow: 'hidden', position: 'relative' }}>
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Try-on result" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F8F9FA' }} />
                <FitScoreCard result={vtoResult!} />
              </>
            ) : isGenerating ? (
              <AILoader statusMsg={statusMsg} progressSteps={progressSteps} />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#879596', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👕</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#131A22', marginBottom: '0.5rem' }}>
                  Your try-on preview appears here
                </div>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '1rem' }}>
                  Upload a photo and select a product to get started
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  color: '#667eea',
                  fontWeight: 600,
                }}>
                  ⚡ Powered by AI Virtual Try-On
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
