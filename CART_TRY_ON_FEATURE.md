# Cart "Try On" Button Feature

## Visual Layout

### Before (No Try On Button)
```
┌────────────────────────────────────────────────────────┐
│ Your cart                                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Essentials Cotton Hoodie           ₹2,999             │
│ Size M                              Remove             │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Essentials Cotton Hoodie           ₹2,999             │
│ Size L                              Remove             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### After (With Try On Button)
```
┌────────────────────────────────────────────────────────┐
│ Your cart                                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Essentials Cotton Hoodie           ₹2,999             │
│ Size M                      [Try On]  Remove           │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Essentials Cotton Hoodie           ₹2,999             │
│ Size L                      [Try On]  Remove           │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Bose QC Headphones                 ₹7,900             │
│ Size N/A                            Remove             │
│                                                        │
└────────────────────────────────────────────────────────┘
        ↑ No Try On button for non-apparel
```

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 1: Browse Cart                      │
│                                                             │
│  User is on Prevention tab (cart)                           │
│  Sees items they added                                      │
│  Notices "Try On" button on apparel items                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Step 2: Click Try On                     │
│                                                             │
│  User clicks "Try On" for "Essentials Cotton Hoodie"        │
│  Button highlights on hover (light blue background)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Step 3: Navigate to VTO Tab                 │
│                                                             │
│  Automatically switches to VTO tab                          │
│  "Essentials Cotton Hoodie" is pre-selected                 │
│  Ready to upload photo                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Step 4: Upload & Generate                  │
│                                                             │
│  User uploads their photo (or uses camera)                  │
│  Product is already selected from cart                      │
│  Clicks "Generate Try-On"                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Step 5: View Result                      │
│                                                             │
│  ✅ VTO generates successfully (authenticated)              │
│  See how hoodie looks on them                               │
│  View fit analysis, size match, return risk                 │
│  Make informed purchase decision                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Code Structure

### Cart Item Layout
```typescript
<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
  {/* Left: Product Info */}
  <div style={{ flex: 1 }}>
    <strong>Essentials Cotton Hoodie</strong>
    <div>Size M</div>
  </div>
  
  {/* Right: Price & Actions */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div>
      <div>₹2,999</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Try On Button (only for apparel) */}
        {isApparelProduct(item.name) && (
          <button onClick={() => tryOnProduct(item.name)}>
            Try On
          </button>
        )}
        {/* Remove Button */}
        <button onClick={() => removeFromCart(idx)}>
          Remove
        </button>
      </div>
    </div>
  </div>
</div>
```

## Button Styling

### Default State
```css
border: 1px solid #007185;
background: #FFF;
color: #007185;
font-size: 0.75rem;
padding: 0.25rem 0.5rem;
border-radius: 4px;
font-weight: 600;
cursor: pointer;
```

### Hover State
```css
background: #F0F8FF;  /* Light blue */
```

## Apparel Detection Logic

```typescript
function isApparelProduct(productName: string): boolean {
  return /hoodie|shirt|jacket|jeans|cotton|t-shirt|sweater|dress|pants|clothing/i.test(productName);
}
```

### Examples

| Product Name | Is Apparel? | Shows Button? |
|--------------|-------------|---------------|
| Essentials Cotton Hoodie | ✅ Yes | ✅ Yes |
| Black Leather Jacket | ✅ Yes | ✅ Yes |
| Denim Jeans | ✅ Yes | ✅ Yes |
| Cotton T-Shirt | ✅ Yes | ✅ Yes |
| Bose QC Headphones | ❌ No | ❌ No |
| iPhone 14 Pro Max | ❌ No | ❌ No |
| Apple Watch | ❌ No | ❌ No |

## State Management

### Global State (AppContext)
```typescript
// Shared between Prevention (cart) and VTO views
const [selectedVTOProduct, setSelectedVTOProduct] = useState<string>('');
```

### Prevention View (Cart)
```typescript
const tryOnProduct = (productName: string) => {
  // Set which product to try on
  setSelectedVTOProduct(productName);
  
  // Navigate to VTO tab
  setActiveTab('vto');
};
```

### VTO View
```typescript
useEffect(() => {
  // Check if coming from cart with pre-selected product
  if (selectedVTOProduct && catalogItems.length > 0) {
    // Auto-select that product
    setSelectedSku(selectedVTOProduct);
    
    // Clear it so it doesn't persist on next visit
    setSelectedVTOProduct('');
  }
}, [selectedVTOProduct, catalogItems]);
```

## API Authentication Flow

### When User Clicks "Generate Try-On"

```
1. Frontend: Create FormData
   ├─ photo: File (JPEG/PNG)
   ├─ product_id: "Essentials Cotton Hoodie"
   ├─ height_cm: "170"
   └─ target_size: "M"

