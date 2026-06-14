import { useState, useEffect } from 'react';
import './FraudInvestigations.css';

type Variant = 'seller' | 'admin';

const mlApi = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
const RECEIPT_FALLBACK = `${mlApi}/static/demo-receipt.svg`;

function receiptSrc(url?: string) {
  if (!url) return RECEIPT_FALLBACK;
  if (url.startsWith('http')) return url;
  return `${mlApi}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function FraudInvestigations({ variant = 'admin' }: { variant?: Variant }) {
  const [userId, setUserId] = useState('usr-12');
  const [isSearching, setIsSearching] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);
  const [reviewData, setReviewData] = useState<any>(null);

  const fetchFraudData = async () => {
    setIsSearching(true);
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';

      const trustRes = await fetch(`${mlApiUrl}/api/v1/ml/fraud/trust-score/${userId}`);
      if (trustRes.ok) {
        const tData = await trustRes.json();
        setFraudData(tData.data);
      }

      if (variant === 'admin') {
        const ragRes = await fetch(`${mlApiUrl}/api/v1/ml/fraud-graphrag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, receipt_image_base64: 'demo' }),
        });
        if (ragRes.ok) {
          const rData = await ragRes.json();
          setReviewData(rData.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch fraud data', e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, [variant]);

  const score = fraudData?.final_score ?? '--';
  const scoreColor = typeof score === 'number'
    ? (score > 70 ? '#137333' : score > 30 ? '#B08D00' : '#C5221F')
    : '#879596';

  const trustSignals = [
    { label: 'Purchase history', value: fraudData?.purchase_count ?? '12 orders', ok: true },
    { label: 'Return rate', value: fraudData?.return_rate ?? '8%', ok: !fraudData?.fraud_flag },
    { label: 'Device fingerprint', value: reviewData ? '1 shared device flagged' : 'Checking...', ok: !reviewData?.connected_accounts },
    { label: 'Receipt integrity', value: reviewData ? `${(reviewData.tampering_probability * 100).toFixed(0)}% edit risk` : 'Pending', ok: (reviewData?.tampering_probability ?? 0) < 0.5 },
  ];

  return (
    <section className="view-section fraud-container">
      <h2 className="fraud-title">{variant === 'admin' ? 'Fraud Center' : 'Return Reviews'}</h2>
      <p className="fraud-subtitle">
        {variant === 'admin'
          ? 'Every return is checked against purchase history, receipt edits, and linked accounts before a refund is approved.'
          : 'Quick trust checks on returns before you approve refunds.'}
      </p>

      {variant === 'admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Returns reviewed today', value: '847' },
            { label: 'Fraud blocked', value: '23' },
            { label: 'Avg trust score', value: '74' },
            { label: 'Instant refunds saved', value: '₹4.2L' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FFF', border: '1px solid #EAEAEA', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#131A22' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#565959', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="fraud-search-bar">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Customer ID (e.g. usr-12)"
          className="fraud-input"
        />
        <button onClick={fetchFraudData} className="fraud-btn" disabled={isSearching}>
          {isSearching ? 'Checking...' : 'Run review'}
        </button>
      </div>

      <div className="fraud-grid" style={{ gridTemplateColumns: variant === 'seller' ? '1fr' : undefined }}>
        <div className="fraud-panel trust-panel">
          <h3>{variant === 'admin' ? 'Customer trust profile' : 'Return trust score'}</h3>
          {fraudData ? (
            <div className="trust-content">
              <div className="score-ring" style={{ borderColor: scoreColor }}>
                <span className="score-value">{score}</span>
                <span className="score-label">Trust score</span>
              </div>
              <div className="trust-details">
                <p><strong>Status:</strong>{' '}
                  <span style={{ color: fraudData.fraud_flag ? '#C5221F' : '#137333', fontWeight: 'bold' }}>
                    {fraudData.fraud_flag ? 'Review required' : 'Looks normal'}
                  </span>
                </p>
                <p><strong>Recommended action:</strong>{' '}
                  {fraudData.revoke_keep_and_credit
                    ? 'Do not approve instant refund'
                    : variant === 'seller'
                      ? 'Proceed with standard return flow'
                      : 'Standard return flow approved'}
                </p>
                {variant === 'seller' && (
                  <p style={{ color: '#565959', fontSize: '0.9rem', marginTop: '0.75rem' }}>
                    Full receipt and network investigation tools are available in the admin Fraud Center.
                  </p>
                )}
                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                  {trustSignals.map(sig => (
                    <div key={sig.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0', borderBottom: '1px solid #F0F2F2' }}>
                      <span style={{ color: '#565959' }}>{sig.label}</span>
                      <span style={{ fontWeight: 700, color: sig.ok ? '#137333' : '#C5221F' }}>{sig.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="fraud-loading">Loading trust profile...</div>
          )}
        </div>

        {variant === 'admin' && (
          <>
            <div className="fraud-panel rag-panel">
              <h3>Investigation summary</h3>
              {reviewData ? (
                <div className="rag-content">
                  <div className="rag-summary-box">
                    <p>{reviewData.graphrag_summary}</p>
                  </div>
                  <div className="rag-stats">
                    <div className="stat-item">
                      <span className="stat-value">{reviewData.connected_accounts ?? 0}</span>
                      <span className="stat-label">Linked accounts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value" style={{ color: reviewData.tampering_probability > 0.8 ? '#C5221F' : 'inherit' }}>
                        {(reviewData.tampering_probability * 100).toFixed(0)}%
                      </span>
                      <span className="stat-label">Receipt edit risk</span>
                    </div>
                  </div>
                  <p style={{ margin: '0.75rem 0 0', color: '#565959', fontSize: '0.9rem' }}>
                    <strong>Next step:</strong> {reviewData.recommended_action}
                  </p>
                </div>
              ) : (
                <div className="fraud-loading">Building investigation summary...</div>
              )}
            </div>

            <div className="fraud-panel ela-panel">
              <h3>Receipt review</h3>
              <div className="ela-visualization">
                {reviewData ? (
                  <div className="ela-image-wrapper">
                    <img
                      src={receiptSrc(reviewData.receipt_image_url)}
                      alt="Store receipt under review"
                      className="ela-image"
                      style={{ filter: 'none', objectFit: 'contain', background: '#fff' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = RECEIPT_FALLBACK; }}
                    />
                    <div className="ela-overlay">
                      {(reviewData.ela_regions || []).map((region: any, i: number) => (
                        <div
                          key={i}
                          className="ela-hotspot"
                          style={{
                            top: `${region.y_pct}%`,
                            left: `${region.x_pct}%`,
                            width: `${region.w_pct}%`,
                            height: `${region.h_pct}%`,
                            borderColor: region.severity === 'high' ? '#C5221F' : '#FF9900',
                          }}
                          title={region.label}
                        >
                          <span className="ela-hotspot-label">{region.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="fraud-loading">Loading receipt preview...</div>
                )}
              </div>
              <p className="gnn-caption">
                Highlighted areas show fields that were likely edited after the original purchase. Compare with in-store records before approving a refund.
              </p>
            </div>

            <div className="fraud-panel gnn-panel">
              <h3>Linked account map</h3>
              <div className="gnn-visualization">
                {reviewData ? (
                <svg width="100%" height="100%" viewBox="0 0 420 220">
                  {(reviewData?.network_edges || []).map((edge: any, i: number) => {
                    const nodes = Object.fromEntries((reviewData.network_nodes || []).map((n: any) => [n.id, n]));
                    const from = nodes[edge.from];
                    const to = nodes[edge.to];
                    if (!from || !to) return null;
                    const positions: Record<string, [number, number]> = {
                      target: [210, 110], device: [80, 55], address: [340, 55], ring: [120, 170], acct1: [210, 190], acct2: [300, 170],
                    };
                    const [x1, y1] = positions[from.id] || [100, 100];
                    const [x2, y2] = positions[to.id] || [300, 100];
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={to.risk === 'high' ? '#C5221F' : '#D5D9D9'} strokeWidth="2" opacity="0.8" />;
                  })}
                  {(reviewData?.network_nodes || []).map((node: any) => {
                    const positions: Record<string, [number, number]> = {
                      target: [210, 110], device: [80, 55], address: [340, 55], ring: [120, 170], acct1: [210, 190], acct2: [300, 170],
                    };
                    const [cx, cy] = positions[node.id] || [200, 100];
                    const color = node.risk === 'high' ? '#C5221F' : node.risk === 'medium' ? '#FF9900' : '#137333';
                    const r = node.id === 'target' ? 22 : 16;
                    return (
                      <g key={node.id}>
                        <circle cx={cx} cy={cy} r={r} fill={color} />
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="700">{node.label.slice(0, 6)}</text>
                        <text x={cx} y={cy + r + 12} textAnchor="middle" fill="#565959" fontSize="8">{node.type}</text>
                      </g>
                    );
                  })}
                </svg>
                ) : (
                  <div className="fraud-loading">Loading account map...</div>
                )}
              </div>
              <p className="gnn-caption">This customer shares a device and address with a cluster of accounts linked to suspicious returns.</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
