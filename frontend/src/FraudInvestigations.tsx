import { useState, useEffect } from 'react';
import './FraudInvestigations.css';

export default function FraudInvestigations() {
  const [userId, setUserId] = useState('usr-12');
  const [isSearching, setIsSearching] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);
  const [graphRagData, setGraphRagData] = useState<any>(null);

  const fetchFraudData = async () => {
    setIsSearching(true);
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';
      
      // Fetch Trust Score
      const trustRes = await fetch(`${mlApiUrl}/api/v1/ml/fraud/trust-score/${userId}`);
      if (trustRes.ok) {
        const tData = await trustRes.json();
        setFraudData(tData.data);
      }

      // Fetch GraphRAG
      const ragRes = await fetch(`${mlApiUrl}/api/v1/ml/fraud-graphrag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, receipt_image_base64: 'mock_base64' })
      });
      if (ragRes.ok) {
        const rData = await ragRes.json();
        setGraphRagData(rData.data);
      }
    } catch (e) {
      console.error("Failed to fetch fraud data", e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, []);

  return (
    <section className="view-section fraud-container">
      <h2 className="fraud-title">Fraud Investigations Hub (SEFraud)</h2>
      <p className="fraud-subtitle">Powered by Heterogeneous Graph Neural Networks (GNN) and GraphRAG</p>

      <div className="fraud-search-bar">
        <input 
          type="text" 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)} 
          placeholder="Enter User ID (e.g., usr-12)" 
          className="fraud-input"
        />
        <button onClick={fetchFraudData} className="fraud-btn" disabled={isSearching}>
          {isSearching ? 'Analyzing Network...' : 'Analyze Risk'}
        </button>
      </div>

      <div className="fraud-grid">
        {/* Trust Score & Profile */}
        <div className="fraud-panel trust-panel">
          <h3>User Risk Profile</h3>
          {fraudData ? (
            <div className="trust-content">
              <div className="score-ring" style={{ borderColor: fraudData.final_score > 70 ? '#137333' : fraudData.final_score > 30 ? '#B08D00' : '#C5221F' }}>
                <span className="score-value">{fraudData.final_score}</span>
                <span className="score-label">Trust Score</span>
              </div>
              <div className="trust-details">
                <p><strong>Original Score:</strong> {fraudData.original_score}</p>
                <p><strong>Status:</strong> <span style={{ color: fraudData.fraud_flag ? '#C5221F' : '#137333', fontWeight: 'bold' }}>{fraudData.fraud_flag ? 'HIGH RISK' : 'CLEARED'}</span></p>
                <p><strong>Action:</strong> {fraudData.revoke_keep_and_credit ? 'Revoke "Keep & Credit" privileges' : 'Standard return flow approved'}</p>
              </div>
            </div>
          ) : (
            <div className="fraud-loading">Loading trust profile...</div>
          )}
        </div>

        {/* GraphRAG Summary */}
        <div className="fraud-panel rag-panel">
          <h3>GraphRAG Intelligent Summary</h3>
          {graphRagData ? (
            <div className="rag-content">
              <div className="rag-summary-box">
                <span className="rag-icon">✨</span>
                <p>{graphRagData.graphrag_summary}</p>
              </div>
              <div className="rag-stats">
                <div className="stat-item">
                  <span className="stat-value">40</span>
                  <span className="stat-label">Connected Suspicious Accounts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: graphRagData.tampering_probability > 0.8 ? '#C5221F' : 'inherit' }}>
                    {(graphRagData.tampering_probability * 100).toFixed(0)}%
                  </span>
                  <span className="stat-label">Receipt Tampering Probability</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="fraud-loading">Synthesizing network data...</div>
          )}
        </div>

        {/* Visual GNN Mockup */}
        <div className="fraud-panel gnn-panel">
          <h3>Network Fraud Graph (GNN)</h3>
          <div className="gnn-visualization">
             <svg width="100%" height="100%" viewBox="0 0 400 200">
               {/* Edges */}
               <line x1="200" y1="100" x2="100" y2="50" stroke="#EAEAEA" strokeWidth="2" strokeDasharray="4"/>
               <line x1="200" y1="100" x2="300" y2="50" stroke="#EAEAEA" strokeWidth="2"/>
               <line x1="200" y1="100" x2="150" y2="150" stroke="#C5221F" strokeWidth="2"/>
               <line x1="200" y1="100" x2="250" y2="150" stroke="#EAEAEA" strokeWidth="2"/>
               
               {/* Central Node (Target User) */}
               <circle cx="200" cy="100" r="20" fill={fraudData?.fraud_flag ? '#C5221F' : '#137333'} />
               <text x="200" y="105" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold">USR</text>
               
               {/* Connected Nodes */}
               <circle cx="100" cy="50" r="15" fill="#565959" />
               <text x="100" y="55" textAnchor="middle" fill="#FFF" fontSize="8">IP</text>

               <circle cx="300" cy="50" r="15" fill="#565959" />
               <text x="300" y="55" textAnchor="middle" fill="#FFF" fontSize="8">DEV</text>

               {/* High risk cluster connection */}
               <circle cx="150" cy="150" r="15" fill="#C5221F" />
               <text x="150" y="155" textAnchor="middle" fill="#FFF" fontSize="8">RING</text>
               <circle cx="120" cy="170" r="10" fill="#C5221F" opacity="0.6"/>
               <circle cx="170" cy="180" r="10" fill="#C5221F" opacity="0.6"/>
               <line x1="150" y1="150" x2="120" y2="170" stroke="#C5221F" strokeWidth="1" opacity="0.5"/>
               <line x1="150" y1="150" x2="170" y2="180" stroke="#C5221F" strokeWidth="1" opacity="0.5"/>

               <circle cx="250" cy="150" r="15" fill="#007185" />
               <text x="250" y="155" textAnchor="middle" fill="#FFF" fontSize="8">PAY</text>
             </svg>
          </div>
          <p className="gnn-caption">Nodes represent users, devices, IPs, and payment methods. The model detects multi-accounting via shared identifiers.</p>
        </div>

        {/* ELA Heatmap Mockup */}
        <div className="fraud-panel ela-panel">
          <h3>Error Level Analysis (ELA)</h3>
          <div className="ela-visualization">
            {graphRagData ? (
              <div className="ela-image-wrapper">
                <img src={graphRagData.ela_heatmap_url} alt="ELA Heatmap" className="ela-image" />
                <div className="ela-overlay">
                   <div className="ela-hotspot" style={{ top: '30%', left: '40%', width: '20%', height: '10%' }}></div>
                   <span className="ela-label">Tampered Date Region</span>
                </div>
              </div>
            ) : (
               <div className="fraud-loading">Loading ELA image...</div>
            )}
          </div>
          <p className="gnn-caption">Highlights regions of a receipt image that have been digitally altered or photoshopped.</p>
        </div>
      </div>
    </section>
  );
}
