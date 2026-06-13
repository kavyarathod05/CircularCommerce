import { useState, useEffect } from 'react'
import './App.css'

interface DefectBBox {
  label: string
  x: number
  y: number
  w: number
  h: number
}

interface SimulatedResult {
  orderId: string
  productId: string
  msrp: number
  reason: string
  lat: number
  lng: number
  mediaUrl: string
  pathway: string
  grade: string
  summary: string
  bboxes: DefectBBox[]
}

interface ListingRecord {
  listingId: string
  productId: string
  msrp: number
  owner: string
  grade: string
  escrowStatus: string
  status: 'available' | 'reserved' | 'sold'
}

function App() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'result' | 'admin' | 'prevention'>('wizard')
  
  // Wizard States
  const [orderId, setOrderId] = useState('999-65432-1789')
  const [productId, setProductId] = useState('p-headphones-premium')
  const [msrp, setMsrp] = useState(7900)
  const [reason, setReason] = useState('damaged')
  const [lat, setLat] = useState('12.9716')
  const [lng, setLng] = useState('77.5946')
  const [mediaUrl] = useState('https://secondlife-uploads-331608077815-us-east-1.s3.amazonaws.com/returns/QC-photo-bose.jpg')
  
  // Terminal Simulation Logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'SYSTEM: Ready for Return Ingestion...'
  ])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [lastResult, setLastResult] = useState<SimulatedResult | null>(null)

  // Seller Dashboard Listings State Machine
  const [listings, setListings] = useState<ListingRecord[]>([
    { listingId: 'lst-101', productId: 'Bose QC Headphones', msrp: 25000, owner: 'usr-arjun', grade: 'Grade B', escrowStatus: 'Locked (₹19,000)', status: 'reserved' },
    { listingId: 'lst-102', productId: 'iPhone 14 Pro Max', msrp: 120000, owner: 'usr-naman', grade: 'Grade A', escrowStatus: 'N/A', status: 'available' },
    { listingId: 'lst-103', productId: 'Leather Jacket', msrp: 12500, owner: 'usr-kavya', grade: 'Grade C', escrowStatus: 'Released', status: 'sold' },
    { listingId: 'lst-104', productId: 'Sony Controller', msrp: 5999, owner: 'usr-priya', grade: 'Grade A', escrowStatus: 'Locked (₹4,500)', status: 'reserved' }
  ])

  // Prevention Tab States
  const [cartItems] = useState<{ id: string; name: string; size: string; price: number }[]>([
    { id: 'item-1', name: 'Essentials Cotton Hoodie', size: 'M', price: 2999 },
    { id: 'item-2', name: 'Essentials Cotton Hoodie', size: 'L', price: 2999 } // Ordering two sizes -> sizing anomaly trigger!
  ])
  const [returnVelocity, setReturnVelocity] = useState(4) // >3 returns in 7 days -> velocity alert!
  const [showPreventionAlert, setShowPreventionAlert] = useState(true)

  // Update MSRP automatically on product change
  useEffect(() => {
    if (productId === 'p-headphones-premium') {
      setMsrp(7900)
    } else if (productId === 'p-tshirt-commodity') {
      setMsrp(1500)
    } else if (productId === 'p-smartphone-premium') {
      setMsrp(95000)
    }
  }, [productId])

  const runTriageSimulation = async () => {
    setIsEvaluating(true)
    setConsoleLogs(['SYSTEM: Ingesting return order...'])
    
    // Simulate real-time progress events
    setTimeout(() => {
      setConsoleLogs(prev => [...prev, `SYSTEM: Fetched Order ${orderId}. Evaluated MSRP = ₹${msrp}.`])
      if (msrp >= 5000) {
        setConsoleLogs(prev => [...prev, 'ROUTE: Routing to Premium Track (AI Visual Inspection Gate)'])
      } else {
        setConsoleLogs(prev => [...prev, 'ROUTE: Routing to Commodity Track (Spatial/Locker matching fallback)'])
      }
    }, 1000)

    setTimeout(() => {
      if (msrp >= 5000) {
        setConsoleLogs(prev => [...prev, 'AI: Initialized Amazon Bedrock (Nova Pro) & Rekognition.'])
        setConsoleLogs(prev => [...prev, 'AI: Scanning uploaded image for surface blemishes & pixel tampering...'])
      } else {
        setConsoleLogs(prev => [...prev, 'LOGISTICS: Hashing geolocation coordinates using mmcloughlin/geohash...'])
      }
    }, 2500)

    setTimeout(() => {
      if (msrp >= 5000) {
        let detectedGrade = 'Grade A'
        let feedback = 'Excellent cosmetic condition. No functional defects. Original box present.'
        if (reason === 'damaged') {
          detectedGrade = 'Grade C'
          feedback = 'Cosmetic crack detected on headband (severity 6/10). Wear on cups.'
        } else if (reason === 'fit' || reason === 'defective') {
          detectedGrade = 'Grade B'
          feedback = 'Minor scratch blemish on side casing. Original packaging intact.'
        }
        setConsoleLogs(prev => [...prev, `AI: Image graded successfully: ${detectedGrade}`])
        setConsoleLogs(prev => [...prev, `AI Summary: "${feedback}"`])
      } else {
        setConsoleLogs(prev => [...prev, 'LOGISTICS: Proximity scan complete. Finding nearest Locker node.'])
      }
    }, 4000)

    setTimeout(async () => {
      setConsoleLogs(prev => [...prev, 'SYSTEM: Persistence triggered. Writing to Listings and Return tables.'])
      setConsoleLogs(prev => [...prev, 'SYSTEM: Triage complete. Click the "Triage Result" tab to inspect.'])
      setIsEvaluating(false)

      let pathway = 'hyperlocal-p2p'
      let grade = 'Grade B'
      let summary = 'Minor scratch on side casing. Original packaging intact.'
      let bboxes: DefectBBox[] = []

      if (msrp < 5000) {
        pathway = 'locker-dropoff'
        grade = 'N/A (Commodity)'
        summary = 'Bypassed visual inspection. Direct route to consolidation locker.'
      } else {
        pathway = 'premium'
        if (reason === 'damaged') {
          grade = 'Grade C'
          summary = 'Cosmetic crack on right band cup. Original box present.'
          bboxes = [
            { label: 'crack', x: 190, y: 140, w: 40, h: 20 },
            { label: 'scratch', x: 80, y: 80, w: 20, h: 10 }
          ]
        } else if (reason === 'fit' || reason === 'defective') {
          grade = 'Grade B'
          summary = 'Minor scratch blemish on side cup casing. Fully operational.'
          bboxes = [
            { label: 'scratch', x: 120, y: 110, w: 30, h: 15 }
          ]
        } else {
          grade = 'Grade A'
          summary = 'Excellent condition. Fully certified resale-ready.'
        }
      }

      const res: SimulatedResult = {
        orderId,
        productId,
        msrp,
        reason,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        mediaUrl,
        pathway,
        grade,
        summary,
        bboxes
      }

      setLastResult(res)
      
      // Update Listings table simulation with new listing
      setListings(prev => [
        {
          listingId: `lst-new`,
          productId: res.productId === 'p-headphones-premium' ? 'Bose QC Headphones' : res.productId === 'p-smartphone-premium' ? 'iPhone 14 Pro Max' : 'Essentials T-Shirt',
          msrp: res.msrp,
          owner: 'usr-customer',
          grade: res.grade,
          escrowStatus: res.pathway === 'locker-dropoff' ? 'N/A' : 'Locked (₹' + (res.msrp * 0.75) + ')',
          status: res.pathway === 'locker-dropoff' ? 'available' : 'reserved'
        },
        ...prev
      ])

      // Auto switch view
      setActiveTab('result')
    }, 5500)

    // Call live API in background if reachable
    try {
      await fetch('https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod/return/intercept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          user_id: 'usr-12',
          reason: reason,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          media_url: mediaUrl
        })
      })
    } catch (e) {
      console.log("Live API is currently offline/unreachable in local tests; running fully offline high-fidelity simulator.")
    }
  }

  const toggleListingStatus = (id: string) => {
    setListings(prev => prev.map(list => {
      if (list.listingId === id) {
        let nextStatus: 'available' | 'reserved' | 'sold' = 'available'
        let nextEscrow = list.escrowStatus
        if (list.status === 'available') {
          nextStatus = 'reserved'
          nextEscrow = 'Locked (₹' + (list.msrp * 0.75) + ')'
        } else if (list.status === 'reserved') {
          nextStatus = 'sold'
          nextEscrow = 'Released'
        } else {
          nextStatus = 'available'
          nextEscrow = 'N/A'
        }
        return { ...list, status: nextStatus, escrowStatus: nextEscrow }
      }
      return list
    }))
  }

  return (
    <div className="app-container">
      <header>
        <div className="logo-container">
          <div className="logo-box"></div>
          <h1 className="logo-title">SecondLife<span>Commerce</span></h1>
        </div>
        <div className="nav-tabs">
          <button className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`} onClick={() => setActiveTab('wizard')}>Return Wizard</button>
          <button className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>Triage Result</button>
          <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Seller Dashboard</button>
          <button className={`tab-btn ${activeTab === 'prevention' ? 'active' : ''}`} onClick={() => setActiveTab('prevention')}>Pre-Checkout Prevention</button>
        </div>
      </header>

      <main>
        {/* RETURN WIZARD VIEW */}
        {activeTab === 'wizard' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">01 / Initiate Return Ingestion</div>
                <div className="step-container">
                  <div className="field-group">
                    <label className="field-label">Order ID</label>
                    <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Product Reference ID</label>
                    <select value={productId} onChange={e => setProductId(e.target.value)}>
                      <option value="p-headphones-premium">Bose QuietComfort Headphones (Premium, MSRP &ge; 5000)</option>
                      <option value="p-tshirt-commodity">Essentials Cotton T-Shirt (Commodity, MSRP &lt; 5000)</option>
                      <option value="p-smartphone-premium">iPhone 14 Pro Max (Premium, MSRP &ge; 5000)</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Estimated Value (INR)</label>
                    <input type="number" value={msrp} readOnly />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Reason for Return</label>
                    <select value={reason} onChange={e => setReason(e.target.value)}>
                      <option value="fit">Too big / wrong fit</option>
                      <option value="damaged">Damaged during shipping (scratches/cracks)</option>
                      <option value="defective">Defective / does not work properly</option>
                      <option value="changed-mind">Changed mind / wrong style</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Your Proximity Coordinates</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="Lat" />
                      <input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="Lng" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Media Upload (Visual Proof of Condition)</label>
                    <input type="text" value={mediaUrl} readOnly />
                  </div>
                  <button className="btn-action" onClick={runTriageSimulation} disabled={isEvaluating}>
                    {isEvaluating ? 'Running Evaluation...' : 'Submit & Run Triage'}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">02 / Live AI Evaluation Log</div>
                <div className="inspection-terminal">
                  {consoleLogs.map((log, index) => {
                    let logClass = ''
                    if (log.includes('Complete') || log.includes('success') || log.includes('✓')) {
                      logClass = 'success'
                    } else if (log.includes('Routing') || log.includes('Analyzing') || log.includes('Scanning')) {
                      logClass = 'working'
                    }
                    return (
                      <div key={index} className={`console-line ${logClass}`}>
                        {log}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRIAGE RESULT VIEW */}
        {activeTab === 'result' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">03 / AI Inspection Report Card</div>
                {lastResult ? (
                  <>
                    <div className="health-card">
                      <div className="health-card-header">
                        <span>PRODUCT HEALTH CARD | #INS-{lastResult.orderId.substring(0, 4)}</span>
                        <span className={`grade-badge ${
                          lastResult.grade.includes('B') ? 'b-grade' :
                          lastResult.grade.includes('C') ? 'c-grade' :
                          lastResult.grade.includes('D') ? 'd-grade' : ''
                        }`}>{lastResult.grade}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Product ID</span>
                        <span>{lastResult.productId}</span>
                      </div>
                      <div className="health-card-row">
                        <span>MSRP Value</span>
                        <span>₹{lastResult.msrp}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Triage Pathway</span>
                        <span style={{ color: 'var(--amazon-orange)', textTransform: 'uppercase' }}>{lastResult.pathway}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Inspection Summary</span>
                        <span style={{ color: 'white', fontSize: '0.8rem' }}>{lastResult.summary}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Fraud & Liveness Check</span>
                        <span style={{ color: 'var(--success-green)' }}>✓ PASSED</span>
                      </div>
                      <div className="health-card-footer">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          KMS Signed SHA-256 Hash:<br />
                          <span style={{ color: 'var(--amazon-orange)', fontSize: '0.6rem' }}>8f3b2a1c9e99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1</span>
                        </div>
                        <div className="qr-placeholder">
                          <svg width="50" height="50" viewBox="0 0 100 100">
                            <rect x="0" y="0" width="100" height="100" fill="white" />
                            <rect x="10" y="10" width="30" height="30" fill="black" />
                            <rect x="60" y="10" width="30" height="30" fill="black" />
                            <rect x="10" y="60" width="30" height="30" fill="black" />
                            <rect x="20" y="20" width="10" height="10" fill="white" />
                            <rect x="70" y="20" width="10" height="10" fill="white" />
                            <rect x="20" y="70" width="10" height="10" fill="white" />
                            <rect x="45" y="45" width="20" height="20" fill="black" />
                            <rect x="75" y="75" width="15" height="15" fill="black" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="carbon-card">
                      <div className="carbon-badge-circle">
                        {lastResult.pathway === 'locker-dropoff' ? 14 : 52}
                      </div>
                      <div className="carbon-details">
                        <h4>Scope-3 Carbon Avoided</h4>
                        <p>Calculated equivalent of avoiding warehouse shipping. Saved {lastResult.pathway === 'locker-dropoff' ? 14 : 52.5} Kg CO₂ ({(lastResult.pathway === 'locker-dropoff' ? 14 / 21 : 52.5 / 21).toFixed(2)} trees planted equivalent).</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-muted)' }}>No return Triaged yet. Go to Return Wizard and submit.</p>
                )}
              </div>

              <div className="panel">
                <div className="panel-title">04 / Blemish Heatmap & Spatial Map</div>
                {lastResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Blemish Image Overlays */}
                    {lastResult.bboxes.length > 0 && (
                      <div className="image-heatmap-container">
                        <svg className="heatmap-svg" viewBox="0 0 320 320">
                          {/* Headphones Outline representation */}
                          <circle cx="160" cy="160" r="100" stroke="#30363d" strokeWidth="6" fill="none" />
                          <rect x="50" y="120" width="20" height="80" rx="10" fill="#ff9900" />
                          <rect x="250" y="120" width="20" height="80" rx="10" fill="#ff9900" />
                          {/* Bounding box rendering */}
                          {lastResult.bboxes.map((box, idx) => (
                            <rect
                              key={idx}
                              className="defect-bbox"
                              x={box.x}
                              y={box.y}
                              width={box.w}
                              height={box.h}
                              data-title={box.label}
                            />
                          ))}
                        </svg>
                        <div className="defect-bbox-label" style={{ top: '10%', left: '10%' }}>AI Visual Detections Active</div>
                      </div>
                    )}

                    {/* Proximity Route Map */}
                    <div className="logistics-map">
                      <div className="map-grid-overlay"></div>
                      <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
                        {lastResult.pathway === 'locker-dropoff' ? (
                          <path className="route-path" d="M 96,150 Q 148,115 208,135" />
                        ) : (
                          <path className="route-path" d="M 96,150 Q 160,180 240,180" />
                        )}
                      </svg>
                      <div className="node-marker origin" style={{ top: '50%', left: '30%' }} title="Your Location"></div>
                      {lastResult.pathway === 'locker-dropoff' ? (
                        <div className="node-marker locker" style={{ top: '45%', left: '65%' }} title="Amazon Locker"></div>
                      ) : (
                        <div className="node-marker destination" style={{ top: '60%', left: '75%' }} title="Matched Buyer"></div>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--mono-font)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {lastResult.pathway === 'locker-dropoff' ? (
                        <span><b>Routing:</b> Locker Dropoff (Amazon Locker - Metro Hub, 1.4 km). Fallback triggered.</span>
                      ) : (
                        <span><b>Routing:</b> Hyperlocal P2P Match (Matched to buyer-alpha, 3.2 km). Escrow Locked.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-muted)' }}>Submit a return from the wizard to generate routing path.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SELLER DASHBOARD VIEW */}
        {activeTab === 'admin' && (
          <section className="view-section">
            <div className="telemetry-grid">
              <div className="telemetry-metric">
                <div className="metric-label">Warehouse Avoidance Rate</div>
                <div className="metric-value">68.4%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>+12.4% vs Last Month</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Scope-3 Carbon Avoided</div>
                <div className="metric-value">847.2 Kg</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>40.3 Trees Planted Equiv.</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Capital Recovery Value</div>
                <div className="metric-value">₹4.28M</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>82.6% Recovery Rate</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Escrow Locked Funds</div>
                <div className="metric-value">₹145,200</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--safety-yellow)' }}>14 Open P2P Swaps</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Active SecondLife Listings & Escrow States</div>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Listing ID</th>
                    <th>Product</th>
                    <th>MSRP Value</th>
                    <th>Current Owner</th>
                    <th>AI Grade</th>
                    <th>Escrow status</th>
                    <th>Listing status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(list => (
                    <tr key={list.listingId}>
                      <td>{list.listingId}</td>
                      <td>{list.productId}</td>
                      <td>₹{list.msrp}</td>
                      <td>{list.owner}</td>
                      <td>
                        <span style={{
                          color: list.grade.includes('A') ? 'var(--success-green)' :
                                 list.grade.includes('B') ? 'var(--safety-yellow)' : 'var(--amazon-orange)'
                        }}>{list.grade}</span>
                      </td>
                      <td>{list.escrowStatus}</td>
                      <td>
                        <span className={`status-pill ${list.status}`}>{list.status}</span>
                      </td>
                      <td>
                        <button className="btn-action" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: 'auto' }} onClick={() => toggleListingStatus(list.listingId)}>
                          Transition State
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PRE-CHECKOUT PREVENTION VIEW */}
        {activeTab === 'prevention' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">05 / Shopper Cart (Simulated Checkout)</div>
                <div className="step-container">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="cart-scenario-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono-font)' }}>
                        <span><b>{item.name}</b></span>
                        <span style={{ color: 'var(--amazon-orange)' }}>₹{item.price}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Selected Size: {item.size}
                      </div>
                    </div>
                  ))}
                  <div className="field-group">
                    <label className="field-label">User Historical Returns (Past 7 Days)</label>
                    <input type="number" value={returnVelocity} onChange={e => setReturnVelocity(parseInt(e.target.value))} />
                  </div>
                  <button className="btn-action" onClick={() => setShowPreventionAlert(true)}>
                    Refresh Checkout Risk Check
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">06 / Pre-Checkout Anomaly Intercept (Pillar 04)</div>
                {showPreventionAlert && (
                  <div className="prevention-alert">
                    <div className="prevention-alert-header">
                      <span>⚠️ High-Risk Return Anomaly Intercepted</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--mono-font)', lineHeight: '1.4' }}>
                      {cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1) && (
                        <p style={{ marginBottom: '0.5rem', color: 'var(--safety-yellow)' }}>
                          <b>[Sizing Anomaly]:</b> You have added multiple sizes (M and L) of the same garment. Sizing metrics indicate the "Essentials Cotton Hoodie" runs true-to-size. Recommend selecting one size to prevent unnecessary return transport legs.
                        </p>
                      )}
                      {returnVelocity > 3 && (
                        <p style={{ color: 'var(--error-red)' }}>
                          <b>[Velocity Limit Warn]:</b> Customer return velocity is high ({returnVelocity} returns in 7 days). Restricted Green Credit policy will apply to returns in this session.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
