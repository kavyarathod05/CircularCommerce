import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionLoader, InlineSpinner } from '../components/Loader';

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
        <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#879596' }}>
          Engine: {result.model_used}{result.cached ? ' · cached' : ''}
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
    setStatusMsg('Estimating body measurements…');

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

      setStatusMsg(isApparel ? 'Removing garment background & compositing on your photo…' : 'Removing background & compositing…');

      const resp = await fetch(`${mlApiUrl}/api/vto/generate`, { method: 'POST', body: formData });
      const json = await resp.json();

      if (json.status === 'success' && json.data) {
        setVtoResult(json.data);
        setStatusMsg('');
        return;
      }
      throw new Error(json.detail || json.error || 'VTO failed');
    } catch (err) {
      console.warn('Orchestrator VTO failed, trying legacy endpoint', err);
      setStatusMsg('Using local overlay fallback…');
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
      setStatusMsg('');
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
      <h2 style={{ marginBottom: '0.35rem', fontSize: '1.8rem', color: '#131A22' }}>Try Before You Buy</h2>
      <p style={{ color: '#565959', marginBottom: '1.5rem' }}>
        Upload your photo — we estimate your fit and overlay the garment on your torso for a quick preview.
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {isGenerating && <InlineSpinner size={16} color="#FFF" />}
            {isGenerating ? statusMsg || 'Generating…' : 'Generate try-on'}
          </button>
          <div style={{ flex: 1, minHeight: 360, background: '#F8F9FA', borderRadius: 10, border: '1px solid #EAEAEA', overflow: 'hidden', position: 'relative' }}>
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Try-on result" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F8F9FA' }} />
                <FitScoreCard result={vtoResult!} />
              </>
            ) : isGenerating ? (
              <SectionLoader label={statusMsg || 'Building preview…'} height={360} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#879596', padding: '1rem', textAlign: 'center' }}>
                Your try-on preview appears here
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
