import { AppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './views/LoginPage';
import { PageLoader } from './components/Loader';
import CatalogView from './views/CatalogView';
import VTOView from './views/VTOView';
import AccountView from './views/AccountView';
import ReturnWizardView from './views/ReturnWizardView';
import TriageResultView from './views/TriageResultView';
import SellerDashboardView from './views/SellerDashboardView';
import PreventionView from './views/PreventionView';
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import './views/LoginPage.css'
import LogisticsTelemetry from './LogisticsTelemetry'
import OrderTrackingView from './views/OrderTrackingView'
import ProcessingLogsView from './views/ProcessingLogsView'
import SellerDeliveryOverview from './views/SellerDeliveryOverview'
import RouteOptimizer from './RouteOptimizer'
import UnitInventoryDashboard from './UnitInventoryDashboard'
import FleetOptimizer from './FleetOptimizer'
import SerialVerification from './SerialVerification'
import SellerCanvas from './SellerCanvas'
import FraudInvestigations from './FraudInvestigations'

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
  gs1?: { gtin: string; brand: string; ledgerHash: string; verified: boolean }
  pathwayLabel?: string
  inspectionImageUrl?: string
}

interface ListingRecord {
  listingId: string
  productId: string
  msrp: number
  currentPrice?: number
  discountApplied?: string | number
  isFlashDeal?: boolean
  recommendedSize?: string | null
  certificateUrl?: string
  image?: string
  owner: string
  grade: string
  escrowStatus: string
  status: 'available' | 'reserved' | 'sold' | string
}

