# VTO & Cart Integration Fix Summary

## Issues Fixed

### 1. Virtual Try-On API Authentication (401 Errors)
**Problem:** VTO API calls were failing with 401 Unauthorized because they weren't using authenticated requests.

**Solution:** Updated VTOView to use `authFetch` from AuthContext for all API calls.

### 2. FormData Authentication Support
**Problem:** The VTO endpoint `/api/vto/generate` accepts FormData (file upload), but `authFetch` was always setting `Content-Type: application/json`, which breaks multipart uploads.

**Solution:** Enhanced `authFetch` in AuthContext to detect FormData and skip setting Content-Type header, allowing the browser to set it correctly with the multipart boundary.

### 3. Cart "Try On" Button
**Problem:** No way to try on items directly from the cart.

**Solution:** 
- Added "Try On" button for apparel items in the cart (Prevention view)
- Button navigates to VTO tab and pre-selects that product
- Uses state management to pass the selected product between views

## Files Modified

### 1. `frontend/src/context/AuthContext.tsx`
Enhanced `authFetch` to handle FormData properly:

```typescript
const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  
  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Only add Content-Type if not FormData and not already set
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }
  
  return fetch(url, { ...options, headers });
}, []);
```

### 2. `frontend/src/views/VTOView.tsx`
- Added `useAuth` import to access `authFetch`
- Updated `/api/vto/generate` call to use `authFetch`
- Updated `/api/v1/ml/vto/drape` fallback to use `authFetch`
- Added support for pre-selected product from cart

**API Calls Updated:**
```typescript
// Main VTO endpoint (FormData)
const resp = await authFetch(`${mlApiUrl}/api/vto/generate`, { 
  method: 'POST', 
  body: formData,
  headers: {} // Let browser set Content-Type with multipart boundary
});

// Fallback endpoint (JSON)
const resp = await authFetch(`${mlApiUrl}/api/v1/ml/vto/drape`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_image_base64: b64, clothing_sku: selectedSku }),
});
```

### 3. `frontend/src/App.tsx`
- Added `selectedVTOProduct` state to track which product to try on
- Added it to context value for sharing between components

```typescript
const [selectedVTOProduct, setSelectedVTOProduct] = useState<string>('');
```

### 4. `frontend/src/views/PreventionView.tsx`
- Added "Try On" button for each apparel item in cart
- Button checks if product is apparel (hoodie, shirt, jacket, etc.)
- Clicking button sets `selectedVTOProduct` and navigates to VTO tab

```typescript
const tryOnProduct = (productName: string) => {
  setSelectedVTOProduct(productName);
  setActiveTab('vto');
};
```

## How It Works

### Cart → VTO Flow

1. **User views cart** (Prevention tab)
2. **Clicks "Try On"** button on an apparel item
3. **App sets** `selectedVTOProduct` to that item's name
4. **Navigates** to VTO tab
5. **VTOView reads** `selectedVTOProduct` from context
6. **Auto-selects** that product in the VTO interface
7. **Clears** `selectedVTOProduct` so it doesn't persist

### Authentication Flow

1. **User uploads photo** in VTO
2. **Clicks "Generate Try-On"**
3. **Frontend creates FormData** with photo + product info
4. **Calls authFetch** with FormData body
5. **authFetch detects FormData** and skips Content-Type header
6. **Browser sets** `Content-Type: multipart/form-data; boundary=...`
7. **authFetch adds** `Authorization: Bearer <token>` header
8. **Backend receives** authenticated multipart request
9. **Validates token** and processes VTO
10. **Returns result** to frontend

## Testing Guide

### Test 1: VTO from Catalog
1. Login as buyer
2. Navigate to "VTO" tab
3. Upload a photo (or use camera)
4. Select any product
5. Click "Generate Try-On"
6. **Expected:** VTO generates successfully (no 401 errors)

### Test 2: Try On from Cart
1. Login as buyer
2. Navigate to "Prevention" tab (cart)
3. Find an apparel item (Hoodie, Shirt, etc.)
4. Click the "Try On" button
5. **Expected:**
   - Navigates to VTO tab
   - That product is pre-selected
   - Can upload photo and generate try-on

### Test 3: Non-Apparel Items
1. In cart, look at non-apparel items (Headphones, Phone, etc.)
2. **Expected:** No "Try On" button shows (only for apparel)

## Button Appearance

The "Try On" button appears with:
- **Border:** Light blue (`#007185`)
- **Background:** White
- **Text:** Blue (`#007185`)
- **Hover:** Light blue background (`#F0F8FF`)
- **Position:** Next to "Remove" button
- **Size:** Small, compact (0.75rem font)

## Apparel Detection

Products are considered "apparel" if their name matches:
```typescript
/hoodie|shirt|jacket|jeans|cotton|t-shirt|sweater|dress|pants|clothing/i
```

This pattern detects:
- ✅ "Essentials Cotton Hoodie" → Shows Try On button
- ✅ "Black Leather Jacket" → Shows Try On button
- ✅ "Denim Jeans" → Shows Try On button
- ❌ "Bose QC Headphones" → No Try On button
- ❌ "iPhone 14 Pro Max" → No Try On button

## API Endpoints Protected

Both VTO endpoints now require authentication:

1. **Primary:** `POST /api/vto/generate`
   - Accepts: FormData (multipart)
   - Returns: Full VTO result with fit analysis

2. **Fallback:** `POST /api/v1/ml/vto/drape`
   - Accepts: JSON with base64 image
   - Returns: Basic VTO result

## Browser Console Checks

### Success Indicators:
```
POST http://127.0.0.1:8000/api/vto/generate → 200 OK
✓ Authorization header present
✓ Content-Type: multipart/form-data; boundary=...
```

### Network Tab (Request Headers):
```
Authorization: Bearer eyJ0eXAi...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

## Common Issues & Solutions

### Issue: Still getting 401 on VTO
**Check:**
1. User is logged in (token in localStorage)
2. VTOView is using `authFetch` not plain `fetch`
3. Token hasn't expired

### Issue: FormData upload fails
**Check:**
1. `authFetch` is NOT setting `Content-Type` for FormData
2. Browser is auto-setting multipart boundary
3. Backend accepts multipart/form-data

### Issue: "Try On" button doesn't appear
**Check:**
1. Product name contains apparel keywords
2. Button is only for apparel items
3. Item is in the cart (Prevention tab)

### Issue: Product not pre-selected in VTO
**Check:**
1. `selectedVTOProduct` state is being set
2. VTOView is reading from context
3. Product name matches catalog item's productId

## Design Notes

- **Try On button** is positioned inline with Remove button
- Only appears for apparel products (prevents confusion)
- Uses Amazon-style blue color scheme
- Hover effect provides visual feedback
- Compact size doesn't clutter the cart UI

## Future Enhancements

Possible improvements:
1. Add product thumbnail in VTO view
2. Remember last uploaded photo for quick retries
3. Show "Recently tried on" products
4. Add size recommendation badge in cart
5. Bulk try-on for multiple items
