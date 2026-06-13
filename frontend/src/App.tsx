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
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null)
  const [activeTab, setActiveTab] = useState<'catalog' | 'vto' | 'wizard' | 'result' | 'account' | 'admin' | 'prevention'>('catalog')
  
  // Wizard States
  const [orderId, setOrderId] = useState('999-65432-1789')
  const [productId, setProductId] = useState('p-headphones-premium')
  const [msrp, setMsrp] = useState(7900)
  const [reason, setReason] = useState('damaged')
  const [lat, setLat] = useState('12.9716')
  const [lng, setLng] = useState('77.5946')
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [, setUploading] = useState(false)
  
  // Terminal Simulation Logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Ready to process your return.'
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setMediaUrl(URL.createObjectURL(file))
      setConsoleLogs(prev => [...prev, `SYSTEM: Selected file ${file.name} for upload.`])
    }
  }

  const uploadFileToS3 = async (file: File): Promise<string> => {
    setUploading(true)
    setConsoleLogs(prev => [...prev, `LOGISTICS: Fetching S3 pre-signed upload URL for ${file.name}...`])
    try {
      const awsBaseUrl = import.meta.env.VITE_AWS_API_URL || 'https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod'
      const resp = await fetch(`${awsBaseUrl}/return/media-url?filename=${encodeURIComponent(file.name)}`)
      if (!resp.ok) throw new Error("API pre-sign failed")
      const data = await resp.json()

      setConsoleLogs(prev => [...prev, `LOGISTICS: Performing direct binary PUT upload to S3...`])
      const s3Resp = await fetch(data.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
      if (!s3Resp.ok) throw new Error("S3 put failed")

      setConsoleLogs(prev => [...prev, `LOGISTICS: Direct S3 Upload Complete! ✓`])
      setUploading(false)
      return data.media_url
    } catch (err) {
      console.error(err)
      setConsoleLogs(prev => [...prev, `LOGISTICS: S3 upload failed/unreachable. Falling back to local URL.`])
      setUploading(false)
      return URL.createObjectURL(file)
    }
  }

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

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const runTriageSimulation = async () => {
    setIsEvaluating(true)
    setConsoleLogs(['System: Initiating return request...'])
    
    let finalMediaUrl = mediaUrl
    if (selectedFile) {
      finalMediaUrl = await uploadFileToS3(selectedFile)
    }

    // Call local ML server for live defect assessment!
    let liveGrade = 'Grade B'
    let liveSummary = 'Minor scratch on side casing. Original packaging intact.'
    let liveBboxes: DefectBBox[] = []
    let isLiveMLAvailable = false

    try {
      let imageBase64 = 'dGVzdA==' // default fallback dummy
      if (selectedFile) {
        imageBase64 = await getBase64(selectedFile)
      }
      
      const mlBaseUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      const mlResp = await fetch(`${mlBaseUrl}/api/v1/ml/aws/inspect-condition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_bytes_list: [imageBase64]
        })
      })
      
      if (mlResp.ok) {
        const mlData = await mlResp.json()
        if (mlData.status === 'success' && mlData.data) {
          const data = mlData.data
          liveGrade = data.grade ? `Grade ${data.grade}` : 'Grade B'
          liveSummary = data.summary || data.gradeReasoning || 'Assessed successfully.'
          isLiveMLAvailable = true
          
          if (data.damages && Array.isArray(data.damages)) {
            liveBboxes = data.damages.map((d: any) => {
              const bbox = d.boundingBox || { xmin: 0.4, ymin: 0.2, xmax: 0.55, ymax: 0.45 }
              return {
                label: d.type || 'defect',
                x: bbox.xmin * 320,
                y: bbox.ymin * 320,
                w: (bbox.xmax - bbox.xmin) * 320,
                h: (bbox.ymax - bbox.ymin) * 320
              }
            })
          }
        }
      }
    } catch (err) {
      console.log("Local ML Server not running or failed. Falling back to local UI simulator.", err)
    }
    
    // Simulate real-time progress events
    setTimeout(() => {
      setConsoleLogs(prev => [...prev, `Order Verified: Order #${orderId} located. Original value = ₹${msrp}.`])
      if (msrp >= 5000) {
        setConsoleLogs(prev => [...prev, 'Return Track: Premium item policy applied. Inspection required.'])
      } else {
        setConsoleLogs(prev => [...prev, 'Return Track: Standard policy applied. Dropoff recommended.'])
      }
    }, 1000)

    setTimeout(() => {
      if (msrp >= 5000) {
        setConsoleLogs(prev => [...prev, 'Inspection: Initializing condition verification...'])
        setConsoleLogs(prev => [...prev, 'Inspection: Scanning image for condition accuracy...'])
      } else {
        setConsoleLogs(prev => [...prev, 'Logistics: Locating nearest drop-off locations...'])
      }
    }, 2500)

    setTimeout(() => {
      if (msrp >= 5000) {
        if (isLiveMLAvailable) {
          setConsoleLogs(prev => [...prev, `Inspection: Verification successful. Condition: ${liveGrade}`])
          setConsoleLogs(prev => [...prev, `Note: "${liveSummary}"`])
        } else {
          let detectedGrade = 'Grade A'
          let feedback = 'Excellent cosmetic condition. No functional defects. Original box present.'
          if (reason === 'damaged') {
            detectedGrade = 'Grade C'
            feedback = 'Cosmetic crack detected on headband. Wear on cups.'
          } else if (reason === 'fit' || reason === 'defective') {
            detectedGrade = 'Grade B'
            feedback = 'Minor blemish on side casing. Original packaging intact.'
          }
          setConsoleLogs(prev => [...prev, `Inspection: Verification successful. Condition: ${detectedGrade}`])
          setConsoleLogs(prev => [...prev, `Note: "${feedback}"`])
        }
      } else {
        setConsoleLogs(prev => [...prev, 'Logistics: Proximity scan complete. Nearest Amazon Locker located.'])
      }
    }, 4000)

    setTimeout(async () => {
      setConsoleLogs(prev => [...prev, 'System: Return records updated successfully.'])
      setConsoleLogs(prev => [...prev, 'Status: Return approved. Please check the Return Status tab for details.'])
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
        if (isLiveMLAvailable) {
          grade = liveGrade
          summary = liveSummary
          bboxes = liveBboxes
        } else {
          if (productId === 'p-smartphone-premium') {
            if (reason === 'damaged') {
              grade = 'Grade C'
              summary = 'Cosmetic screen fracture on lower-right quadrant. Multi-touch functional.'
              bboxes = [
                { label: 'screen fracture', x: 140, y: 180, w: 50, h: 40 },
                { label: 'bezel dent', x: 92, y: 220, w: 10, h: 10 }
              ]
            } else if (reason === 'fit' || reason === 'defective') {
              grade = 'Grade B'
              summary = 'Minor scratch blemish on side aluminum bezel. Display panel pristine.'
              bboxes = [
                { label: 'scratch', x: 92, y: 120, w: 8, h: 30 }
              ]
            } else {
              grade = 'Grade A'
              summary = 'Excellent visual condition. Fully certified and reset to factory settings.'
            }
          } else {
            // Headphones or default
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
        }
      }

      const res: SimulatedResult = {
        orderId,
        productId,
        msrp,
        reason,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        mediaUrl: finalMediaUrl,
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
      const awsBaseUrl = import.meta.env.VITE_AWS_API_URL || 'https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod'
      await fetch(`${awsBaseUrl}/return/intercept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          user_id: 'usr-12',
          reason: reason,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          media_url: finalMediaUrl
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
          {userRole === 'buyer' && (
            <>
              <button className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Browse Catalog</button>
              <button className={`tab-btn ${activeTab === 'vto' ? 'active' : ''}`} onClick={() => setActiveTab('vto')}>Virtual Try-On</button>
              <button className={`tab-btn ${activeTab === 'prevention' ? 'active' : ''}`} onClick={() => setActiveTab('prevention')}>Your Cart</button>
              <button className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`} onClick={() => setActiveTab('wizard')}>Start a Return</button>
              <button className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>Return Status</button>
              <button className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>Your Account</button>
            </>
          )}
          {userRole === 'seller' && (
            <>
              <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>Seller Central</button>
              <button className={`tab-btn ${activeTab === 'result' ? 'active' : ''}`} onClick={() => setActiveTab('result')}>Processing Logs</button>
            </>
          )}
          {userRole && (
            <button className="tab-btn" style={{ marginLeft: 'auto', borderLeft: '1px solid var(--border-color)' }} onClick={() => setUserRole(null)}>
              Switch Role
            </button>
          )}
        </div>
      </header>

      <main>
        {/* ROLE SELECTION SCREEN */}
        {!userRole && (
          <section className="view-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--brutalist-font)', fontSize: '2rem' }}>Welcome to SecondLife Commerce</h2>
            <p style={{ color: 'var(--text-muted)' }}>Please select your persona to continue.</p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <button 
                className="btn-action" 
                style={{ padding: '2rem', fontSize: '1.25rem', width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: '#FFFFFF', border: '2px solid var(--amazon-orange)', color: 'var(--text-primary)' }}
                onClick={() => { setUserRole('buyer'); setActiveTab('catalog'); }}
              >
                <span style={{ fontSize: '3rem' }}>🛍️</span>
                I am a Buyer
              </button>
              <button 
                className="btn-action" 
                style={{ padding: '2rem', fontSize: '1.25rem', width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', backgroundColor: '#131A22', border: '2px solid #131A22', color: '#FFFFFF' }}
                onClick={() => { setUserRole('seller'); setActiveTab('admin'); }}
              >
                <span style={{ fontSize: '3rem' }}>📦</span>
                I am a Seller
              </button>
            </div>
          </section>
        )}

        {/* CATALOG VIEW */}
        {userRole === 'buyer' && activeTab === 'catalog' && (
          <section className="view-section">
            <h2 style={{ fontFamily: 'var(--brutalist-font)', marginBottom: '1.5rem', fontSize: '1.8rem' }}>Recommended For You</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              
              {/* Product 1: Bose */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500" alt="Bose Headphones" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Bose QuietComfort Headphones</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', color: 'var(--amazon-orange)', fontWeight: 'bold' }}>₹7,900</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success-green)' }}>In Stock</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', flexGrow: 1 }}>Premium noise-cancelling headphones for immersive audio.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-action" style={{ padding: '0.6rem', fontSize: '0.9rem' }} onClick={() => setActiveTab('prevention')}>Add to Cart</button>
                    <button className="btn-action" style={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem', fontSize: '0.9rem' }} onClick={() => setActiveTab('vto')}>Try Before You Buy</button>
                  </div>
                </div>
              </div>

              {/* Product 2: iPhone */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500" alt="iPhone 14" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>iPhone 14 Pro Max</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', color: 'var(--amazon-orange)', fontWeight: 'bold' }}>₹95,000</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--safety-yellow)' }}>Only 2 Left</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', flexGrow: 1 }}>Pro camera system and Dynamic Island. Unlocked for all carriers.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-action" style={{ padding: '0.6rem', fontSize: '0.9rem' }} onClick={() => setActiveTab('prevention')}>Add to Cart</button>
                    <button className="btn-action" style={{ backgroundColor: '#F3F3F3', border: '1px solid #ddd', color: '#999', padding: '0.6rem', fontSize: '0.9rem', cursor: 'not-allowed' }} disabled>VTO Not Available</button>
                  </div>
                </div>
              </div>

              {/* Product 3: Essentials Hoodie */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500" alt="Essentials Hoodie" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>Essentials Cotton Hoodie</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', color: 'var(--amazon-orange)', fontWeight: 'bold' }}>₹2,999</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success-green)' }}>In Stock</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', flexGrow: 1 }}>Everyday comfort meets premium cotton blend. Machine washable.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn-action" style={{ padding: '0.6rem', fontSize: '0.9rem' }} onClick={() => setActiveTab('prevention')}>Add to Cart</button>
                    <button className="btn-action" style={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem', fontSize: '0.9rem' }} onClick={() => setActiveTab('vto')}>Try Before You Buy</button>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* VTO VIEW */}
        {userRole === 'buyer' && activeTab === 'vto' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">Virtual Try-On Preview</div>
                <div className="image-heatmap-container" style={{ height: '400px', backgroundColor: '#F3F3F3', borderRadius: '8px', overflow: 'hidden' }}>
                  {mediaUrl ? (
                     <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <img src={mediaUrl} alt="VTO Source" style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.8 }} />
                       <div style={{ position: 'absolute', top: '40%', left: '35%', border: '2px dashed var(--amazon-orange)', width: '30%', height: '30%', backgroundColor: 'rgba(255, 153, 0, 0.2)' }}></div>
                       <div style={{ position: 'absolute', bottom: '10%', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>Generating Preview...</div>
                     </div>
                  ) : (
                     <span style={{ color: 'var(--text-muted)' }}>Upload a photo to see a preview</span>
                  )}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">Your Style Match</div>
                <div className="step-container">
                  <div className="field-group">
                    <label className="field-label">Upload a photo of yourself</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '1px dashed var(--amazon-orange)', padding: '0.5rem' }} />
                  </div>
                  <div className="health-card" style={{ marginTop: '1rem' }}>
                    <div className="health-card-row">
                      <span>Item</span>
                      <span>Bose QuietComfort</span>
                    </div>
                    <div className="health-card-row">
                      <span>Style Match</span>
                      <span style={{ color: 'var(--success-green)' }}>Excellent</span>
                    </div>
                    <div className="health-card-row">
                      <span>Recommendation</span>
                      <span style={{ color: 'var(--success-green)' }}>Highly Recommended</span>
                    </div>
                  </div>
                  <button className="btn-action" onClick={() => setActiveTab('prevention')} style={{ marginTop: '1rem' }}>Confirm & Add to Cart</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACCOUNT VIEW */}
        {userRole === 'buyer' && activeTab === 'account' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="step-container">
                <div className="panel" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontFamily: 'var(--brutalist-font)' }}>Your Account Balance</h2>
                    <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>Prime Member</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--error-red)' }}>₹1,240.50</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Available to use on your next purchase</div>
                </div>

                <div className="panel">
                  <div className="panel-title">Your Orders & Returns</div>
                  <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '0.75rem', fontFamily: 'var(--brutalist-font)' }}>Bose QuietComfort Headphones</h4>
                    <p style={{ margin: '0.25rem 0', color: 'var(--text-primary)' }}>✓ Return Initiated: Today, 10:42 AM</p>
                    <p style={{ margin: '0.25rem 0', color: 'var(--text-primary)' }}>✓ Item Received - Refund Processed</p>
                    <div style={{ margin: '0.75rem 0', padding: '0.75rem', backgroundColor: '#FFF8F0', border: '1px solid var(--amazon-orange)', borderRadius: '4px' }}>
                      <strong>Local Match Found - Transferring to Escrow</strong>
                    </div>
                    <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}>Awaiting local handoff completion</p>
                  </div>
                </div>
              </div>

              <div className="step-container">
                <div className="panel">
                  <div className="panel-title">Product Verification</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong>Authenticity Trail</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: 9f8a-4b2c</span>
                  </div>
                  <p style={{ margin: '0.5rem 0' }}>Origin: Factory A, Vietnam</p>
                  <p style={{ margin: '0.5rem 0' }}>Purchased: Oct 12, 2026</p>
                  <p style={{ margin: '0.5rem 0' }}>Transferred: Oct 15, 2026</p>
                  <button className="btn-action" style={{ backgroundColor: '#F3F3F3', color: 'var(--text-primary)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>View Digital Receipt</button>
                </div>

                <div className="panel" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                  <div className="panel-title" style={{ color: '#2E7D32' }}>Climate Pledge Impact</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span style={{ color: '#1B5E20' }}>CO2 Avoided by Local Return:</span>
                    <strong style={{ color: 'var(--success-green)' }}>18.4 kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span style={{ color: '#1B5E20' }}>Tree Equivalent:</span>
                    <strong style={{ color: 'var(--success-green)' }}>0.87 trees</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RETURN WIZARD VIEW */}
        {userRole === 'buyer' && activeTab === 'wizard' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">Start a Return</div>
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
                    <label className="field-label">Or Select A Pre-built Demo Photo</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <button type="button" className="tab-btn" style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} onClick={() => {
                        setProductId('p-headphones-premium');
                        setMediaUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500');
                        setConsoleLogs(prev => [...prev, "SYSTEM: Selected pre-built Bose Headphones photo"]);
                        setSelectedFile(null);
                      }}>Bose Headphones</button>
                      <button type="button" className="tab-btn" style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} onClick={() => {
                        setProductId('p-smartphone-premium');
                        setMediaUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500');
                        setConsoleLogs(prev => [...prev, "SYSTEM: Selected pre-built iPhone photo"]);
                        setSelectedFile(null);
                      }}>iPhone 14</button>
                      <button type="button" className="tab-btn" style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} onClick={() => {
                        setProductId('p-tshirt-commodity');
                        setMediaUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500');
                        setConsoleLogs(prev => [...prev, "SYSTEM: Selected pre-built Essentials T-shirt photo"]);
                        setSelectedFile(null);
                      }}>Essentials T-Shirt</button>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Media Upload (Visual Proof of Condition)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '1px dashed var(--amazon-orange)', padding: '0.5rem' }} />
                    {mediaUrl && (
                      <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--dark-bg)', overflow: 'hidden' }}>
                        <img src={mediaUrl} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <button className="btn-action" onClick={runTriageSimulation} disabled={isEvaluating}>
                    {isEvaluating ? 'Running Evaluation...' : 'Submit & Run Triage'}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Return Processing Timeline</div>
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
        {userRole && activeTab === 'result' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">Return Approval Details</div>
                {lastResult ? (
                  <>
                    <div className="health-card">
                      <div className="health-card-header">
                        <span>RETURN STATUS | #RET-{lastResult.orderId.substring(0, 4)}</span>
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
                        <span>Account Standing</span>
                        <span style={{ color: 'var(--success-green)' }}>✓ Excellent</span>
                      </div>
                      <div className="health-card-footer">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Return Authorization ID:<br />
                          <span style={{ color: 'var(--amazon-orange)', fontSize: '0.6rem' }}>AUTH-8f3b2a1c9e99a8b7</span>
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
                <div className="panel-title">Condition Proof & Routing Options</div>
                {lastResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Blemish Image Overlays */}
                    {lastResult.bboxes.length > 0 && (
                      <div className="image-heatmap-container">
                        <svg className="heatmap-svg" viewBox="0 0 320 320">
                          {/* Dynamic Outline representation */}
                          {lastResult.productId === 'p-smartphone-premium' ? (
                            <>
                              <rect x="95" y="40" width="130" height="240" rx="18" stroke="#30363d" strokeWidth="6" fill="none" />
                              <rect x="130" y="52" width="60" height="12" rx="6" fill="#30363d" />
                            </>
                          ) : lastResult.productId === 'p-tshirt-commodity' ? (
                            <>
                              <path d="M 140,70 Q 160,82 180,70 L 210,70 L 250,110 L 225,135 L 205,125 L 205,260 L 115,260 L 115,125 L 95,135 L 70,110 L 110,70 Z" stroke="#30363d" strokeWidth="6" fill="none" />
                            </>
                          ) : (
                            <>
                              <circle cx="160" cy="160" r="100" stroke="#30363d" strokeWidth="6" fill="none" />
                              <rect x="50" y="120" width="20" height="80" rx="10" fill="#ff9900" />
                              <rect x="250" y="120" width="20" height="80" rx="10" fill="#ff9900" />
                            </>
                          )}
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
                        <div className="defect-bbox-label" style={{ top: '10%', left: '10%' }}>Noted Condition Flaws</div>
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
        {userRole === 'seller' && activeTab === 'admin' && (
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
                    <th>Item Condition</th>
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
        {userRole === 'buyer' && activeTab === 'prevention' && (
          <section className="view-section">
            <div className="grid-split">
              <div className="panel">
                <div className="panel-title">Your Shopping Cart</div>
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
                <div className="panel-title">Size & Fit Recommendations</div>
                {showPreventionAlert && (
                  <div className="prevention-alert">
                    <div className="prevention-alert-header">
                      <span>Information for your order</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--mono-font)', lineHeight: '1.4' }}>
                      {cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1) && (
                        <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                          <b>Fit Note:</b> You have added multiple sizes (M and L) of the same garment. Sizing metrics indicate the "Essentials Cotton Hoodie" runs true-to-size. We recommend selecting your usual size.
                        </p>
                      )}
                      {returnVelocity > 3 && (
                        <p style={{ color: 'var(--text-primary)' }}>
                          <b>Account Note:</b> We noticed a higher than usual return rate on your account. Please double-check sizing guides to ensure a perfect fit before ordering.
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
