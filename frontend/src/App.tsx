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
  carbon_saved_co2_kg?: number
  matched_buyer?: any
  transit_distance_km?: number
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
  const [listings, setListings] = useState<ListingRecord[]>([])
  const [sellerMetrics, setSellerMetrics] = useState<any>(null)
  const [userMetrics, setUserMetrics] = useState<any>(null)
  const [dppData, setDppData] = useState<any>(null)
  const [catalogItems, setCatalogItems] = useState<ListingRecord[]>([])

  useEffect(() => {
    const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
    if (activeTab === 'catalog') {
      fetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => setCatalogItems(Array.isArray(data) ? data : []))
        .catch(err => console.error("Catalog fetch failed", err))
    } else if (activeTab === 'admin') {
      fetch(`${mlApiUrl}/seller/metrics?seller_id=usr-12`)
        .then(res => res.json())
        .then(data => setSellerMetrics(data))
        .catch(err => console.error("Seller metrics fetch failed", err))
      // Mock fetching listings from Go API for the seller
      fetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => setListings(Array.isArray(data) ? data : []))
        .catch(err => console.error("Listings fetch failed", err))
    } else if (activeTab === 'account') {
      fetch(`${mlApiUrl}/user/metrics?user_id=usr-12`)
        .then(res => res.json())
        .then(data => setUserMetrics(data))
        .catch(err => console.error("User metrics fetch failed", err))
      // Mock fetching a specific DPP record from Go API
      fetch(`${mlApiUrl}/dpp?listing_id=lst-123`)
        .then(res => res.json())
        .then(data => setDppData(data))
        .catch(err => console.error("DPP fetch failed", err))
    }
  }, [activeTab])

  // Prevention Tab States
  const [cartItems, setCartItems] = useState<{ id: string; name: string; size: string; price: number }[]>([
    { id: 'item-1', name: 'Essentials Cotton Hoodie', size: 'M', price: 2999 },
    { id: 'item-2', name: 'Essentials Cotton Hoodie', size: 'L', price: 2999 } // Ordering two sizes -> sizing anomaly trigger!
  ])
  const [returnVelocity, setReturnVelocity] = useState(4) // >3 returns in 7 days -> velocity alert!
  const [showPreventionAlert, setShowPreventionAlert] = useState(true)
  const [frictionScore, setFrictionScore] = useState<any>(null)

  const evaluateFriction = async (currentCart: any[] = cartItems) => {
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${mlApiUrl}/api/v1/ml/friction/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'usr-12',
          product_id: currentCart.length > 0 ? currentCart[0].id : 'p-hoodie',
          session_data: { cart_size: currentCart.length, return_velocity: returnVelocity }
        })
      })
      const data = await resp.json()
      setFrictionScore(data.data)
      setShowPreventionAlert(true)
    } catch (e) {
      console.error(e)
    }
  }

  const addToCart = (item: any) => {
    const newCart = [...cartItems, { id: item.listingId || item.productId, name: item.productId, size: 'M', price: item.msrp }]
    setCartItems(newCart)
    evaluateFriction(newCart)
    setActiveTab('prevention')
  }

  const removeFromCart = (index: number) => {
    const newCart = [...cartItems]
    newCart.splice(index, 1)
    setCartItems(newCart)
    evaluateFriction(newCart)
  }

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

    // Call live API in background if reachable
    let liveInterceptData: any = null
    try {
      const awsBaseUrl = import.meta.env.VITE_AWS_API_URL || 'https://7fwutbh0wh.execute-api.us-east-1.amazonaws.com/Prod'
      const interceptResp = await fetch(`${awsBaseUrl}/return/intercept`, {
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
      if (interceptResp.ok) {
        liveInterceptData = await interceptResp.json()
      }
    } catch (e) {
      console.log("Live API is currently offline/unreachable in local tests; running fully offline high-fidelity simulator.")
    }

    setTimeout(async () => {
      setConsoleLogs(prev => [...prev, 'System: Return records updated successfully.'])
      setConsoleLogs(prev => [...prev, 'Status: Return approved. Please check the Return Status tab for details.'])
      setIsEvaluating(false)

      let pathway = liveInterceptData ? liveInterceptData.pathway : 'hyperlocal-p2p'
      let grade = 'Grade B'
      let summary = 'Minor scratch on side casing. Original packaging intact.'
      let bboxes: DefectBBox[] = []

      if (liveInterceptData && liveInterceptData.inspection_grade) {
        grade = liveInterceptData.inspection_grade
        summary = liveInterceptData.ai_summary
      } else if (msrp < 5000) {
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
        bboxes,
        carbon_saved_co2_kg: liveInterceptData?.carbon_saved_co2_kg,
        matched_buyer: liveInterceptData?.matched_buyer,
        transit_distance_km: liveInterceptData?.transit_distance_km
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
  }

  const toggleListingStatus = async (id: string) => {
    const list = listings.find(l => l.listingId === id)
    if (!list) return
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

    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      await fetch(`${mlApiUrl}/listing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, new_status: nextStatus, buyer_id: 'usr-buyer-demo' })
      })
    } catch (e) {
      console.error("Failed to transition listing state", e)
    }

    setListings(prev => prev.map(l => {
      if (l.listingId === id) {
        return { ...l, status: nextStatus, escrowStatus: nextEscrow }
      }
      return l
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
              {catalogItems.length === 0 ? (
                <p>Loading catalog or no items available...</p>
              ) : (
                catalogItems.map((item, idx) => (
                  <div key={idx} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E7E7E7' }}>
                    <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={
                        item.productId.includes('iPhone') || item.productId.includes('smartphone') ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500' :
                        item.productId.includes('Jacket') ? 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' :
                        item.productId.includes('Hoodie') || item.productId.includes('Shirt') ? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500' :
                        item.productId.includes('Jeans') ? 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' :
                        item.productId.includes('Controller') ? 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500' :
                        item.productId.includes('iPad') ? 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500' :
                        item.productId.includes('Keyboard') ? 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500' :
                        item.productId.includes('Echo') ? 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500' :
                        item.productId.includes('Bottle') ? 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500' :
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
                      } alt={item.productId} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '0.5rem 0' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '500', color: '#0F1111', margin: '0 0 0.25rem 0' }}>{item.productId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.4rem', color: '#B12704', fontWeight: 'bold' }}>₹{Math.floor(item.msrp * 0.9)}</span>
                        <span style={{ fontSize: '0.85rem', color: '#565959', textDecoration: 'line-through' }}>₹{item.msrp}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#B12704', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Flash Deal (High Local Availability)
                      </div>
                      { (item.productId.includes('Jacket') || item.productId.includes('Hoodie') || item.productId.includes('Shirt') || item.productId.includes('Jeans') || item.productId.includes('T-Shirt')) && (
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#007185' }}>
                          ✓ <b>Recommended Size: M</b>
                        </div>
                      )}
                      <p style={{ color: '#565959', fontSize: '0.85rem', flexGrow: 1 }}>Ships from {item.owner}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn-action" style={{ padding: '0.5rem', fontSize: '0.9rem', borderRadius: '100px', backgroundColor: '#FFD814', border: '1px solid #FCD200' }} onClick={() => addToCart(item)}>Add to Cart</button>
                      </div>
                    </div>
                  </div>
                ))
              )}

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
            <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '2rem' }}>
              <div className="step-container">
                <div className="panel" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontFamily: 'var(--headline-font)', fontWeight: '700' }}>Your Account Balance</h2>
                    <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>Prime Member</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--error-red)' }}>₹1,240.50</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Available to use on your next purchase</div>
                </div>

                <div className="panel">
                  <div className="panel-title">Your Orders & Returns</div>
                  <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--amazon-orange)', marginBottom: '0.75rem', fontFamily: 'var(--headline-font)' }}>Bose QuietComfort Headphones</h4>
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {dppData?.listing_id || '9f8a-4b2c'}</span>
                  </div>
                  {dppData && dppData.dpp_history ? (
                    dppData.dpp_history.map((block: any, idx: number) => (
                      <p key={idx} style={{ margin: '0.5rem 0' }}>{block.action}: {new Date(block.timestamp).toLocaleDateString()} by {block.owner}</p>
                    ))
                  ) : (
                    <>
                      <p style={{ margin: '0.5rem 0' }}>Origin: Factory A, Vietnam</p>
                      <p style={{ margin: '0.5rem 0' }}>Purchased: Oct 12, 2026</p>
                      <p style={{ margin: '0.5rem 0' }}>Transferred: Oct 15, 2026</p>
                    </>
                  )}
                  <button className="btn-action" style={{ backgroundColor: '#F3F3F3', color: 'var(--text-primary)', border: '1px solid var(--border-color)', marginTop: '1rem' }}>View Digital Receipt</button>
                </div>

                <div className="panel" style={{ backgroundColor: '#E8F5E9', border: '1px solid #C8E6C9' }}>
                  <div className="panel-title" style={{ color: '#2E7D32' }}>Climate Pledge Impact</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span style={{ color: '#1B5E20' }}>CO2 Avoided by Local Return:</span>
                    <strong style={{ color: 'var(--success-green)' }}>{userMetrics?.co2_saved_kg ? userMetrics.co2_saved_kg.toFixed(1) : 18.4} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                    <span style={{ color: '#1B5E20' }}>Tree Equivalent:</span>
                    <strong style={{ color: 'var(--success-green)' }}>{userMetrics?.trees_planted ? userMetrics.trees_planted.toFixed(2) : 0.87} trees</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RETURN WIZARD VIEW */}
        {userRole === 'buyer' && activeTab === 'wizard' && (
          <section className="view-section">
            <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '2rem' }}>
              <div className="panel" style={{ padding: '2rem' }}>
                <div className="panel-title">Start a Return</div>
                <div className="step-container">
                  <div className="field-group">
                    <label className="field-label">Select Item from Order History</label>
                    <select value={productId} onChange={e => {
                      setProductId(e.target.value);
                      if (e.target.value.includes('headphones')) setMediaUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500');
                      if (e.target.value.includes('smartphone')) setMediaUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500');
                      if (e.target.value.includes('tshirt')) setMediaUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500');
                    }}>
                      <option value="p-headphones-premium">Bose QuietComfort Headphones</option>
                      <option value="p-tshirt-commodity">Essentials Cotton T-Shirt</option>
                      <option value="p-smartphone-premium">iPhone 14 Pro Max</option>
                    </select>
                  </div>
                  
                  <div className="field-group">
                    <label className="field-label">Why are you returning this?</label>
                    <select value={reason} onChange={e => setReason(e.target.value)}>
                      <option value="fit">Too big / wrong fit</option>
                      <option value="damaged">Damaged during shipping (scratches/cracks)</option>
                      <option value="defective">Defective / does not work properly</option>
                      <option value="changed-mind">Changed mind / wrong style</option>
                    </select>
                  </div>

                  <details style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem' }}>
                    <summary>🛠️ Hackathon Demo Controls</summary>
                    <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', marginTop: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="field-group">
                        <label className="field-label">Simulate Order ID</label>
                        <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} />
                      </div>
                      <div className="field-group">
                        <label className="field-label">Simulate GPS Proximity (Lat/Lng)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="Lat" />
                          <input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="Lng" />
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="field-group">
                    <label className="field-label">Upload a photo of the item (Required)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '1px dashed var(--amazon-orange)', padding: '0.5rem', width: '100%' }} />
                    {mediaUrl && (
                      <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA', overflow: 'hidden', borderRadius: '8px' }}>
                        <img src={mediaUrl} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <button className="btn-action" onClick={runTriageSimulation} disabled={isEvaluating} style={{ marginTop: '1rem' }}>
                    {isEvaluating ? 'Processing Return...' : 'Submit Return Request'}
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Return Status Tracker</div>
                <div style={{ padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'var(--body-font)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {consoleLogs.map((log, index) => {
                    let logClass = ''
                    let icon = '🔄'
                    if (log.includes('Complete') || log.includes('success') || log.includes('✓') || log.includes('APPROVED')) {
                      logClass = 'success'
                      icon = '✅'
                    } else if (log.includes('Failed') || log.includes('REJECTED')) {
                      logClass = 'error'
                      icon = '❌'
                    } else if (log.includes('Analyzing') || log.includes('Scanning')) {
                      icon = '🔍'
                    } else if (log.includes('Routing') || log.includes('Escrow')) {
                      icon = '🚚'
                    }

                    // Clean up the log text to make it customer friendly
                    let cleanLog = log.replace('SYSTEM: ', '').replace('LOGISTICS: ', '').replace('ML ENGINE: ', '');
                    
                    return (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: logClass === 'success' ? 'var(--success-green)' : logClass === 'error' ? 'var(--error-red)' : 'var(--text-primary)' }}>
                        <span>{icon}</span>
                        <span style={{ fontWeight: logClass ? 'bold' : 'normal' }}>{cleanLog}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '2rem' }}>
              <div className="panel" style={{ padding: '2rem' }}>
                <div className="panel-title">Your Refund Summary</div>
                {lastResult ? (
                  <>
                    <div className="health-card" style={{ backgroundColor: '#F8F9FA', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem' }}>
                      <div className="health-card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold' }}>RETURN AUTHORIZED | #RET-{lastResult.orderId.substring(0, 4)}</span>
                        <span className={`grade-badge ${
                          lastResult.grade.includes('B') ? 'b-grade' :
                          lastResult.grade.includes('C') ? 'c-grade' :
                          lastResult.grade.includes('D') ? 'd-grade' : ''
                        }`} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem' }}>Condition: {lastResult.grade}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Item Name</span>
                        <span style={{ fontWeight: '500' }}>{
                          lastResult.productId.includes('smartphone') ? 'iPhone 14 Pro Max' :
                          lastResult.productId.includes('headphones') ? 'Bose QuietComfort Headphones' :
                          lastResult.productId.includes('tshirt') ? 'Essentials Cotton T-Shirt' : lastResult.productId
                        }</span>
                      </div>
                      <div className="health-card-row">
                        <span>Refund Amount</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success-green)' }}>₹{lastResult.msrp}</span>
                      </div>
                      <div className="health-card-row">
                        <span>Next Steps</span>
                        <span style={{ color: 'var(--amazon-orange)', fontWeight: 'bold' }}>
                          {lastResult.pathway === 'premium' ? 'Instant Refund Approved' : lastResult.pathway === 'local-match' ? 'Drop off at Local Buyer' : 'Return to Warehouse'}
                        </span>
                      </div>
                      <div className="health-card-row">
                        <span>Inspection Notes</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontStyle: 'italic', maxWidth: '60%', textAlign: 'right' }}>{lastResult.summary}</span>
                      </div>
                      <div className="health-card-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Authorization Code:<br />
                          <span style={{ color: 'var(--amazon-orange)', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px' }}>AUTH-8F3B</span>
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
                        {lastResult.carbon_saved_co2_kg ? Math.round(lastResult.carbon_saved_co2_kg) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52)}
                      </div>
                      <div className="carbon-details">
                        <h4>Scope-3 Carbon Avoided</h4>
                        <p>Calculated equivalent of avoiding warehouse shipping. Saved {lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg.toFixed(2) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52.5)} Kg CO₂ ({(lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg / 21 : (lastResult.pathway === 'locker-dropoff' ? 14 / 21 : 52.5 / 21)).toFixed(2)} trees planted equivalent).</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontFamily: 'var(--body-font)', color: 'var(--text-muted)' }}>No return Triaged yet. Go to Return Wizard and submit.</p>
                )}
              </div>

              <div className="panel">
                <div className="panel-title">Visual Condition Verification</div>
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
                    <div style={{ fontFamily: 'var(--body-font)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {lastResult.pathway === 'locker-dropoff' ? (
                        <span><b>Routing:</b> Locker Dropoff (Amazon Locker - Metro Hub, {lastResult.transit_distance_km ? lastResult.transit_distance_km.toFixed(1) : '1.4'} km).</span>
                      ) : (
                        <span><b>Routing:</b> Hyperlocal P2P Match (Matched to {lastResult.matched_buyer?.listing_id ? 'Buyer-Local' : 'buyer-alpha'}, {lastResult.transit_distance_km ? lastResult.transit_distance_km.toFixed(1) : '3.2'} km). Escrow Locked.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--body-font)', color: 'var(--text-muted)' }}>Submit a return from the wizard to generate routing path.</p>
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
                <div className="metric-value">{sellerMetrics?.warehouse_avoidance_rate || 68.4}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>+12.4% vs Last Month</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Scope-3 Carbon Avoided</div>
                <div className="metric-value">{sellerMetrics?.co2_saved_kg ? sellerMetrics.co2_saved_kg.toFixed(1) : 847.2} Kg</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>{sellerMetrics?.trees_planted ? sellerMetrics.trees_planted.toFixed(1) : 40.3} Trees Planted Equiv.</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Capital Recovery Value</div>
                <div className="metric-value">₹{sellerMetrics?.capital_recovery_value ? sellerMetrics.capital_recovery_value.toLocaleString() : '4.28M'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>82.6% Recovery Rate</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Fraudulent Returns Blocked</div>
                <div className="metric-value">14</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>GNN Fraud Engine Active ✓</div>
              </div>
              <div className="telemetry-metric">
                <div className="metric-label">Escrow Locked Funds</div>
                <div className="metric-value">₹{sellerMetrics?.escrow_locked_funds ? sellerMetrics.escrow_locked_funds.toLocaleString() : '145,200'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--safety-yellow)' }}>Live from MatchesTable</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '2rem' }}>
              <div className="panel" style={{ padding: '2rem' }}>
                <div className="panel-title">Your Shopping Cart</div>
                <div className="step-container">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="cart-scenario-card" style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--body-font)' }}>
                        <span><b>{item.name}</b></span>
                        <span style={{ color: 'var(--amazon-orange)' }}>₹{item.price}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Selected Size: {item.size}
                        </div>
                        <button style={{ background: 'none', border: 'none', color: '#FF4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => removeFromCart(idx)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <details style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <summary>🛠️ Hackathon Demo Controls</summary>
                    <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', marginTop: '0.5rem', borderRadius: '4px' }}>
                      <div className="field-group">
                        <label className="field-label">Simulate Historical Returns (Past 7 Days)</label>
                        <input type="number" value={returnVelocity} onChange={e => { setReturnVelocity(parseInt(e.target.value)); evaluateFriction(); }} style={{ padding: '0.4rem', width: '60px' }} />
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="panel" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                <div className="panel-title">Smart Fit Check</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Find your perfect fit and help us reduce return emissions! 🌍
                </p>

                {showPreventionAlert && frictionScore && (
                  <div className={`prevention-alert ${frictionScore.intercept ? 'high-risk' : 'low-risk'}`} style={{
                    backgroundColor: frictionScore.intercept ? '#FFF4F4' : '#F0FFF4',
                    border: `1px solid ${frictionScore.intercept ? '#FFDCE0' : '#C6F6D5'}`,
                    padding: '1.5rem', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{frictionScore.intercept ? '⚠️' : '✅'}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: frictionScore.intercept ? 'var(--error-red)' : 'var(--success-green)' }}>
                        {frictionScore.intercept ? 'Fit Uncertainty Detected' : 'Perfect Match!'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {frictionScore.intercept ? (
                        <>
                          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                            Ordering multiple sizes increases carbon footprint. Unsure about the fit?
                          </p>
                          <button className="btn-action" onClick={() => setActiveTab('vto')} style={{ width: '100%' }}>
                            Try It On Virtually 👗
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ color: 'var(--text-muted)' }}>
                            High fit confidence based on your profile: <b>{((1 - frictionScore.returnProbability) * 100).toFixed(0)}%</b>
                          </p>
                          <button className="btn-action" style={{ marginTop: '1rem', width: '100%', backgroundColor: 'var(--success-green)' }}>
                            Proceed to Checkout
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {showPreventionAlert && frictionScore && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📊</span> Smart Fit Insights
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ minWidth: '120px', backgroundColor: '#F8F9FA', padding: '0.75rem', borderRadius: '6px', borderLeft: `4px solid ${frictionScore.intercept ? '#FF4444' : 'var(--success-green)'}` }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fit Confidence</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: frictionScore.intercept ? '#FF4444' : 'var(--success-green)' }}>
                          {((1 - frictionScore.returnProbability) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        {cartItems.filter(i => i.name === 'Essentials Cotton Hoodie').length > 1 ? (
                          <span><b>Heads up:</b> You have multiple sizes of the same item in your cart. Ordering just one perfect size helps reduce carbon emissions from returns!</span>
                        ) : (
                          <span><b>Looks good:</b> Your sizing profile closely matches these items based on historical purchase data.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {showPreventionAlert && !frictionScore && (
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
