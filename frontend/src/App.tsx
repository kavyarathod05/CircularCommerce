import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  status: 'available' | 'reserved' | 'sold' | 'disputed' | 'removed'
  currentPrice?: number
  discountApplied?: number
  isFlashDeal?: boolean
  recommendedSize?: string
  certificateUrl?: string
  image?: string
}

function App() {
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = (location.pathname.replace('/', '') || 'catalog') as any
  const setActiveTab = (tab: string) => navigate('/' + tab)
  
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

  // AI Seller Features State
  const [sellerSubTab, setSellerSubTab] = useState<'inventory' | 'studio'>('inventory')
  const [newListingOrderId, setNewListingOrderId] = useState('')
  const [newListingAiState, setNewListingAiState] = useState<'idle' | 'assessing' | 'done'>('idle')
  const [newListingDescription, setNewListingDescription] = useState('')
  const [newListingPrice, setNewListingPrice] = useState<number | null>(null)
  
  const handleAiAutoList = async () => {
    if (!newListingOrderId) return
    setNewListingAiState('assessing')
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${mlApiUrl}/seller/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: newListingOrderId })
      })
      const result = await resp.json()
      if (result.status === 'success') {
        setNewListingPrice(result.data.suggested_price)
        setNewListingDescription(result.data.description)
        setNewListingAiState('done')
      }
    } catch (e) {
      console.error(e)
      setNewListingAiState('idle')
    }
  }

  const publishNewListing = async () => {
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${mlApiUrl}/listing/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'p-headphones-premium',
          msrp: 14999,
          grade: 'Grade A',
          price: newListingPrice || 12000,
          description: newListingDescription,
          orderId: newListingOrderId
        })
      })
      const result = await resp.json()
      if (result.status === 'success') {
        const catResp = await fetch(`${mlApiUrl}/catalog`)
        const data = await catResp.json()
        setListings(Array.isArray(data) ? data : [])
        
        setNewListingOrderId('')
        setNewListingAiState('idle')
        setNewListingDescription('')
        setNewListingPrice(null)
        setSellerSubTab('inventory')
      }
    } catch (e) {
      console.error(e)
    }
  }

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
      
      fetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => setListings(Array.isArray(data) ? data : []))
        .catch(err => console.error("Listings fetch failed", err))
    } else if (activeTab === 'account') {
      fetch(`${mlApiUrl}/user/metrics?user_id=usr-12`)
        .then(res => res.json())
        .then(data => setUserMetrics(data))
        .catch(err => console.error("User metrics fetch failed", err))
      
      fetch(`${mlApiUrl}/dpp?listing_id=lst-123`)
        .then(res => res.json())
        .then(data => setDppData(data))
        .catch(err => console.error("DPP fetch failed", err))
    }
  }, [activeTab])

  // Prevention Tab States
  const [cartItems, setCartItems] = useState<{ id: string; name: string; size: string; price: number }[]>([
    { id: 'item-1', name: 'Essentials Cotton Hoodie', size: 'M', price: 2999 },
    { id: 'item-2', name: 'Essentials Cotton Hoodie', size: 'L', price: 2999 } 
  ])
  const [returnVelocity, setReturnVelocity] = useState(4) 
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
    setConsoleLogs(['Initiating your return request...'])
    
    let finalMediaUrl = mediaUrl
    if (selectedFile) {
      finalMediaUrl = await uploadFileToS3(selectedFile)
    }

    let liveGrade = 'Grade B'
    let liveSummary = 'Assessed successfully.'
    let liveBboxes: DefectBBox[] = []

    try {
      let imageBase64 = 'dGVzdA==' 
      if (selectedFile) {
        imageBase64 = await getBase64(selectedFile)
      }
      
      const mlBaseUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      setConsoleLogs(prev => [...prev, `✓ Order found! Verifying purchase value (₹${msrp}).`])
      setConsoleLogs(prev => [...prev, '✓ Uploading your photos for rapid visual review...'])
      setConsoleLogs(prev => [...prev, '✨ AI Assistant is scanning the product condition...'])
      
      let endpoint = selectedFile?.type.includes('video') ? '/api/v1/ml/inspect-video' : '/api/v1/ml/aws/inspect-condition'
      let reqBody = selectedFile?.type.includes('video') ? { video_base64: imageBase64 } : { image_bytes_list: [imageBase64] }
      
      const mlResp = await fetch(`${mlBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      })
      
      if (mlResp.ok) {
        const mlData = await mlResp.json()
        if (mlData.status === 'success' && mlData.data) {
          const data = mlData.data
          liveGrade = data.grade && data.grade.includes('Grade') ? data.grade : `Grade ${data.grade || 'B'}`
          liveSummary = data.summary || data.gradeReasoning || 'Assessed successfully.'
          
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
      
      setConsoleLogs(prev => [...prev, `✓ Condition successfully assessed as ${liveGrade}.`])
      
      // Call Triage API
      setConsoleLogs(prev => [...prev, '✨ Finding the fastest and greenest return route...'])
      const triageResp = await fetch(`${mlBaseUrl}/api/v1/ml/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           msrp: msrp,
           grade: liveGrade,
           reason: reason,
           product_id: productId
        })
      })
      
      let pathway = 'hyperlocal-p2p'
      if (triageResp.ok) {
         const triageData = await triageResp.json()
         if (triageData.status === 'success') {
             pathway = triageData.data.pathway
             setConsoleLogs(prev => [...prev, `✓ Optimal route found: ${pathway.replace('-', ' ')}!`])
         }
      }

      setConsoleLogs(prev => [...prev, '✓ Return approved! Generating your summary...'])
      setIsEvaluating(false)

      const res: SimulatedResult = {
        orderId,
        productId,
        msrp,
        reason,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        mediaUrl: finalMediaUrl,
        pathway,
        grade: liveGrade,
        summary: liveSummary,
        bboxes: liveBboxes
      }

      setLastResult(res)
      
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

      setActiveTab('result')
      
    } catch (err) {
      console.error("ML Server failed", err)
      setIsEvaluating(false)
      setConsoleLogs(prev => [...prev, 'Error: Could not reach backend triage server.'])
    }
  }

  const toggleListingStatus = async (id: string, action: string = 'advance') => {
    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      const resp = await fetch(`${mlApiUrl}/listing/${id}/transition?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await resp.json()
      
      if (data.status === 'success') {
        setListings(prev => prev.map(l => {
          if (l.listingId === id) {
            return { ...l, status: data.new_status, escrowStatus: data.new_escrow }
          }
          return l
        }))
      } else {
        console.error("API Transition Failed:", data.message)
      }
    } catch (e) {
      console.error("Failed to transition listing state", e)
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F8FA', fontFamily: 'var(--body-font, system-ui, sans-serif)' }}>
      {/* SIDEBAR NAVIGATION - Fixed Design Issues */}
      {userRole && (
        <div className="sidebar" style={{ 
          width: '280px', 
          minWidth: '280px', 
          backgroundColor: '#FFFFFF', 
          borderRight: '1px solid #E7E7E7', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          position: 'sticky', 
          top: 0, 
          padding: '1.5rem', 
          boxSizing: 'border-box' 
        }}>
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div className="logo-box" style={{ padding: '0.5rem', backgroundColor: '#F3F4F6', borderRadius: '8px', display: 'flex' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#131A22" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h1 className="logo-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: '800', color: '#131A22' }}>
              SecondLife<br /><span style={{ color: 'var(--amazon-orange, #FF9900)' }}>Commerce</span>
            </h1>
          </div>

          <div className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1, overflowY: 'auto' }}>
            {userRole === 'buyer' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Shopping</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'catalog' ? '#FFF5E5' : 'transparent', color: activeTab === 'catalog' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'catalog' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('catalog')}>Browse Catalog</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'vto' ? '#FFF5E5' : 'transparent', color: activeTab === 'vto' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'vto' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('vto')}>Virtual Try-On</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'prevention' ? '#FFF5E5' : 'transparent', color: activeTab === 'prevention' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'prevention' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('prevention')}>Your Cart</button>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Returns</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'wizard' ? '#FFF5E5' : 'transparent', color: activeTab === 'wizard' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'wizard' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('wizard')}>Start a Return</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'result' ? '#FFF5E5' : 'transparent', color: activeTab === 'result' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'result' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('result')}>Return Status</button>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Settings</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'account' ? '#FFF5E5' : 'transparent', color: activeTab === 'account' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'account' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('account')}>Your Account</button>
              </>
            )}
            {userRole === 'seller' && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Dashboard</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'admin' ? '#FFF5E5' : 'transparent', color: activeTab === 'admin' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'admin' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('admin')}>Seller Central</button>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'result' ? '#FFF5E5' : 'transparent', color: activeTab === 'result' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'result' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('result')}>Processing Logs</button>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#879596', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1rem', marginBottom: '0.25rem' }}>Security</div>
                <button style={{ textAlign: 'left', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'fraud' ? '#FFF5E5' : 'transparent', color: activeTab === 'fraud' ? 'var(--amazon-orange, #FF9900)' : '#131A22', fontWeight: activeTab === 'fraud' ? 'bold' : 'normal', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('fraud')}>Fraud Investigations</button>
              </>
            )}
          </div>
          
          <div className="user-profile-btn" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#F8F9FA', cursor: 'pointer', border: '1px solid #EAEAEA' }} onClick={() => setUserRole(null)}>
            <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#131A22', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {userRole === 'buyer' ? 'B' : 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#131A22' }}>{userRole === 'buyer' ? 'Buyer Persona' : 'Seller Persona'}</span>
              <span style={{ fontSize: '0.75rem', color: '#879596' }}>Switch Role</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main style={{ flexGrow: 1, padding: '2rem 3rem', boxSizing: 'border-box', maxWidth: userRole ? 'calc(100vw - 280px)' : '100vw', overflowY: 'auto' }}>
        
        {/* ROLE SELECTION SCREEN */}
        {!userRole && (
          <section className="view-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--brutalist-font, sans-serif)', fontSize: '2.5rem', fontWeight: '800', color: '#131A22', textAlign: 'center' }}>Welcome to SecondLife Commerce</h2>
            <p style={{ color: '#565959', fontSize: '1.1rem' }}>Please select your persona to continue.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              <button 
                className="btn-action" 
                style={{ padding: '2.5rem', borderRadius: '12px', fontSize: '1.25rem', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', backgroundColor: '#FFFFFF', border: '2px solid var(--amazon-orange, #FF9900)', color: '#131A22', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                onClick={() => { setUserRole('buyer'); setActiveTab('catalog'); }}
              >
                <span style={{ fontSize: '4rem' }}>🛍️</span>
                <span style={{ fontWeight: 'bold' }}>I am a Buyer</span>
              </button>
              <button 
                className="btn-action" 
                style={{ padding: '2.5rem', borderRadius: '12px', fontSize: '1.25rem', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', backgroundColor: '#131A22', border: '2px solid #131A22', color: '#FFFFFF', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                onClick={() => { setUserRole('seller'); setActiveTab('admin'); }}
              >
                <span style={{ fontSize: '4rem' }}>📦</span>
                <span style={{ fontWeight: 'bold' }}>I am a Seller</span>
              </button>
            </div>
          </section>
        )}

        {/* CATALOG VIEW */}
        {userRole === 'buyer' && activeTab === 'catalog' && (
          <section className="view-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--brutalist-font, sans-serif)', marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Recommended For You</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {catalogItems.length === 0 ? (
                <p style={{ color: '#879596' }}>Loading catalog or no items available...</p>
              ) : (
                catalogItems.map((item, idx) => (
                  <div key={idx} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#FFF', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                    <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', overflow: 'hidden' }}>
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0F1111', margin: '0 0 0.5rem 0' }}>{item.productId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.4rem', color: '#B12704', fontWeight: 'bold' }}>₹{Math.floor(item.currentPrice || item.msrp * 0.9)}</span>
                        <span style={{ fontSize: '0.85rem', color: '#565959', textDecoration: 'line-through' }}>₹{item.msrp}</span>
                        {item.discountApplied && (
                          <span style={{ fontSize: '0.75rem', color: '#B12704', fontWeight: 'bold', marginLeft: '0.5rem' }}>({item.discountApplied} OFF)</span>
                        )}
                      </div>
                      
                      {item.isFlashDeal && (
                        <div style={{ fontSize: '0.75rem', color: '#B12704', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          ⚡ Flash Deal (High Local Demand)
                        </div>
                      )}
                      
                      {item.recommendedSize && (
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#007185', backgroundColor: '#F0FBFC', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                          ✓ <b>AI Recommended Size: {item.recommendedSize}</b>
                        </div>
                      )}
                      
                      {item.certificateUrl && (
                        <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#007185', textDecoration: 'none', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          View GS1 Authenticity Certificate
                        </a>
                      )}
                      
                      <p style={{ color: '#565959', fontSize: '0.85rem', flexGrow: 1, margin: '0.5rem 0' }}>Ships from {item.owner}</p>
                      <button className="btn-action" style={{ padding: '0.75rem', fontSize: '0.95rem', borderRadius: '100px', backgroundColor: '#FFD814', border: '1px solid #FCD200', color: '#0F1111', cursor: 'pointer', fontWeight: '500', marginTop: 'auto' }} onClick={() => addToCart(item)}>Add to Cart</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* VTO VIEW */}
        {userRole === 'buyer' && activeTab === 'vto' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Virtual Try-On Experience</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>Preview Generator</h3>
                <div className="image-heatmap-container" style={{ height: '400px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', overflow: 'hidden' }}>
                  {mediaUrl ? (
                     <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                       <img src={mediaUrl} alt="VTO Source" style={{ maxWidth: '100%', maxHeight: '100%', opacity: 0.8 }} />
                       <div style={{ position: 'absolute', top: '40%', left: '35%', border: '2px dashed var(--amazon-orange, #FF9900)', width: '30%', height: '30%', backgroundColor: 'rgba(255, 153, 0, 0.2)' }}></div>
                       <div style={{ position: 'absolute', bottom: '10%', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem' }}>Generating Preview...</div>
                     </div>
                  ) : (
                     <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#879596' }}>Upload a photo to see a preview</span>
                     </div>
                  )}
                </div>
              </div>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22' }}>Your Style Match</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#131A22' }}>Upload a photo of yourself</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '2px dashed var(--amazon-orange, #FF9900)', padding: '1.5rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#FFFDF9' }} />
                  </div>
                  <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '1rem', border: '1px solid #EAEAEA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EAEAEA' }}>
                      <span style={{ color: '#565959' }}>Item</span>
                      <span style={{ fontWeight: '600' }}>Bose QuietComfort</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #EAEAEA' }}>
                      <span style={{ color: '#565959' }}>Style Match</span>
                      <span style={{ color: 'var(--success-green, #008A00)', fontWeight: 'bold' }}>Excellent</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ color: '#565959' }}>Recommendation</span>
                      <span style={{ color: 'var(--success-green, #008A00)', fontWeight: 'bold' }}>Highly Recommended</span>
                    </div>
                  </div>
                  <button className="btn-action" onClick={() => setActiveTab('prevention')} style={{ padding: '1rem', backgroundColor: 'var(--amazon-orange, #FF9900)', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Confirm & Add to Cart</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ACCOUNT VIEW */}
        {userRole === 'buyer' && activeTab === 'account' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#131A22' }}>Your Account Balance</h2>
                    <span style={{ backgroundColor: '#E6F4EA', color: '#137333', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Prime Member</span>
                  </div>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: '#131A22' }}>₹1,240.50</div>
                  <div style={{ color: '#565959', fontSize: '0.95rem', marginTop: '0.5rem' }}>Available to use on your next purchase</div>
                </div>

                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Product Verification & Traceability</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.05rem' }}>Authenticity Trail</strong>
                    <span style={{ color: '#879596', fontSize: '0.85rem', backgroundColor: '#F8F9FA', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>ID: {dppData?.listing_id || '9f8a-4b2c'}</span>
                  </div>
                  <div style={{ backgroundColor: '#F8F9FA', borderRadius: '8px', padding: '1rem', border: '1px solid #EAEAEA' }}>
                    {dppData && dppData.dpp_history ? (
                      dppData.dpp_history.map((block: any, idx: number) => (
                        <p key={idx} style={{ margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#565959' }}>{block.action}</span>
                          <strong>{new Date(block.timestamp).toLocaleDateString()} ({block.owner})</strong>
                        </p>
                      ))
                    ) : (
                      <>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Origin</span> <strong>Factory A, Vietnam</strong></p>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Purchased</span> <strong>Oct 12, 2026</strong></p>
                        <p style={{ margin: '0.75rem 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#565959' }}>Transferred</span> <strong>Oct 15, 2026</strong></p>
                      </>
                    )}
                  </div>
                  <button className="btn-action" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#131A22', border: '1px solid #D5D9D9', marginTop: '1.5rem', cursor: 'pointer', fontWeight: '500' }}>View Digital Receipt</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#131A22' }}>Your Orders & Returns</h3>
                  <div style={{ padding: '1.25rem', border: '1px solid #EAEAEA', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    <h4 style={{ color: 'var(--amazon-orange, #FF9900)', margin: '0 0 0.75rem 0', fontSize: '1rem' }}>Bose QuietComfort Headphones</h4>
                    <p style={{ margin: '0.5rem 0', color: '#131A22', fontSize: '0.9rem' }}>✓ Return Initiated: Today, 10:42 AM</p>
                    <p style={{ margin: '0.5rem 0', color: '#131A22', fontSize: '0.9rem' }}>✓ Item Received - Refund Processed</p>
                    <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: '#FFF8F0', borderLeft: '4px solid var(--amazon-orange, #FF9900)', borderRadius: '0 4px 4px 0' }}>
                      <strong style={{ fontSize: '0.9rem' }}>Local Match Found - Transferring to Escrow</strong>
                    </div>
                    <p style={{ margin: 0, color: '#879596', fontSize: '0.85rem' }}>Awaiting local handoff completion</p>
                  </div>
                </div>

                <div className="panel" style={{ backgroundColor: '#E6F4EA', borderRadius: '12px', padding: '1.5rem', border: '1px solid #CEEAD6' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#137333' }}>Climate Pledge Impact</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'center' }}>
                    <span style={{ color: '#0D652D', fontSize: '0.9rem' }}>CO2 Avoided by Local Return:</span>
                    <strong style={{ color: '#137333', fontSize: '1.1rem' }}>{userMetrics?.co2_saved_kg ? userMetrics.co2_saved_kg.toFixed(1) : 18.4} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'center' }}>
                    <span style={{ color: '#0D652D', fontSize: '0.9rem' }}>Tree Equivalent:</span>
                    <strong style={{ color: '#137333', fontSize: '1.1rem' }}>{userMetrics?.trees_planted ? userMetrics.trees_planted.toFixed(2) : 0.87} trees</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RETURN WIZARD VIEW */}
        {userRole === 'buyer' && activeTab === 'wizard' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Return Center</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Start a Return</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Select Item from Order History</label>
                    <select 
                      value={productId} 
                      onChange={e => {
                        setProductId(e.target.value);
                        if (e.target.value.includes('headphones')) setMediaUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500');
                        if (e.target.value.includes('smartphone')) setMediaUrl('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500');
                        if (e.target.value.includes('tshirt')) setMediaUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500');
                      }}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '1rem', backgroundColor: '#F8F9FA' }}
                    >
                      <option value="p-headphones-premium">Bose QuietComfort Headphones</option>
                      <option value="p-tshirt-commodity">Essentials Cotton T-Shirt</option>
                      <option value="p-smartphone-premium">iPhone 14 Pro Max</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Why are you returning this?</label>
                    <select 
                      value={reason} 
                      onChange={e => setReason(e.target.value)}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '1rem', backgroundColor: '#F8F9FA' }}
                    >
                      <option value="fit">Too big / wrong fit</option>
                      <option value="damaged">Damaged during shipping (scratches/cracks)</option>
                      <option value="defective">Defective / does not work properly</option>
                      <option value="changed-mind">Changed mind / wrong style</option>
                    </select>
                  </div>

                  <details style={{ fontSize: '0.85rem', color: '#565959', cursor: 'pointer', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <summary style={{ fontWeight: 'bold' }}>🛠️ Hackathon Demo Controls (Optional)</summary>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Simulate Order ID</label>
                        <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label>Simulate GPS Proximity (Lat/Lng)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="text" value={lat} onChange={e => setLat(e.target.value)} placeholder="Lat" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                          <input type="text" value={lng} onChange={e => setLng(e.target.value)} placeholder="Lng" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #D5D9D9' }} />
                        </div>
                      </div>
                    </div>
                  </details>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#131A22' }}>Upload a photo of the item (Required)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ border: '2px dashed var(--amazon-orange, #FF9900)', padding: '1.5rem', borderRadius: '8px', width: '100%', boxSizing: 'border-box', backgroundColor: '#FFFDF9', cursor: 'pointer' }} />
                    {mediaUrl && (
                      <div style={{ marginTop: '0.5rem', border: '1px solid #EAEAEA', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={mediaUrl} alt="Preview" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={runTriageSimulation} 
                    disabled={isEvaluating} 
                    style={{ marginTop: '1rem', padding: '1rem', backgroundColor: isEvaluating ? '#D5D9D9' : 'var(--amazon-orange, #FF9900)', color: isEvaluating ? '#565959' : '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: isEvaluating ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                  >
                    {isEvaluating ? 'Processing Return...' : 'Submit Return Request'}
                  </button>
                </div>
              </div>

              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Return Progress</h3>
                <div style={{ padding: '1.25rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '400px', overflowY: 'auto' }}>
                  {consoleLogs.map((log, index) => {
                    let logClass = '#565959'
                    let icon = '⏳'
                    if (log.includes('✓')) {
                      icon = '✅'
                      logClass = '#131A22'
                    } else if (log.includes('Error') || log.includes('Failed')) {
                      icon = '❌'
                      logClass = '#C5221F'
                    } else if (log.includes('✨') || log.includes('AI')) {
                      icon = '✨'
                      logClass = '#131A22'
                    }
                    
                    let cleanLog = log.replace('✨ ', '').replace('✓ ', '');
                    
                    return (
                      <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: logClass, lineHeight: 1.4, fontWeight: log.includes('✓') || log.includes('✨') ? '600' : 'normal', borderBottom: '1px solid #EAEAEA', paddingBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <span>{cleanLog}</span>
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
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Return Processing Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Your Refund Summary</h3>
                {lastResult ? (
                  <>
                    <div style={{ backgroundColor: '#F8F9FA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '1.5rem' }}>
                      <div style={{ borderBottom: '1px solid #EAEAEA', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', color: '#131A22' }}>RETURN AUTHORIZED | #RET-{lastResult.orderId.substring(0, 4)}</span>
                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: lastResult.grade.includes('A') ? '#E6F4EA' : lastResult.grade.includes('B') ? '#FFF8E1' : '#FCE8E6', color: lastResult.grade.includes('A') ? '#137333' : lastResult.grade.includes('B') ? '#B08D00' : '#C5221F' }}>
                          Condition: {lastResult.grade}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Item Name</span>
                        <span style={{ fontWeight: '600' }}>{
                          lastResult.productId.includes('smartphone') ? 'iPhone 14 Pro Max' :
                          lastResult.productId.includes('headphones') ? 'Bose QuietComfort Headphones' :
                          lastResult.productId.includes('tshirt') ? 'Essentials Cotton T-Shirt' : lastResult.productId
                        }</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Refund Amount</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--success-green, #008A00)', fontSize: '1.1rem' }}>₹{lastResult.msrp}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0' }}>
                        <span style={{ color: '#565959' }}>Next Steps</span>
                        <span style={{ color: 'var(--amazon-orange, #FF9900)', fontWeight: 'bold' }}>
                          {lastResult.pathway === 'premium' ? 'Instant Refund Approved' : lastResult.pathway === 'local-match' ? 'Drop off at Local Buyer' : 'Return to Warehouse'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0', alignItems: 'flex-start' }}>
                        <span style={{ color: '#565959' }}>Inspection Notes</span>
                        <span style={{ color: '#131A22', fontSize: '0.9rem', fontStyle: 'italic', maxWidth: '60%', textAlign: 'right', backgroundColor: '#FFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid #EAEAEA' }}>"{lastResult.summary}"</span>
                      </div>
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #EAEAEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: '#565959' }}>
                          Authorization Code:<br />
                          <span style={{ color: 'var(--amazon-orange, #FF9900)', fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px' }}>AUTH-8F3B</span>
                        </div>
                        <div style={{ width: '60px', height: '60px', backgroundColor: '#FFF', padding: '5px', border: '1px solid #EAEAEA', borderRadius: '4px' }}>
                          <svg width="100%" height="100%" viewBox="0 0 100 100">
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '2rem', padding: '1.5rem', backgroundColor: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#007185', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', flexShrink: 0 }}>
                        {lastResult.carbon_saved_co2_kg ? Math.round(lastResult.carbon_saved_co2_kg) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52)}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#007185', fontSize: '1.05rem' }}>Scope-3 Carbon Avoided</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#131A22', lineHeight: 1.5 }}>Calculated equivalent of avoiding warehouse shipping. Saved {lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg.toFixed(2) : (lastResult.pathway === 'locker-dropoff' ? 14 : 52.5)} Kg CO₂ ({(lastResult.carbon_saved_co2_kg ? lastResult.carbon_saved_co2_kg / 21 : (lastResult.pathway === 'locker-dropoff' ? 14 / 21 : 52.5 / 21)).toFixed(2)} trees planted equivalent).</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#879596', padding: '2rem 0', textAlign: 'center' }}>No return triaged yet. Go to the Return Center and submit.</p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Visual Condition Verification</h3>
                  {lastResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {lastResult.bboxes.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', overflow: 'hidden' }}>
                          <svg viewBox="0 0 320 320" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            {lastResult.mediaUrl && !lastResult.mediaUrl.includes('unsplash') ? (
                              <image href={lastResult.mediaUrl} x="0" y="0" width="320" height="320" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
                            ) : lastResult.productId === 'p-smartphone-premium' ? (
                              <>
                                <rect x="95" y="40" width="130" height="240" rx="18" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                                <rect x="130" y="52" width="60" height="12" rx="6" fill="#D5D9D9" />
                              </>
                            ) : lastResult.productId === 'p-tshirt-commodity' ? (
                              <path d="M 140,70 Q 160,82 180,70 L 210,70 L 250,110 L 225,135 L 205,125 L 205,260 L 115,260 L 115,125 L 95,135 L 70,110 L 110,70 Z" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                            ) : (
                              <>
                                <circle cx="160" cy="160" r="100" stroke="#D5D9D9" strokeWidth="6" fill="none" />
                                <rect x="50" y="120" width="20" height="80" rx="10" fill="#EAEAEA" />
                                <rect x="250" y="120" width="20" height="80" rx="10" fill="#EAEAEA" />
                              </>
                            )}
                            {lastResult.bboxes.map((box, idx) => (
                              <g key={idx}>
                                <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="rgba(200, 34, 31, 0.2)" stroke="#C5221F" strokeWidth="2" strokeDasharray="4 2" />
                                <text x={box.x} y={box.y - 5} fill="#C5221F" fontSize="12" fontWeight="bold">{box.label}</text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', color: '#137333', fontWeight: 'bold' }}>
                          ✓ No Defects Detected
                        </div>
                      )}
                      
                      <div style={{ padding: '1.25rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #EAEAEA', fontSize: '0.85rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.25rem 0', color: '#879596', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Live Routing</h4>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#131A22' }}>
                              {lastResult.pathway === 'locker-dropoff' ? 'Amazon Locker Dropoff' : 'Hyperlocal P2P Match'}
                            </div>
                          </div>
                          <span style={{ backgroundColor: '#FFFDF9', color: 'var(--amazon-orange, #FF9900)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid #FFEED6' }}>
                            {lastResult.pathway === 'locker-dropoff' ? 'Local Hub' : 'Escrow Locked'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', padding: '0.5rem 0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F8F9FA', border: '1px solid #D5D9D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>📦</div>
                            <span style={{ fontSize: '0.7rem', color: '#565959', fontWeight: '500' }}>You</span>
                          </div>
                          
                          <div style={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', width: '100%', height: '2px', backgroundColor: '#EAEAEA', borderRadius: '2px' }}></div>
                            <div style={{ position: 'absolute', width: '50%', height: '2px', backgroundColor: 'var(--amazon-orange, #FF9900)', left: 0, top: '50%', transform: 'translateY(-50%)', borderRadius: '2px' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFF', border: '2px solid var(--amazon-orange, #FF9900)', zIndex: 2 }}></div>
                            <span style={{ position: 'absolute', top: '-20px', fontSize: '0.75rem', color: '#565959', fontWeight: 'bold', backgroundColor: '#FFF', padding: '0 4px' }}>
                              {lastResult.transit_distance_km ? lastResult.transit_distance_km.toFixed(1) : (lastResult.pathway === 'locker-dropoff' ? '1.4' : '3.2')} km
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFFDF9', border: '1px solid #FFEED6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                              {lastResult.pathway === 'locker-dropoff' ? '🏢' : '👤'}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#131A22', fontWeight: 'bold' }}>
                              {lastResult.pathway === 'locker-dropoff' ? 'Metro Hub' : (lastResult.matched_buyer?.listing_id ? 'Buyer-Local' : 'Buyer-Alpha')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#879596', padding: '2rem 0', textAlign: 'center' }}>Submit a return to view verification metrics.</p>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    GS1 Authentication Certificate
                  </h3>
                  {lastResult ? (
                    <div style={{ padding: '1.5rem', backgroundColor: '#F0FBFC', borderRadius: '8px', border: '1px solid #BFEAF1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: '#565959', fontWeight: 600 }}>Global Trade Item Number (GTIN)</div>
                          <div style={{ fontSize: '1.4rem', color: '#131A22', fontWeight: 800, fontFamily: 'monospace', marginTop: '0.25rem' }}>00819264023910</div>
                        </div>
                        <div style={{ backgroundColor: '#137333', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          VERIFIED AUTHENTIC
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #BFEAF1', paddingTop: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Brand Owner</div>
                          <div style={{ fontSize: '0.9rem', color: '#131A22', fontWeight: 500 }}>{lastResult.productId === 'p-smartphone-premium' ? 'Apple Inc.' : 'Bose Corporation'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Registry Match Date</div>
                          <div style={{ fontSize: '0.9rem', color: '#131A22', fontWeight: 500 }}>{new Date().toLocaleDateString()}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '0.75rem', color: '#565959' }}>Blockchain Ledger Hash</div>
                          <div style={{ fontSize: '0.8rem', color: '#879596', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            0x{(Math.random() * 1e16).toString(16)}0e4f...b7c2{(Math.random() * 1e16).toString(16)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#879596', padding: '1rem 0', textAlign: 'center', margin: 0 }}>Submit a return to verify authenticity.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SELLER DASHBOARD VIEW */}
        {userRole === 'seller' && activeTab === 'admin' && (
          <section className="view-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#131A22' }}>Seller Central Dashboard</h2>
              <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#F8F9FA', padding: '0.25rem', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                <button onClick={() => setSellerSubTab('inventory')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: sellerSubTab === 'inventory' ? '#FFF' : 'transparent', color: sellerSubTab === 'inventory' ? '#131A22' : '#565959', boxShadow: sellerSubTab === 'inventory' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Inventory Management</button>
                <button onClick={() => setSellerSubTab('studio')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', backgroundColor: sellerSubTab === 'studio' ? '#FFF' : 'transparent', color: sellerSubTab === 'studio' ? '#131A22' : '#565959', boxShadow: sellerSubTab === 'studio' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>AI Creation Studio</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Warehouse Avoidance Rate</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>{sellerMetrics?.warehouse_avoidance_rate || 68.4}%</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>↑ 12.4% vs Last Month</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Scope-3 Carbon Avoided</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>{sellerMetrics?.co2_saved_kg ? sellerMetrics.co2_saved_kg.toFixed(1) : 847.2} Kg</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>🌍 {sellerMetrics?.trees_planted ? sellerMetrics.trees_planted.toFixed(1) : 40.3} Trees Planted Equiv.</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Capital Recovery Value</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>₹{sellerMetrics?.capital_recovery_value ? sellerMetrics.capital_recovery_value.toLocaleString() : '4.28M'}</div>
                <div style={{ fontSize: '0.8rem', color: '#137333', marginTop: '0.5rem', fontWeight: 'bold' }}>✓ 82.6% Recovery Rate</div>
              </div>
              <div style={{ backgroundColor: '#FFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAEAEA', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: '600' }}>Safe-Hold Locked Funds</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#131A22' }}>₹{sellerMetrics?.escrow_locked_funds ? sellerMetrics.escrow_locked_funds.toLocaleString() : '145,200'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--amazon-orange, #FF9900)', marginTop: '0.5rem', fontWeight: 'bold' }}>Live from MatchesTable</div>
              </div>
            </div>

            {sellerSubTab === 'studio' && (
            <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', marginBottom: '2rem', animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#137333' }}>✨</span> Create New Listing (AI Assisted)
              </h3>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: 'bold' }}>Original Amazon Order ID</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={newListingOrderId}
                        onChange={(e) => setNewListingOrderId(e.target.value)}
                        placeholder="e.g. 114-1234567-8901234" 
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '0.9rem' }} 
                      />
                      {newListingOrderId && (
                        <div style={{ backgroundColor: '#E7F4E4', color: '#137333', padding: '0 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #C3E6CB', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> GS1 Verified
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#565959', marginBottom: '0.5rem', fontWeight: 'bold' }}>Visual Condition Proof</label>
                    <div style={{ border: '1px dashed #D5D9D9', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#F8F9FA', cursor: 'pointer' }}>
                      <span style={{ fontSize: '1.5rem' }}>📷</span>
                      <div style={{ fontSize: '0.85rem', color: '#565959', marginTop: '0.5rem', fontWeight: '500' }}>Click to upload return photo</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleAiAutoList}
                    disabled={!newListingOrderId || newListingAiState === 'assessing'}
                    style={{ width: '100%', padding: '0.8rem', backgroundColor: '#131A22', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: (!newListingOrderId || newListingAiState === 'assessing') ? 'not-allowed' : 'pointer', opacity: (!newListingOrderId || newListingAiState === 'assessing') ? 0.7 : 1 }}
                  >
                    {newListingAiState === 'assessing' ? '✨ AI Multimodal Assessment...' : '✨ 1-Click Auto-List via GenAI'}
                  </button>
                </div>
                
                {newListingAiState !== 'idle' && (
                  <div style={{ flex: 1, backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '1.5rem', border: '1px solid #EAEAEA' }}>
                    <div style={{ fontSize: '0.85rem', color: '#565959', marginBottom: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GenAI Draft</div>
                    {newListingAiState === 'assessing' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', color: '#879596' }}>Scanning image and analyzing data...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s' }}>
                        <div style={{ backgroundColor: '#FFFDF9', padding: '1rem', borderRadius: '8px', border: '1px solid #FFEED6' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--amazon-orange, #FF9900)', fontWeight: 'bold', marginBottom: '0.25rem' }}>AI Dynamic Pricing Suggestion</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#131A22' }}>₹{newListingPrice?.toLocaleString()}</div>
                          <div style={{ fontSize: '0.8rem', color: '#565959', marginTop: '0.25rem' }}>Based on visual Grade A analysis. 95% chance to sell in 24 hrs.</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#565959', marginBottom: '0.5rem', fontWeight: 'bold' }}>Optimized Description</label>
                          <textarea 
                            value={newListingDescription} 
                            onChange={(e) => setNewListingDescription(e.target.value)}
                            style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D5D9D9', fontSize: '0.85rem', resize: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <button 
                          onClick={publishNewListing}
                          style={{ width: '100%', padding: '0.8rem', backgroundColor: '#FFD814', color: '#0F1111', border: '1px solid #FCD200', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(213,217,217,0.5)' }}
                        >
                          Publish Listing
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}

            {sellerSubTab === 'inventory' && (
            <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', overflowX: 'auto', animation: 'fadeIn 0.3s' }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Active SecondLife Listings & Safe-Hold States</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {listings.map(list => (
                  <div key={list.listingId} style={{ 
                    backgroundColor: '#FFF', 
                    borderRadius: '12px', 
                    border: '1px solid #EAEAEA', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #EAEAEA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: '800', color: '#131A22', fontSize: '1.1rem' }}>{list.listingId}</span>
                        <span style={{ backgroundColor: '#E7F4E4', color: '#137333', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid #C3E6CB', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> GS1 Verified</span>
                      </div>
                      <span style={{ 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        backgroundColor: list.status === 'available' ? '#E7F4E4' : list.status === 'reserved' ? '#FEF8E3' : (list.status === 'removed' || list.status === 'disputed') ? '#FCE8E6' : '#F0F2F2',
                        color: list.status === 'available' ? '#0F7516' : list.status === 'reserved' ? '#8A5D19' : (list.status === 'removed' || list.status === 'disputed') ? '#C5221F' : '#565959'
                      }}>
                        {list.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#565959', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem', fontWeight: 'bold' }}>Product</div>
                        <div style={{ fontSize: '1.1rem', color: '#131A22', fontWeight: '600' }}>{list.productId}</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#879596', marginBottom: '0.2rem' }}>MSRP Value</div>
                          <div style={{ fontWeight: 'bold', color: '#131A22', fontSize: '1.1rem' }}>₹{list.msrp}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#879596', marginBottom: '0.2rem' }}>Item Condition</div>
                          <div style={{ fontWeight: '900', color: list.grade.includes('A') ? '#137333' : list.grade.includes('B') ? '#B08D00' : '#C5221F' }}>{list.grade}</div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#F0F2F2', padding: '0.8rem 1rem', borderRadius: '8px', borderLeft: `4px solid ${list.escrowStatus.includes('Locked') || list.escrowStatus.includes('Held') ? 'var(--amazon-orange, #FF9900)' : list.escrowStatus.includes('Released') || list.escrowStatus.includes('Refunded') ? '#137333' : '#879596'}` }}>
                        <div style={{ fontSize: '0.75rem', color: '#565959', marginBottom: '0.2rem', fontWeight: '600' }}>Amazon Safe-Hold Contract</div>
                        <div style={{ fontWeight: 'bold', color: '#131A22', fontSize: '0.9rem' }}>{list.escrowStatus}</div>
                      </div>
                      
                      {list.status === 'reserved' && (
                        <div style={{ backgroundColor: '#FFFDF9', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #FFEED6' }}>
                          <div style={{ fontSize: '0.75rem', color: '#565959', marginBottom: '0.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>🛡️</span> Matched Buyer Trust Score</div>
                          <div style={{ fontWeight: 'bold', color: '#131A22', fontSize: '0.9rem' }}>92/100 (Low Risk)</div>
                          <div style={{ fontSize: '0.7rem', color: '#879596', marginTop: '0.2rem' }}>SEFraudGNN pre-handoff check passed</div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #EAEAEA', display: 'flex', gap: '0.75rem', backgroundColor: '#FFF' }}>
                      <button 
                        style={{ flex: 1, padding: '0.6rem', backgroundColor: '#FFD814', border: '1px solid #FCD200', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#0F1111', fontWeight: '600', transition: 'background-color 0.2s', boxShadow: '0 2px 5px rgba(213,217,217,0.5)' }} 
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F7CA00'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFD814'}
                        onClick={() => toggleListingStatus(list.listingId, 'advance')}
                      >
                        Advance Safe-Hold State
                      </button>
                      
                      {list.status === 'reserved' && (
                        <button 
                          style={{ flex: 1, padding: '0.6rem', backgroundColor: '#FFF', border: '1px solid #C5221F', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#C5221F', fontWeight: 'bold', transition: 'background-color 0.2s', boxShadow: '0 2px 5px rgba(213,217,217,0.5)' }} 
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FCE8E6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF'}
                          onClick={() => toggleListingStatus(list.listingId, 'dispute')}
                        >
                          Dispute Item
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {listings.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#F8F9FA', borderRadius: '12px', border: '1px dashed #D5D9D9' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#131A22' }}>No Active Listings</h4>
                    <p style={{ margin: 0, color: '#565959' }}>There are currently no items in the Safe-Hold system.</p>
                  </div>
                )}
              </div>
            </div>
            )}
          </section>
        )}

        {/* FRAUD INVESTIGATIONS VIEW */}
        {userRole === 'seller' && activeTab === 'fraud' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Fraud Investigations (SEFraudGNN)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Return Network Topology</h3>
                <div style={{ height: '400px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                   {/* Mock graph visualization */}
                   <svg width="100%" height="100%" viewBox="0 0 400 400">
                     <circle cx="200" cy="200" r="150" stroke="#EAEAEA" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                     
                     <line x1="200" y1="200" x2="100" y2="100" stroke="#FF9900" strokeWidth="2" />
                     <line x1="200" y1="200" x2="300" y2="100" stroke="#EAEAEA" strokeWidth="2" />
                     <line x1="200" y1="200" x2="200" y2="320" stroke="#C5221F" strokeWidth="3" />
                     <line x1="200" y1="320" x2="120" y2="280" stroke="#C5221F" strokeWidth="2" />
                     <line x1="200" y1="320" x2="280" y2="280" stroke="#C5221F" strokeWidth="2" />
                     
                     <circle cx="100" cy="100" r="15" fill="#007185" />
                     <circle cx="300" cy="100" r="15" fill="#007185" />
                     <circle cx="200" cy="200" r="25" fill="#131A22" />
                     <circle cx="200" cy="320" r="20" fill="#C5221F" />
                     <circle cx="120" cy="280" r="12" fill="#FF9900" />
                     <circle cx="280" cy="280" r="12" fill="#FF9900" />
                     
                     <text x="180" y="195" fill="#FFF" fontSize="10">Target</text>
                     <text x="180" y="315" fill="#FFF" fontSize="10">Ring</text>
                   </svg>
                   <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#FFF', padding: '0.5rem', borderRadius: '4px', border: '1px solid #EAEAEA', fontSize: '0.75rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#C5221F', borderRadius: '50%' }}></div> High Risk Node</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '10px', height: '10px', backgroundColor: '#FF9900', borderRadius: '50%' }}></div> Suspicious Link</div>
                   </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#131A22', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#C5221F' }}>⚠️</span> Flagged Return Rings
                  </h3>
                  <div style={{ padding: '1rem', backgroundColor: '#FCE8E6', borderRadius: '8px', border: '1px solid #FAD2CF', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#C5221F', marginBottom: '0.25rem' }}>Cluster ID: #FR-8821</div>
                    <div style={{ fontSize: '0.85rem', color: '#131A22' }}><b>Risk Score: 94/100</b> - Coordinated Wardrobing Pattern. 3 users returning identical designer apparel after 48 hours to the same locker network.</div>
                    <button className="btn-action" style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', backgroundColor: '#FFF', color: '#C5221F', border: '1px solid #C5221F', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Halt Escrow Refunds</button>
                  </div>
                  <div style={{ padding: '1rem', backgroundColor: '#FFFDF9', borderRadius: '8px', border: '1px solid #FFEED6' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--amazon-orange, #FF9900)', marginBottom: '0.25rem' }}>Cluster ID: #FR-1044</div>
                    <div style={{ fontSize: '0.85rem', color: '#131A22' }}><b>Risk Score: 76/100</b> - Geographic Anomaly. IP location mismatch with locker dropoff location across multiple high-value electronics returns.</div>
                    <button className="btn-action" style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', backgroundColor: '#FFF', color: 'var(--amazon-orange, #FF9900)', border: '1px solid var(--amazon-orange, #FF9900)', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Require Manual Review</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRE-CHECKOUT PREVENTION VIEW */}
        {userRole === 'buyer' && activeTab === 'prevention' && (
          <section className="view-section" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#131A22' }}>Checkout & Cart Review</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 1fr)', gap: '2rem', alignItems: 'start' }}>
              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#131A22' }}>Your Shopping Cart</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cartItems.length === 0 ? (
                    <p style={{ color: '#879596', padding: '2rem 0', textAlign: 'center' }}>Your cart is empty.</p>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} style={{ padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#131A22' }}>{item.name}</span>
                          <span style={{ color: '#B12704', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{item.price}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.9rem', color: '#565959', backgroundColor: '#FFF', padding: '0.2rem 0.5rem', border: '1px solid #EAEAEA', borderRadius: '4px' }}>
                            Size: <strong>{item.size}</strong>
                          </div>
                          <button style={{ background: 'none', border: 'none', color: '#C5221F', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => removeFromCart(idx)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <details style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#565959', cursor: 'pointer', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <summary style={{ fontWeight: 'bold' }}>🛠️ Hackathon Demo Controls (Account History)</summary>
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <label style={{ fontWeight: 'bold', color: '#131A22' }}>Simulate Historical Returns (Past 7 Days):</label>
                      <input type="number" value={returnVelocity} onChange={e => { setReturnVelocity(parseInt(e.target.value)); evaluateFriction(); }} style={{ padding: '0.5rem', width: '80px', borderRadius: '4px', border: '1px solid #D5D9D9', textAlign: 'center' }} />
                    </div>
                  </details>
                </div>
              </div>

              <div className="panel" style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #EAEAEA', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', color: '#131A22' }}>Smart Fit Check</h3>
                <p style={{ fontSize: '0.9rem', color: '#565959', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  Find your perfect fit and help us reduce return emissions! 🌍
                </p>

                {showPreventionAlert && frictionScore && (
                  <div style={{
                    backgroundColor: frictionScore.intercept ? '#FCE8E6' : '#E6F4EA',
                    border: `1px solid ${frictionScore.intercept ? '#FAD2CF' : '#CEEAD6'}`,
                    padding: '1.5rem', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{frictionScore.intercept ? '⚠️' : '✅'}</span>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: frictionScore.intercept ? '#C5221F' : '#137333' }}>
                        {frictionScore.intercept ? 'Fit Uncertainty Detected' : 'Perfect Match!'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '0.95rem', color: '#131A22', lineHeight: 1.5 }}>
                      {frictionScore.intercept ? (
                        <>
                          <p style={{ marginBottom: '1.5rem' }}>
                            Ordering multiple sizes increases carbon footprint. Unsure about the fit?
                          </p>
                          <button className="btn-action" onClick={() => setActiveTab('vto')} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#131A22', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                            Try It On Virtually 👗
                          </button>
                        </>
                      ) : (
                        <>
                          <p>High fit confidence based on your profile: <b>{((1 - frictionScore.returnProbability) * 100).toFixed(0)}%</b></p>
                          <button className="btn-action" style={{ marginTop: '1.5rem', width: '100%', backgroundColor: '#FFD814', color: '#0F1111', padding: '0.75rem', borderRadius: '100px', border: '1px solid #FCD200', fontWeight: 'bold', cursor: 'pointer' }}>
                            Proceed to Checkout
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {showPreventionAlert && frictionScore && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid #EAEAEA', paddingTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#131A22', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📊</span> Smart Fit Insights
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ minWidth: '100px', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${frictionScore.intercept ? '#C5221F' : '#137333'}` }}>
                        <div style={{ fontSize: '0.75rem', color: '#565959', marginBottom: '0.25rem' }}>Fit Confidence</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: frictionScore.intercept ? '#C5221F' : '#137333' }}>
                          {((1 - frictionScore.returnProbability) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#565959', lineHeight: '1.5' }}>
                        {cartItems.filter(i => i.name === 'Essentials Cotton Hoodie').length > 1 ? (
                          <span><b>Heads up:</b> You have multiple sizes of the same item in your cart. Ordering just one perfect size helps reduce carbon emissions from returns!</span>
                        ) : (
                          <span><b>Looks good:</b> Your sizing profile closely matches these items based on historical purchase data.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {showPreventionAlert && !frictionScore && cartItems.length > 0 && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#131A22' }}>
                      Information for your order
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#565959', lineHeight: '1.5' }}>
                      {cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1) && (
                        <p style={{ marginBottom: '1rem' }}>
                          <b>Fit Note:</b> You have added multiple sizes (M and L) of the same garment. Sizing metrics indicate the "Essentials Cotton Hoodie" runs true-to-size. We recommend selecting your usual size.
                        </p>
                      )}
                      {returnVelocity > 3 && (
                        <p>
                          <b>Account Note:</b> We noticed a higher than usual return rate on your account. Please double-check sizing guides to ensure a perfect fit before ordering.
                        </p>
                      )}
                      {!(cartItems.some(i => i.name === 'Essentials Cotton Hoodie' && cartItems.filter(f => f.name === i.name).length > 1)) && returnVelocity <= 3 && (
                         <p>Analyzing fit and account velocity...</p>
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