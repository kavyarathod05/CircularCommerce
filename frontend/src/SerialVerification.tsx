import { useState, useRef, useEffect } from 'react';
import './SerialVerification.css';

interface VerificationResult {
  status: string;
  order_id: string;
  expected_serial: string;
  vision_analysis: {
    extracted_text: string;
    confidence: number;
    bounding_box: number[] | null;
    detected_objects: string[];
  };
  verification: {
    is_match: boolean;
    fraud_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    engine_used: string;
  };
}

type Variant = 'seller' | 'admin';

export default function SerialVerification({ variant = 'admin' }: { variant?: Variant }) {
  const mlApi = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
  const LABEL_URL = `${mlApi}/static/demo-package-label.svg`;

  const [orderId, setOrderId] = useState('ORD-001');
  const [claimedSN, setClaimedSN] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expectedSerial, setExpectedSerial] = useState('SN-984A-B72C-11');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImageAsDataUrl = async (url: string) => {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    const loadDemo = async () => {
      try {
        const metaRes = await fetch(`${mlApi}/api/v1/demo/serial-sample`);
        const meta = await metaRes.json();
        if (meta.status === 'success') {
          setOrderId(meta.data.order_id);
          setExpectedSerial(meta.data.expected_serial);
        }
        const samplePath = meta?.data?.sample_image_url || '/static/demo-package-label.svg';
        const fullUrl = samplePath.startsWith('http') ? samplePath : `${mlApi}${samplePath.startsWith('/') ? samplePath : `/${samplePath}`}`;
        const dataUrl = await fetchImageAsDataUrl(fullUrl);
        setImagePreview(dataUrl);
      } catch {
        try {
          const dataUrl = await fetchImageAsDataUrl(LABEL_URL);
          setImagePreview(dataUrl);
        } catch (e) {
          console.error('Failed to load demo label', e);
        }
      }
    };
    loadDemo();
  }, [mlApi]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runVerify = async (image: string) => {
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await fetch(`${mlApi}/api/v1/vision/verify-serial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          image_b64: image,
          user_claimed_sn: claimedSN || undefined,
        }),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setResult(json.data);
      } else {
        alert(json.message || 'Verification failed.');
      }
    } catch (err) {
      console.error('Verification error', err);
      alert('Could not reach verification service.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (!imagePreview) return;
    runVerify(imagePreview);
  };

  const loadDemoAndVerify = async () => {
    setOrderId('ORD-001');
    setExpectedSerial('SN-984A-B72C-11');
    try {
      const dataUrl = await fetchImageAsDataUrl(LABEL_URL);
      setImagePreview(dataUrl);
      runVerify(dataUrl);
    } catch {
      alert('Could not load demo label. Is the backend running on port 8000?');
    }
  };

  return (
    <section className="sv-root">
      <div className="sv-header">
        <h2 className="sv-title">{variant === 'admin' ? 'Package Verification' : 'Package Checks'}</h2>
        <p className="sv-subtitle">
          {variant === 'admin'
            ? 'Compare returned package labels against your outbound shipping records.'
            : 'Confirm the item returned matches what you originally shipped.'}
        </p>
      </div>

      <div style={{ background: '#F0FBFC', border: '1px solid #BFEAF1', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ color: '#131A22' }}>Sample shipping label loaded</strong>
          <div style={{ color: '#565959', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Order {orderId} · Expected serial <strong>{expectedSerial}</strong>
          </div>
        </div>
        <button className="sv-btn sv-btn-primary" style={{ width: 'auto', padding: '0.65rem 1.25rem' }} onClick={loadDemoAndVerify} disabled={isVerifying}>
          Run demo verification
        </button>
      </div>

      <div className="sv-main-grid">
        <div className="sv-card">
          <h3 className="sv-card-title">Upload label photo</h3>

          <div className="sv-form-group">
            <label className="sv-label">Order ID</label>
            <input className="sv-input" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-001" />
          </div>

          {variant === 'admin' && (
            <div className="sv-form-group">
              <label className="sv-label">Customer claimed serial (optional)</label>
              <input className="sv-input" value={claimedSN} onChange={e => setClaimedSN(e.target.value)} placeholder="Leave blank to use ledger only" />
            </div>
          )}

          <div className="sv-form-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="sv-label">Package label image</label>
            <div className="sv-upload-area" style={{ minHeight: 320 }}>
              {!imagePreview ? (
                <div className="sv-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                  <div className="sv-upload-text">Click to upload label photo</div>
                  <div className="sv-upload-subtext">JPG or PNG</div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
              ) : (
                <div className="sv-preview-wrap">
                  <button type="button" className="sv-clear-btn" onClick={() => { setImagePreview(null); setResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>×</button>
                  <img src={imagePreview} className="sv-preview" alt="Package label" onError={() => fetchImageAsDataUrl(LABEL_URL).then(setImagePreview).catch(() => {})} />
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                </div>
              )}
            </div>
          </div>

          <button className="sv-btn sv-btn-primary" onClick={handleVerify} disabled={!imagePreview || isVerifying || !orderId}>
            {isVerifying ? 'Checking label...' : 'Verify package'}
          </button>
        </div>

        <div className="sv-card">
          <h3 className="sv-card-title">Expected vs detected</h3>
          <div className="sv-results">
            {isVerifying && (
              <div className="sv-empty-state">
                <div style={{ width: 40, height: 40, border: '3px solid #EAEAEA', borderTopColor: '#FF9900', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <h3 style={{ marginTop: '1.5rem', color: '#131A22' }}>Reading label...</h3>
                <p>Matching serial number to shipping records.</p>
              </div>
            )}

            {!isVerifying && !result && (
              <div className="sv-empty-state">
                <h3>Ready to verify</h3>
                <p>Expected serial for {orderId}: <strong>{expectedSerial}</strong></p>
                <p style={{ marginTop: '0.5rem' }}>Label photo is loaded — click Verify package or Run demo verification.</p>
              </div>
            )}

            {!isVerifying && result && (
              <div>
                <div className="sv-verify-header">
                  <div className={`sv-status-icon ${result.verification.is_match ? 'sv-status-match' : 'sv-status-mismatch'}`}>
                    {result.verification.is_match ? 'OK' : 'X'}
                  </div>
                  <div>
                    <h3 className="sv-verify-title">{result.verification.is_match ? 'Match confirmed' : 'Mismatch found'}</h3>
                    <div className="sv-verify-subtitle">
                      Risk level: <span className={`sv-risk-badge sv-risk-${result.verification.fraud_risk_level}`}>{result.verification.fraud_risk_level}</span>
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div style={{ marginTop: '1rem', borderRadius: 8, overflow: 'hidden', border: '1px solid #EAEAEA', background: '#fff' }}>
                    <img src={imagePreview} alt="Verified label" style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }} />
                  </div>
                )}

                <div className="sv-data-grid">
                  <div className="sv-data-box">
                    <div className="sv-data-label">Expected (shipped)</div>
                    <div className="sv-data-value">{result.expected_serial}</div>
                  </div>
                  <div className="sv-data-box">
                    <div className="sv-data-label">Read from photo</div>
                    <div className={`sv-data-value ${result.verification.is_match ? 'match' : 'mismatch'}`}>
                      {result.vision_analysis.extracted_text || 'Unreadable'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8F9FA', borderRadius: '8px', fontSize: '0.9rem', color: '#565959', border: '1px solid #EAEAEA' }}>
                  {result.verification.is_match
                    ? 'The returned package matches your outbound record. You can accept the return.'
                    : result.verification.fraud_risk_level === 'HIGH'
                      ? 'The serial number does not match. Hold the return for manual review.'
                      : 'Minor read difference detected. Ask the customer to resubmit a clearer photo.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
