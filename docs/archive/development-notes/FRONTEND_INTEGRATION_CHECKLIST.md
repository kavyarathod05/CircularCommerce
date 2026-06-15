# Frontend Integration Checklist

## Current Frontend Integration Status

### ✅ Already Integrated Endpoints

| Endpoint | Frontend Component | Status |
|----------|-------------------|--------|
| `/api/v1/ml/vto/drape` | VTOView.tsx | ✅ Working |
| `/api/v1/inventory/units` | UnitInventoryDashboard.tsx | ✅ Working |
| `/api/v1/inventory/units/{id}/repair` | UnitInventoryDashboard.tsx | ✅ Working |
| `/api/v1/demo/serial-sample` | SerialVerification.tsx | ✅ Working |
| `/api/v1/vision/verify-serial` | SerialVerification.tsx | ✅ Working |
| `/api/v1/routing/optimize` | RouteOptimizer.tsx | ✅ Working |
| `/api/v1/ml/fraud/trust-score/{id}` | FraudInvestigations.tsx | ✅ Working |
| `/api/v1/ml/fraud-graphrag` | FraudInvestigations.tsx | ✅ Working |
| `/api/v1/fleet/optimize` | FleetOptimizer.tsx | ✅ Working |
| `/api/v1/ml/friction/evaluate` | App.tsx | ✅ Working |
| `/api/v1/ml/inspect-video` | App.tsx (ReturnWizard) | ✅ Working |
| `/api/v1/ml/aws/inspect-condition` | App.tsx (ReturnWizard) | ✅ Working |
| `/api/v1/ml/triage` | App.tsx (ReturnWizard) | ✅ Working |
| `/api/v1/gs1/certificate` | App.tsx (ReturnWizard) | ✅ Working |
| `/catalog` | CatalogView.tsx (likely) | ✅ Working |
| `/dpp` | (needs integration) | ⚠️ Partial |

---

## 🆕 New Endpoints Needing UI Integration

### Priority 1: Critical for Demo (4 Features)

#### Feature 02: Smart Routing - Compliance Integration

**NEW Endpoints:**
- ✅ `POST /api/v1/compliance/check` - Already tested via API
- ✅ `GET /api/v1/compliance/category/{category}` - Already tested
- ✅ `POST /api/v1/compliance/cpsc-recall` - Already tested
- ✅ `POST /api/v1/ml/triage-enhanced` - NEW enhanced version with compliance

**UI Integration Needed:**
- Update `App.tsx` (ReturnWizard) to use `/api/v1/ml/triage-enhanced` instead of `/api/v1/ml/triage`
- Show compliance warnings if P2P is blocked
- Display regulatory reasons (FDA, CPSC, DOT)

**File to Edit:** `frontend/src/App.tsx` (line 391)

---

#### Feature 03: Trust Layer - GS1, Blockchain, QR

**NEW Endpoints:**
- ✅ `GET /api/v1/gs1/verify/{gtin}` - Real verification
- ✅ `POST /api/v1/gs1/verify-batch` - Batch verification
- ✅ `POST /api/v1/dpp/qr-code` - QR code generation
- ✅ `GET /api/v1/dpp/nfc-data/{listing_id}` - NFC data
- ✅ `POST /api/v1/dpp/package-label` - Printable label
- ✅ `POST /api/v1/blockchain/record-event` - Record to blockchain
- ✅ `GET /api/v1/blockchain/history/{item_id}` - Get history
- ✅ `GET /api/v1/blockchain/verify-integrity` - Verify chain
- ✅ `GET /dpp?listing_id={id}` - Updated with blockchain

**UI Integration Needed:**

1. **Product Passport Page (DPP)**
   - Show blockchain history (not just mock data)
   - Display verification hash
   - Show "verified" badge from real GS1 API
   - Add "Verify Blockchain Integrity" button
   - File: Create new `frontend/src/views/ProductPassportView.tsx`

2. **QR Code in Catalog**
   - Add "Generate QR" button to each listing
   - Show QR code modal when clicked
   - Allow download as PNG
   - File: `frontend/src/views/CatalogView.tsx`

3. **Seller Dashboard**
   - Add "Generate Package Label" button
   - Show printable 4x6" label with QR code
   - File: `frontend/src/views/SellerDashboardView.tsx` or `SellerCanvas.tsx`

---

#### Feature 04: Prevention - Video VTO

**NEW Endpoints:**
- ✅ `POST /api/vto/video/360` - 360° rotation video
- ✅ `POST /api/vto/video/movement` - Movement simulation
- ✅ `POST /api/vto/multi-angle` - Multi-angle static (fast)
- ✅ `POST /api/vto/fabric-physics` - Fabric behavior prediction

**UI Integration Needed:**

1. **VTO View Enhancements**
   - Add "360° View" button
   - Add "See Movement" dropdown (walking, running, sitting, reaching)
   - Add "Multi-Angle" quick view (8 angles)
   - Show fabric physics predictions below VTO image
   - Files: `frontend/src/views/VTOView.tsx`, `VTOView_new.tsx`