2. Frontend: Call authFetch
   authFetch('/api/vto/generate', {
     method: 'POST',
     body: formData,
     headers: {}  // Empty, let browser set multipart headers
   })

3. AuthContext: Detect FormData
   if (options.body instanceof FormData) {
     // Skip Content-Type
     // Browser will set: multipart/form-data; boundary=...
   }

4. AuthContext: Add Authorization
   headers['Authorization'] = `Bearer ${token}`

5. Backend: Receive Request
   Headers:
   ├─ Authorization: Bearer eyJ0eXAi...
   └─ Content-Type: multipart/form-data; boundary=----WebKit...

6. Backend: Validate Token
   ├─ Extract from Authorization header
   ├─ Decode JWT
   ├─ Check expiration
   └─ ✅ Valid → Process request

7. Backend: Process VTO
   ├─ Extract photo from FormData
   ├─ Load product info
   ├─ Run VTO model
   └─ Return result

8. Frontend: Display Result
   ├─ Show try-on image
   ├─ Display fit analysis
   └─ Show size recommendations
```

## Error Handling

### No Photo Uploaded
```typescript
if (!userFile && !userImage) {
  alert('Please add a photo and select a product.');
  return;
}
```

### No Product Selected
```typescript
if (!selectedSku) {
  alert('Please add a photo and select a product.');
  return;
}
```

### API Failure
```typescript
try {
  // Primary endpoint with full VTO
  const resp = await authFetch('/api/vto/generate', ...);
  // Handle success
} catch (err) {
  // Fallback to legacy endpoint
  const resp = await authFetch('/api/v1/ml/vto/drape', ...);
  // Handle fallback result
}
```

### Authentication Failure
If API returns 401:
1. Token might be expired
2. User needs to re-login
3. AuthContext will redirect to login page

## Testing Checklist

### ✅ Cart Integration
- [ ] "Try On" button appears for apparel items
- [ ] No button for non-apparel items (headphones, phones)
- [ ] Button has correct styling (blue border, white background)
- [ ] Hover effect works (light blue background)
- [ ] Clicking button navigates to VTO tab

### ✅ VTO Pre-Selection
- [ ] Product from cart is pre-selected in VTO
- [ ] Product name matches exactly
- [ ] Can still manually change product if needed
- [ ] Pre-selection doesn't persist after leaving VTO

### ✅ VTO Authentication
- [ ] Photo upload works without 401 errors
- [ ] VTO generation succeeds with authenticated request
- [ ] Authorization header is present in request
- [ ] FormData multipart boundary is correct
- [ ] Backend validates token successfully

### ✅ User Experience
- [ ] Smooth navigation from cart to VTO
- [ ] No page reload or flash
- [ ] Product info carries over correctly
- [ ] Can return to cart and try different product
- [ ] Error messages are clear and helpful

## Success Metrics

When working correctly:
- ✅ 0 authentication errors (no 401s)
- ✅ 100% of apparel items show Try On button
- ✅ 0% of non-apparel items show Try On button
- ✅ VTO generation succeeds on first try
- ✅ User can try on multiple products in same session
