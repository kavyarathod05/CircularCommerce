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

// Simplified loader component
function ProcessingLoader({ statusMsg, progressSteps }: { statusMsg: string; progressSteps: string[] }) {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      background: '#F8F9FA'
    }}>
      {/* Simple animated loader */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{
          width: 60,
          height: 60,
          border: '3px solid #EAEAEA',
          borderTopColor: '#FF9900',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>

      {/* Status message */}
      <div style={{
        fontSize: '1rem',
        fontWeight: 600,
        color: '#131A22',
        marginBottom: '0.75rem',
        textAlign: 'center',
      }}>
        {statusMsg || 'Processing...'}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        maxWidth: 300,
        height: 3,
        background: '#EAEAEA',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: '1rem',
      }}>
        <div style={{
          height: '100%',
          background: '#FF9900',
          animation: 'loading-bar 2s ease-in-out infinite',
          borderRadius: 3,
        }} />
      </div>

      {/* Progress steps - minimal */}
      {progressSteps.length > 0 && progressSteps.length > 1 && (
        <div style={{
          fontSize: '0.8rem',
          color: '#879596',
          textAlign: 'center',
        }}>
          Step {progressSteps.length} of 4
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Fit score card
function FitScoreCard({ result }: { result: VtoResult }) {
  const matchPct = result.size_match_pct ?? (result.fit_analysis?.size_match_confidence ?? 0) * 100;
  const stress = result.stress_points ?? result.fit_analysis?.predicted_stress_points?.join(', ') ?? 'None';
  const returnRisk = result.return_probability ?? 0;

  return (
    <div style={{
      position: 'absolute', bottom: 15, right: 15, left: 15,
      background: 'rgba(255,255,255,0.98)', padding: '1rem', borderRadius: 10,
      fontSize: '0.85rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid #EAEAEA',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <strong style={{ color: '#131A22', fontSize: '0.95rem' }}>Fit Analysis</strong>
        {result.recommended_size && (
          <span style={{ fontSize: '0.75rem', background: '#F0F8FF', color: '#0066C0', padding: '0.25rem 0.6rem', borderRadius: 4, fontWeight: 600 }}>
            Size: {result.recommended_size}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 6, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959', marginBottom: '0.25rem' }}>Match</div>
          <div style={{ fontWeight: 700, color: matchPct >= 75 ? '#137333' : '#B08D00', fontSize: '1.1rem' }}>{matchPct.toFixed(0)}%</div>
        </div>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 6, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959', marginBottom: '0.25rem' }}>Stress Points</div>
          <div style={{ fontWeight: 600, color: '#565959', fontSize: '0.75rem' }}>{stress}</div>
        </div>
        <div style={{ textAlign: 'center', background: '#F8F9FA', borderRadius: 6, padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#565959', marginBottom: '0.25rem' }}>Return Risk</div>
          <div style={{ fontWeight: 700, color: returnRisk < 10 ? '#137333' : '#B08D00', fontSize: '1.1rem' }}>{returnRisk.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
}

export default function VTOView() {
  const { userRole, activeTab, catalogItems } = useAppContext();
  const [selectedSku, setSelectedSku] = useState('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
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

    addProgress('Analyzing photo...');

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
      formData.append('height_cm', '170'); // Default height
      formData.append('target_size', targetSize);

      addProgress('Processing with AI...');
      await new Promise(r => setTimeout(r, 500));

      const resp = await fetch(`${mlApiUrl}/api/vto/generate`, { method: 'POST', body: formData });
      const json = await resp.json();

      if (json.status === 'success' && json.data) {
        addProgress('Complete!');
        setVtoResult(json.data);
        setStatusMsg('');
        return;
      }
      throw new Error(json.detail || json.error || 'VTO failed');
    } catch (err) {
      console.warn('VTO failed', err);
      addProgress('Using fallback...');
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
        alert('Virtual try-on failed. Please check backend connection.');
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
    <section className="view-section" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.8rem', color: '#131A22' }}>Virtual Try-On</h2>
      <p style={{ color: '#565959', marginBottom: '2rem', fontSize: '0.95rem' }}>
        See how products look on you before buying. Upload your photo and select a product to get started.
      </p>

      {/* Product Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#131A22', fontWeight: 600 }}>Select Product</h3>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {catalogItems.map((item: any) => (
            <div
              key={item.productId}
              onClick={() => setSelectedSku(item.productId)}
              style={{
                minWidth: 160, padding: '1rem', cursor: 'pointer', borderRadius: 8, textAlign: 'center',
                border: selectedSku === item.productId ? '2px solid #FF9900' : '1px solid #D5D9D9',
                background: selectedSku === item.productId ? '#FFFDF8' : '#FFF',
                transition: 'all 0.2s',
              }}
            >
              <img src={item.image || getProductImage(item.productId)} alt="" style={{ height: 60, objectFit: 'contain', width: '100%', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#131A22' }}>{item.productId}</div>
              <div style={{ fontSize: '0.75rem', color: '#565959', marginTop: '0.25rem' }}>₹{item.currentPrice?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? 'repeat(2, 1fr)' : '400px 1fr', gap: '2rem' }}>
        {/* Photo Upload Section */}
        <div style={{ background: '#FFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #D5D9D9' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Your Photo</h3>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            {!isCameraOn ? (
              <button onClick={startCamera} style={{ flex: 1, padding: '0.65rem', background: '#131A22', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Use Camera</button>
            ) : (
              <button onClick={capturePhoto} style={{ flex: 1, padding: '0.65rem', background: '#C7511F', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Capture</button>
            )}
            <label style={{ flex: 1, padding: '0.65rem', background: '#FFF', border: '1px solid #D5D9D9', borderRadius: 6, textAlign: 'center', fontWeight: 600, cursor: 'pointer', color: '#131A22' }}>
              Upload
              <input type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: 'none' }} />
            </label>
          </div>
          {isApparel && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#131A22', display: 'block', marginBottom: '0.5rem' }}>Size to Try</label>
              <select value={targetSize} onChange={e => setTargetSize(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #D5D9D9' }}>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div style={{ height: 320, background: '#F8F9FA', borderRadius: 8, overflow: 'hidden', border: '1px solid #D5D9D9', position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!isCameraOn && userImage && <img src={userImage} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {!isCameraOn && !userImage && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#879596', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem', opacity: 0.3 }}>📷</div>
                <div style={{ fontSize: '0.9rem' }}>Upload or capture your photo</div>
              </div>
            )}
          </div>
          <button
            onClick={runVTO}
            disabled={!userImage || !selectedSku || isGenerating}
            style={{
              width: '100%', padding: '0.85rem', marginTop: '1rem', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: !userImage || !selectedSku ? '#F0F0F0' : '#FF9900', color: !userImage || !selectedSku ? '#999' : '#131A22',
              fontSize: '0.95rem',
            }}
          >
            {isGenerating ? 'Processing...' : 'Generate Try-On'}
          </button>
        </div>

        {/* Preview Section */}
        <div style={{ background: '#FFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #D5D9D9' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Preview</h3>
          <div style={{ minHeight: 400, background: '#F8F9FA', borderRadius: 8, border: '1px solid #D5D9D9', overflow: 'hidden', position: 'relative' }}>
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Try-on result" style={{ width: '100%', height: '100%', objectFit: 'contain', minHeight: 400 }} />
                <FitScoreCard result={vtoResult!} />
              </>
            ) : isGenerating ? (
              <ProcessingLoader statusMsg={statusMsg} progressSteps={progressSteps} />
            ) : (
              <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#879596', padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>👕</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#131A22', marginBottom: '0.5rem' }}>
                  Your virtual try-on will appear here
                </div>
                <div style={{ fontSize: '0.85rem', color: '#565959' }}>
                  Upload a photo and select a product to get started
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