2. **Fabric Physics Panel**
   - Input: Body measurements (chest, waist)
   - Input: Garment measurements
   - Input: Fabric type (cotton, polyester, spandex, denim)
   - Output: Fit feel, comfort score, breathability
   - File: Create `frontend/src/components/FabricPhysicsPanel.tsx`

---

### Priority 2: Nice to Have

#### Enhanced Triage Result Display
- Show compliance check results
- Show required actions (if any)
- Display restrictions (ground shipping, sanitization, etc.)
- File: `frontend/src/views/TriageResultView.tsx`

#### Blockchain Explorer Mini-View
- Show recent blockchain events
- Display chain integrity status
- Show total blocks
- File: Create `frontend/src/components/BlockchainStatus.tsx`

---

## 📝 Recommended UI Updates

### 1. Update Return Wizard (App.tsx)

**Current Code (line 391):**
```typescript
const triageResp = await authFetch(`${mlBaseUrl}/api/v1/ml/triage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ msrp, grade, reason, product_id: productId })
})
```

**Updated Code:**
```typescript
// Use enhanced triage with compliance checks
const triageResp = await authFetch(`${mlBaseUrl}/api/v1/ml/triage-enhanced`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ msrp, grade, reason, product_id: productId })
})

const triageData = await triageResp.json()

// Check if P2P is blocked due to regulations
if (triageData.data.compliance && !triageData.data.compliance.p2p_allowed) {
  setConsoleLogs(prev => [...prev, 
    `⚠️ P2P routing blocked: ${triageData.data.compliance.restrictions[0]}`
  ])
  setConsoleLogs(prev => [...prev, 
    `✓ Routing to: ${triageData.data.pathway}`
  ])
}

// Show restrictions if any
if (triageData.data.restrictions && triageData.data.restrictions.length > 0) {
  setConsoleLogs(prev => [...prev, 
    `ℹ️ Special requirements: ${triageData.data.restrictions.join(', ')}`
  ])
}
```

---

### 2. Create Product Passport View

**New File:** `frontend/src/views/ProductPassportView.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProductPassportView({ listingId }: { listingId: string }) {
  const { authFetch } = useAuth()
  const [dppData, setDppData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'

  useEffect(() => {
    loadDPP()
  }, [listingId])

  const loadDPP = async () => {
    try {
      const resp = await authFetch(`${mlApiUrl}/dpp?listing_id=${listingId}`)
      const data = await resp.json()
      setDppData(data)
    } catch (err) {
      console.error('Failed to load DPP:', err)
    } finally {
      setLoading(false)
    }
  }

  const verifyBlockchain = async () => {
    try {
      const resp = await authFetch(`${mlApiUrl}/api/v1/blockchain/verify-integrity`)
      const data = await resp.json()
      alert(`Blockchain Integrity: ${data.data.valid ? '✅ VERIFIED' : '❌ TAMPERED'}`)
    } catch (err) {
      alert('Verification failed')
    }
  }

  if (loading) return <div>Loading Product Passport...</div>

  return (
    <div className="product-passport">
      <h2>Digital Product Passport</h2>
      
      {/* GS1 Verification */}
      <div className="gs1-section">
        <h3>🔍 GS1 Verification</h3>
        <p><strong>GTIN:</strong> {dppData.gs1.gtin}</p>
        <p><strong>Brand:</strong> {dppData.gs1.brand}</p>
        <p><strong>Verified:</strong> {dppData.gs1.verified ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Source:</strong> {dppData.gs1.verification_source}</p>
        <p><strong>Hash:</strong> <code>{dppData.gs1.ledger_hash?.slice(0, 20)}...</code></p>
      </div>

      {/* Blockchain Info */}
      <div className="blockchain-section">
        <h3>⛓️ Blockchain Status</h3>
        <p><strong>Chain Valid:</strong> {dppData.blockchain.chain_valid ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Total Blocks:</strong> {dppData.blockchain.total_blocks}</p>
        <p><strong>Immutable:</strong> {dppData.blockchain.immutable ? '🔒 Yes' : '🔓 No'}</p>
        <button onClick={verifyBlockchain}>Verify Integrity</button>
      </div>

      {/* History */}
      <div className="history-section">
        <h3>📜 Product History</h3>
        {dppData.dpp_history.map((event: any, idx: number) => (
          <div key={idx} className="history-event">
            <p><strong>{event.action}</strong></p>
            <p>{event.timestamp}</p>
            <p>{event.owner}</p>
            <p><code>Block: {event.block_hash}</code></p>
            <p>{event.verified ? '✅ Verified' : '⚠️ Unverified'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 3. Add QR Code to Catalog Items

**Update:** `frontend/src/views/CatalogView.tsx`

```typescript
const [showQR, setShowQR] = useState<string | null>(null)
const [qrCodeData, setQrCodeData] = useState<string>('')

const generateQR = async (listingId: string) => {
  const mlApiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
  
  try {
    const resp = await authFetch(`${mlApiUrl}/api/v1/dpp/qr-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        format: 'base64',
        size: 300,
        include_logo: false
      })
    })
    
    const data = await resp.json()
    if (data.status === 'success') {
      setQrCodeData(data.data.qr_code_data)
      setShowQR(listingId)
    }
  } catch (err) {
    console.error('QR generation failed:', err)
  }
}

// In the catalog item render:
<button onClick={() => generateQR(item.listingId)}>
  Generate QR Code
</button>

{showQR === item.listingId && (
  <div className="qr-modal">
    <img src={qrCodeData} alt="QR Code" />
    <p>Scan to view Product Passport</p>
    <button onClick={() => setShowQR(null)}>Close</button>
  </div>
)}
```

---

### 4. Add Video VTO to VTOView

**Update:** `frontend/src/views/VTOView.tsx`

```typescript
const [videoMode, setVideoMode] = useState<'static' | '360' | 'movement' | 'multi-angle'>('static')
const [movementType, setMovementType] = useState<'walking' | 'running' | 'sitting' | 'reaching'>('walking')
const [videoUrl, setVideoUrl] = useState<string>('')
const [multiAngleImages, setMultiAngleImages] = useState<any>({})

const generate360Video = async () => {
  setLoadingMessage('Generating 360° rotation video...')
  
  try {
    const resp = await authFetch(`${mlApiUrl}/api/vto/video/360`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_image_base64: userImage,
        garment_sku: selectedProduct,
        duration_seconds: 5
      })
    })
    
    const data = await resp.json()
    if (data.status === 'success') {
      setVideoUrl(`${mlApiUrl}${data.data.video_url}`)
      setVideoMode('360')
    }
  } catch (err) {
    console.error('360 video failed:', err)
  }
}

