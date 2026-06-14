import React, { useState, useRef } from 'react';
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

export default function SerialVerification() {
  const [orderId, setOrderId] = useState('ORD-001');
  const [claimedSN, setClaimedSN] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mlApi = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResult(null); // Reset result on new image
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!imagePreview) return;
    
    setIsVerifying(true);
    setResult(null);
    
    try {
      const res = await fetch(`${mlApi}/api/v1/vision/verify-serial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          image_b64: imagePreview,
          user_claimed_sn: claimedSN || undefined
        })
      });
      
      const json = await res.json();
      if (json.status === 'success') {
        setResult(json.data);
      } else {
        alert(json.message || "Failed to verify.");
      }
    } catch (err) {
      console.error("Verification error", err);
      alert("Error contacting the vision server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className="sv-root">
      <div className="sv-header">
        <h2 className="sv-title">Serial Number Verification</h2>
        <p className="sv-subtitle">
          Multimodal Vision (IDEFICS2 / OCR) to cross-reference returned goods against the outbound shipping ledger.
        </p>
      </div>

      <div className="sv-main-grid">
        {/* Left Col: Upload & Inputs */}
        <div className="sv-card">
          <h3 className="sv-card-title">🔍 Scan Item</h3>
          
          <div className="sv-form-group">
            <label className="sv-label">Outbound Order ID</label>
            <input 
              className="sv-input" 
              value={orderId} 
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. ORD-001"
            />
          </div>

          <div className="sv-form-group">
            <label className="sv-label">Customer Claimed Serial (Optional)</label>
            <input 
              className="sv-input" 
              value={claimedSN} 
              onChange={e => setClaimedSN(e.target.value)}
              placeholder="Leave blank to strictly use ledger..."
            />
          </div>

          <div className="sv-form-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="sv-label">Upload Proof Image</label>
            <div className="sv-upload-area" onClick={() => !imagePreview && fileInputRef.current?.click()}>
              <input 
                type="file" 
                className="sv-file-input" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: imagePreview ? 'none' : 'block' }}
              />
              
              {!imagePreview ? (
                <>
                  <div className="sv-upload-icon">📸</div>
                  <div className="sv-upload-text">Click or Drag Image Here</div>
                  <div className="sv-upload-subtext">JPG, PNG (Max 5MB)</div>
                </>
              ) : (
                <>
                  <button className="sv-clear-btn" onClick={handleClear}>✕</button>
                  <img src={imagePreview} className="sv-preview" alt="Preview" />
                  {isVerifying && (
                    <div className="sv-scanner-wrap">
                      <div className="sv-scanner-line"></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <button 
            className="sv-btn sv-btn-primary" 
            onClick={handleVerify}
            disabled={!imagePreview || isVerifying || !orderId}
            style={{ marginTop: 'auto' }}
          >
            {isVerifying ? 'Scanning Multimodal Vision...' : 'Verify Serial Number'}
          </button>
        </div>

        {/* Right Col: Results */}
        <div className="sv-card">
          <h3 className="sv-card-title">🔬 Verification Result</h3>
          
          <div className="sv-results">
            {isVerifying && (
              <div className="sv-empty-state">
                <div style={{ width: 40, height: 40, border: '3px solid #EAEAEA', borderTopColor: '#FF9900', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <h3 style={{ marginTop: '1.5rem', color: '#131A22' }}>Analyzing Image...</h3>
                <p>Running object detection and OCR parsing.</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!isVerifying && !result && (
              <div className="sv-empty-state">
                <div className="sv-empty-icon">🛡️</div>
                <h3>Awaiting Scan</h3>
                <p>Upload an image and click Verify to run the VLM engine.</p>
              </div>
            )}

            {!isVerifying && result && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div className="sv-verify-header">
                  <div className={`sv-status-icon ${result.verification.is_match ? 'sv-status-match' : 'sv-status-mismatch'}`}>
                    {result.verification.is_match ? '✓' : '✕'}
                  </div>
                  <div>
                    <h3 className="sv-verify-title">
                      {result.verification.is_match ? 'VERIFIED MATCH' : 'MISMATCH DETECTED'}
                    </h3>
                    <div className="sv-verify-subtitle">
                      Fraud Risk: <span className={`sv-risk-badge sv-risk-${result.verification.fraud_risk_level}`}>{result.verification.fraud_risk_level}</span>
                    </div>
                  </div>
                </div>

                <div className="sv-data-grid">
                  <div className="sv-data-box">
                    <div className="sv-data-label">Expected (Ledger)</div>
                    <div className="sv-data-value">{result.expected_serial}</div>
                  </div>
                  
                  <div className="sv-data-box">
                    <div className="sv-data-label">Extracted (Vision API)</div>
                    <div className={`sv-data-value ${result.verification.is_match ? 'match' : 'mismatch'}`}>
                      {result.vision_analysis.extracted_text || 'UNREADABLE'}
                    </div>
                  </div>
                </div>

                <div className="sv-data-grid" style={{ marginTop: '1rem' }}>
                  <div className="sv-data-box">
                    <div className="sv-data-label">OCR Confidence</div>
                    <div className="sv-data-value" style={{ color: '#131A22' }}>
                      {(result.vision_analysis.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="sv-data-box">
                    <div className="sv-data-label">Objects Detected</div>
                    <div className="sv-data-value" style={{ color: '#565959', fontSize: '0.9rem', fontWeight: 600 }}>
                      {result.vision_analysis.detected_objects.join(', ')}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#F8F9FA', borderRadius: '8px', fontSize: '0.85rem', color: '#565959', border: '1px solid #EAEAEA' }}>
                  <strong>Engine Used:</strong> {result.verification.engine_used}<br/>
                  <strong>Order ID:</strong> {result.order_id}<br/>
                  <span style={{ display: 'inline-block', marginTop: '0.5rem', lineHeight: '1.5' }}>
                    {result.verification.is_match 
                      ? "The returned item's serial number perfectly matches our outbound shipping ledger. Proceed with return acceptance."
                      : result.verification.fraud_risk_level === 'HIGH' 
                        ? "CRITICAL: The extracted serial number is completely different from the ledger. Potential 'Item Swapping' fraud detected." 
                        : "WARNING: Slight mismatch detected, likely due to an OCR reading error or minor smudge. Manual review required."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
