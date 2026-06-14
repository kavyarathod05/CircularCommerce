import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import RoleSelection from './views/RoleSelection';
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
import LogisticsTelemetry from './LogisticsTelemetry'
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
  owner: string
  grade: string
  escrowStatus: string
  status: 'available' | 'reserved' | 'sold' | string
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
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)

  useEffect(() => {
    const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000'
    if (activeTab === 'catalog') {
      setIsCatalogLoading(true)
      fetch(`${mlApiUrl}/catalog`)
        .then(res => res.json())
        .then(data => { setCatalogItems(Array.isArray(data) ? data : []); setIsCatalogLoading(false) })
        .catch(err => { console.error("Catalog fetch failed", err); setIsCatalogLoading(false) })
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

  const contextValue = { userRole, setUserRole, activeTab, setActiveTab, orderId, setOrderId, productId, setProductId, msrp, setMsrp, reason, setReason, lat, setLat, lng, setLng, mediaUrl, setMediaUrl, selectedFile, setSelectedFile, setUploading, consoleLogs, setConsoleLogs, isEvaluating, setIsEvaluating, lastResult, setLastResult, listings, setListings, sellerMetrics, setSellerMetrics, userMetrics, setUserMetrics, dppData, setDppData, catalogItems, setCatalogItems, isCatalogLoading, setIsCatalogLoading, cartItems, setCartItems, returnVelocity, setReturnVelocity, showPreventionAlert, setShowPreventionAlert, frictionScore, setFrictionScore, evaluateFriction, addToCart, removeFromCart, handleFileChange, uploadFileToS3, getBase64, runTriageSimulation, toggleListingStatus };

  return (
    <AppContext.Provider value={contextValue}>
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F8FA', fontFamily: 'var(--body-font, system-ui, sans-serif)' }}>
      {/* SIDEBAR NAVIGATION - Fixed Design Issues */}
        <Sidebar />
        {/* MAIN CONTENT CONTAINER */}
      <main style={{ flexGrow: 1, padding: '2rem 3rem', boxSizing: 'border-box', maxWidth: userRole ? 'calc(100vw - 280px)' : '100vw', overflowY: 'auto' }}>
        
        {/* ROLE SELECTION SCREEN */}
        <RoleSelection />
        {/* CATALOG VIEW */}
        <CatalogView />
        {/* VTO VIEW */}
        <VTOView />
        {/* ACCOUNT VIEW */}
        <AccountView />
        {/* RETURN WIZARD VIEW */}
        <ReturnWizardView />
        {/* TRIAGE RESULT VIEW */}
        <TriageResultView />
        {/* SELLER DASHBOARD VIEW */}
        <SellerDashboardView />
        {/* PRE-CHECKOUT PREVENTION VIEW */}
        <PreventionView />
        {/* LOGISTICS TELEMETRY VIEW */}
        {userRole && activeTab === 'logistics' && (
          <LogisticsTelemetry />
        )}

        {/* SUSTAINABLE FLEET OPTIMIZER VIEW */}
        {userRole && activeTab === 'routing' && (
          <FleetOptimizer />
        )}

        {/* NSGA-II ROUTE OPTIMIZER VIEW */}
        {userRole && activeTab === 'nsga2' && (
          <RouteOptimizer />
        )}

        {/* MULTIMODAL SERIAL VERIFICATION VIEW */}
        {userRole && activeTab === 'serial' && (
          <SerialVerification />
        )}

        {/* UNIT INVENTORY DASHBOARD */}
        {userRole === 'seller' && activeTab === 'inventory' && (
          <UnitInventoryDashboard />
        )}

        {/* FRAUD INVESTIGATIONS VIEW */}
        {userRole === 'seller' && activeTab === 'fraud' && (
          <FraudInvestigations />
        )}

        {/* MODULAR SELLER CANVAS */}
        {userRole === 'seller' && activeTab === 'admin' && (
          <SellerCanvas />
        )}
      </main>
    </div>
    </AppContext.Provider>
  )
}

export default App