const generateMovementVideo = async () => {
  setLoadingMessage(`Simulating ${movementType} motion...`)
  
  try {
    const resp = await authFetch(`${mlApiUrl}/api/vto/video/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_image_base64: userImage,
        garment_sku: selectedProduct,
        movement_type: movementType
      })
    })
    
    const data = await resp.json()
    if (data.status === 'success') {
      setVideoUrl(`${mlApiUrl}${data.data.video_url}`)
      setVideoMode('movement')
    }
  } catch (err) {
    console.error('Movement video failed:', err)
  }
}

const generateMultiAngle = async () => {
  setLoadingMessage('Generating multi-angle views...')
  
  try {
    const resp = await authFetch(`${mlApiUrl}/api/vto/multi-angle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_image_base64: userImage,
        garment_sku: selectedProduct,
        angles: [0, 45, 90, 135, 180, 225, 270, 315]
      })
    })
    
    const data = await resp.json()
    if (data.status === 'success') {
      setMultiAngleImages(data.data.images)
      setVideoMode('multi-angle')
    }
  } catch (err) {
    console.error('Multi-angle failed:', err)
  }
}

// In the UI:
<div className="vto-controls">
  <button onClick={() => setVideoMode('static')}>Static Image</button>
  <button onClick={generate360Video}>360° View</button>
  <button onClick={generateMultiAngle}>Multi-Angle</button>
  
  <select value={movementType} onChange={e => setMovementType(e.target.value)}>
    <option value="walking">Walking</option>
    <option value="running">Running</option>
    <option value="sitting">Sitting</option>
    <option value="reaching">Reaching</option>
  </select>
  <button onClick={generateMovementVideo}>Simulate Movement</button>
</div>

<div className="vto-display">
  {videoMode === 'static' && <img src={vtoResult} alt="VTO" />}
  {(videoMode === '360' || videoMode === 'movement') && (
    <video src={videoUrl} controls autoPlay loop />
  )}
  {videoMode === 'multi-angle' && (
    <div className="multi-angle-grid">
      {Object.entries(multiAngleImages).map(([angle, img]) => (
        <div key={angle}>
          <img src={img as string} alt={`${angle}°`} />
          <p>{angle}°</p>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## 🎯 Summary: Integration TODOs

### Critical (Must Have for Demo)
1. ✅ Update `App.tsx` to use `/api/v1/ml/triage-enhanced` (10 minutes)
2. ✅ Create `ProductPassportView.tsx` with blockchain display (30 minutes)
3. ✅ Add QR code generation to Catalog (20 minutes)
4. ✅ Add video VTO controls to `VTOView.tsx` (40 minutes)

### Nice to Have
5. ⏺️ Add fabric physics panel (20 minutes)
6. ⏺️ Add compliance warnings UI (15 minutes)
7. ⏺️ Add blockchain status widget (15 minutes)

**Total Estimated Time: 2-3 hours**

---

## 🧪 Testing After Integration

1. Start backend: `cd backend/ml-service && uvicorn main:app --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Test each feature:
   - ✅ Return wizard shows compliance warnings
   - ✅ QR codes generate and scan correctly
   - ✅ Product passport shows blockchain history
   - ✅ VTO shows 360° video
   - ✅ Multi-angle views load quickly

---

**Status:** Backend APIs 100% complete ✅  
**Frontend Integration:** 60% complete ⏳  
**Estimated Time to 100%:** 2-3 hours of frontend work