const DEMO_CATALOG: ListingRecord[] = [
  { listingId: 'lst-demo-1', productId: 'Bose QC Headphones', msrp: 7900, currentPrice: 6320, discountApplied: '20%', owner: 'Priya S. (Koramangala)', grade: 'Grade B', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
  { listingId: 'lst-demo-2', productId: 'Essentials Cotton Hoodie', msrp: 2999, currentPrice: 2399, discountApplied: '20%', owner: 'Priya S. (Koramangala)', grade: 'Grade A', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500' },
  { listingId: 'lst-demo-3', productId: 'iPhone 14 Pro Max', msrp: 95000, currentPrice: 76000, discountApplied: '20%', owner: 'Priya S. (Koramangala)', grade: 'Grade B', escrowStatus: 'N/A', status: 'available', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500' },
]

function AppInner() {
  const { user, isAuthenticated, isLoading, logout, authFetch } = useAuth();
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'admin' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = (location.pathname.replace('/', '') || 'catalog') as any
  const setActiveTab = (tab: string) => navigate('/' + tab)

  // Auto-sync role from JWT user when they log in
  useEffect(() => {
    if (user) {
      const role = user.role as 'buyer' | 'seller' | 'admin'
      setUserRole(role)
      
      const validTabs = {
        buyer: ['catalog', 'vto', 'prevention', 'wizard', 'result', 'logistics', 'account'],
        seller: ['admin', 'logs', 'logistics', 'fraud', 'serial', 'inventory'],
        admin: ['fraud', 'serial', 'inventory', 'logs', 'logistics', 'nsga2', 'routing', 'workspace']
      }
      
      const currentPath = location.pathname.replace('/', '')
      const defaultTabs: Record<string, string> = { buyer: 'catalog', seller: 'admin', admin: 'fraud' }
      
      if (!currentPath || currentPath === 'login' || !validTabs[role].includes(currentPath)) {
        navigate('/' + defaultTabs[role], { replace: true })
      }
    } else {
      setUserRole(null)
    }
  }, [user, location.pathname, navigate])


  // Wizard States
  const [orderId, setOrderId] = useState('999-65432-1789')
  const [productId, setProductId] = useState('p-headphones-premium')
  const [msrp, setMsrp] = useState(7900)
  const [reason, setReason] = useState('damaged')
  const [lat, setLat] = useState('12.9716')
  const [lng, setLng] = useState('77.5946')
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800')
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
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)

  useEffect(() => {
    const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
    const loadCatalog = () => {
      setIsCatalogLoading(true)
      authFetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => {
          const items = Array.isArray(data) && data.length ? data : DEMO_CATALOG
          setCatalogItems(items)
          setIsCatalogLoading(false)
        })
        .catch(err => {
          console.error('Catalog fetch failed', err)
          setCatalogItems(DEMO_CATALOG)
          setIsCatalogLoading(false)
        })
    }

    if (userRole === 'buyer' && (catalogItems.length === 0 || activeTab === 'catalog' || activeTab === 'vto')) {
      loadCatalog()
    } else if (userRole === 'seller' && activeTab === 'admin') {
      authFetch(`${mlApiUrl}/seller/metrics?seller_id=usr-12`)
        .then(res => res.json())
        .then(data => setSellerMetrics(data))
        .catch(() => setSellerMetrics({ co2_saved_kg: 18 }))

      authFetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => setListings(Array.isArray(data) && data.length ? data.slice(0, 3) : DEMO_CATALOG))
        .catch(() => setListings(DEMO_CATALOG))
    } else if (activeTab === 'account' && userRole === 'buyer') {
      authFetch(`${mlApiUrl}/user/metrics?user_id=usr-12`)
        .then(res => res.json())
        .then(data => setUserMetrics(data))
        .catch(err => console.error("User metrics fetch failed", err))
      
      authFetch(`${mlApiUrl}/dpp?listing_id=lst-123`)
        .then(res => res.json())
        .then(data => setDppData(data))
        .catch(err => console.error("DPP fetch failed", err))
    }
  }, [activeTab, userRole, authFetch])

  // Prevention Tab States
  const [cartItems, setCartItems] = useState<{ id: string; name: string; size: string; price: number }[]>([
    { id: 'p-hoodie', name: 'Essentials Cotton Hoodie', size: 'M', price: 2999 },
    { id: 'p-hoodie', name: 'Essentials Cotton Hoodie', size: 'L', price: 2999 } 
  ])
  const [returnVelocity, setReturnVelocity] = useState(1)
  const [showPreventionAlert, setShowPreventionAlert] = useState(true)
  const [frictionScore, setFrictionScore] = useState<any>(null)

  // VTO Tab State
  const [selectedVTOProduct, setSelectedVTOProduct] = useState<string>('')

  const evaluateFriction = async (currentCart: any[] = cartItems) => {
    const bracketing = currentCart.some(item =>
      currentCart.filter(i => i.name === item.name).length > 1
    )
    const localFallback = () => {
      let prob = 0.12
      const reasons: string[] = []
      if (bracketing) {
        prob += 0.34
        reasons.push('Multiple sizes of the same item in cart')
      }
      if (returnVelocity >= 4) {
        prob += 0.28
        reasons.push('High recent return activity on account')
      } else if (returnVelocity >= 2) {
        prob += 0.12
        reasons.push('Elevated return activity on account')
      }
      prob = Math.min(0.95, Math.max(0.05, prob))
      setFrictionScore({
        returnProbability: Math.round(prob * 100) / 100,
        returnRiskPercent: Math.round(prob * 100),
        fitConfidencePercent: Math.round((1 - prob) * 100),
        intercept: prob > 0.45,
        reasons,
        message: prob > 0.45
          ? 'Ordering multiple sizes or returning frequently increases the chance this order comes back. Try one size or use Try Before You Buy.'
          : 'Sizing and account history look good for this cart.',
      })
      setShowPreventionAlert(true)
    }

    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      const resp = await authFetch(`${mlApiUrl}/api/v1/ml/friction/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'usr-12',
          product_id: currentCart.length > 0 ? currentCart[0].id : 'p-hoodie',
          session_data: {
            cart_size: currentCart.length,
            return_velocity: returnVelocity,
            cart_items: currentCart.map(i => ({ name: i.name, size: i.size })),
            dwell_time_seconds: 90,
          }
        })
      })
      const data = await resp.json()
      if (data.status === 'success' && data.data) {
        setFrictionScore(data.data)
        setShowPreventionAlert(true)
      } else {
        localFallback()
      }
    } catch (e) {
      console.error(e)
      localFallback()
    }
  }

  useEffect(() => {
    if (userRole === 'buyer' && activeTab === 'prevention') {
      evaluateFriction(cartItems)
    }
  }, [userRole, activeTab, returnVelocity])



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
      
      const mlResp = await authFetch(`${mlBaseUrl}${endpoint}`, {
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
      const triageResp = await authFetch(`${mlBaseUrl}/api/v1/ml/triage`, {
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

      if (liveBboxes.length === 0) {
        liveBboxes = [
          { label: 'ear pad wear', x: 198, y: 118, w: 72, h: 58 },
          { label: 'headband scuff', x: 132, y: 42, w: 96, h: 28 },
        ]
        liveSummary = liveSummary === 'Assessed successfully.' ? 'Minor wear on ear pads and light scuff on headband. Item suitable for local resale.' : liveSummary
      }

      const inspectionImageUrl = productId.includes('headphones')
        ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
        : productId.includes('smartphone')
          ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
          : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'
      let gs1Data = { gtin: '00819264023910', brand: 'Bose Corporation', ledgerHash: '0x8f3b2a91c4e7d0f1a2b3c4d5e6f70819264023910', verified: true }
      try {
        const gs1Resp = await authFetch(`${mlBaseUrl}/api/v1/gs1/certificate?product_id=${encodeURIComponent(productId)}`)
        if (gs1Resp.ok) {
          const gs1Json = await gs1Resp.json()
          if (gs1Json.status === 'success') {
            gs1Data = {
              gtin: gs1Json.data.gtin,
              brand: gs1Json.data.brand,
              ledgerHash: gs1Json.data.ledger_hash,
              verified: gs1Json.data.verified,
            }
          }
        }
      } catch {}

      const pathwayLabels: Record<string, string> = {
        'hyperlocal-p2p': 'Matched to a local buyer nearby',
        'locker-dropoff': 'Drop off at a nearby locker',
        'refurbish': 'Sent for refurbishment',
        'premium': 'Instant refund approved',
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
        mediaUrl: inspectionImageUrl,
        inspectionImageUrl,
        pathway,
        pathwayLabel: pathwayLabels[pathway] || 'Return route confirmed',
        grade: liveGrade,
        summary: liveSummary,
        bboxes: liveBboxes,
        carbon_saved_co2_kg: pathway === 'locker-dropoff' ? 14.2 : 28.6,
        transit_distance_km: pathway === 'locker-dropoff' ? 1.4 : 3.2,
        matched_buyer: { listing_id: 'lst-local-42' },
        gs1: gs1Data,
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

  const toggleListingStatus = async (id: string) => {
    setListings(prev => {
      const base = prev.length ? prev : DEMO_CATALOG
      const list = base.find(l => l.listingId === id)
      if (!list) return prev.length ? prev : DEMO_CATALOG

      let nextStatus: 'available' | 'reserved' | 'sold' = 'available'
      let nextEscrow = list.escrowStatus
      if (list.status === 'available') {
        nextStatus = 'reserved'
        nextEscrow = 'Locked (₹' + Math.round(list.msrp * 0.75) + ')'
      } else if (list.status === 'reserved') {
        nextStatus = 'sold'
        nextEscrow = 'Released'
      } else {
        nextStatus = 'available'
        nextEscrow = 'N/A'
      }

      const updated = base.map(l => (l.listingId === id ? { ...l, status: nextStatus, escrowStatus: nextEscrow } : l))
      return updated
    })

    try {
      const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
      await authFetch(`${mlApiUrl}/listing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, new_status: 'advance', buyer_id: 'usr-buyer-demo' })
      })
    } catch (e) {
      console.error('Listing API optional — updated locally', e)
    }
  }

  const contextValue = { userRole, setUserRole, activeTab, setActiveTab, orderId, setOrderId, productId, setProductId, msrp, setMsrp, reason, setReason, lat, setLat, lng, setLng, mediaUrl, setMediaUrl, selectedFile, setSelectedFile, setUploading, consoleLogs, setConsoleLogs, isEvaluating, setIsEvaluating, lastResult, setLastResult, listings, setListings, sellerMetrics, setSellerMetrics, userMetrics, setUserMetrics, dppData, setDppData, catalogItems, setCatalogItems, isCatalogLoading, setIsCatalogLoading, cartItems, setCartItems, returnVelocity, setReturnVelocity, showPreventionAlert, setShowPreventionAlert, frictionScore, setFrictionScore, evaluateFriction, addToCart, removeFromCart, handleFileChange, uploadFileToS3, getBase64, runTriageSimulation, toggleListingStatus, logout, selectedVTOProduct, setSelectedVTOProduct };

  // ── Render: gate on auth state ONLY in JSX (never as early returns) ────────
  if (isLoading) {
    return <PageLoader label="Loading SecondLife..." />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppContext.Provider value={contextValue}>
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F8FA', fontFamily: 'var(--body-font, system-ui, sans-serif)' }}>
      {/* SIDEBAR NAVIGATION - Fixed Design Issues */}
        <Sidebar />
        {/* MAIN CONTENT CONTAINER */}
      <main style={{ flexGrow: 1, padding: '2rem 3rem', boxSizing: 'border-box', maxWidth: userRole ? 'calc(100vw - 280px)' : '100vw', overflowY: 'auto' }}>
        {/* CATALOG VIEW */}
        <CatalogView />
        {/* VTO VIEW */}
        <VTOView />
        {/* ACCOUNT VIEW */}
        <AccountView />
        {/* RETURN WIZARD VIEW */}
        <ReturnWizardView />
        {/* TRIAGE RESULT VIEW - buyer return status only */}
        <TriageResultView />
        {/* SELLER DASHBOARD VIEW */}
        <SellerDashboardView />
        {/* PRE-CHECKOUT PREVENTION VIEW */}
        <PreventionView />

        {userRole === 'buyer' && activeTab === 'logistics' && <OrderTrackingView />}
        {userRole === 'seller' && activeTab === 'logistics' && <SellerDeliveryOverview />}
        {userRole === 'admin' && activeTab === 'logistics' && <LogisticsTelemetry />}

        {userRole === 'seller' && activeTab === 'logs' && <ProcessingLogsView variant="seller" />}
        {userRole === 'admin' && activeTab === 'logs' && <ProcessingLogsView variant="admin" />}

        {userRole === 'admin' && activeTab === 'routing' && <FleetOptimizer />}
        {userRole === 'admin' && activeTab === 'nsga2' && <RouteOptimizer />}

        {userRole === 'seller' && activeTab === 'serial' && <SerialVerification variant="seller" />}
        {userRole === 'admin' && activeTab === 'serial' && <SerialVerification variant="admin" />}

        {(userRole === 'seller' || userRole === 'admin') && activeTab === 'inventory' && (
          <UnitInventoryDashboard />
        )}

        {userRole === 'seller' && activeTab === 'fraud' && <FraudInvestigations variant="seller" />}
        {userRole === 'admin' && activeTab === 'fraud' && <FraudInvestigations variant="admin" />}

        {userRole === 'admin' && activeTab === 'workspace' && <SellerCanvas />}
      </main>
    </div>
    </AppContext.Provider>
  )
}


function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App