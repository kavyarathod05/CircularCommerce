# Quick Start Guide - SecondLife Commerce

## 🚀 Start the Application

### 1. Start Backend (Terminal 1)
```bash
cd backend\ml-service
uvicorn main:app --reload --port 8000
```

**Wait for:**
```
INFO:     Application startup complete.
```

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

**Open:** http://localhost:5173

## ✅ Test the Fixes

### Test 1: Login (30 seconds)
1. Open app in browser
2. Click "Register"
3. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - Role: `buyer`
4. Click "Register"
5. **✅ Success:** Redirected to Catalog

### Test 2: Catalog (10 seconds)
1. Should automatically be on Catalog tab
2. **✅ Success:** Products load (no 401 errors)
3. Browser console shows: `GET /catalog → 200 OK`

### Test 3: Cart Try-On Button (20 seconds)
1. Click "Prevention" tab (cart icon)
2. Look at "Essentials Cotton Hoodie"
3. **✅ Success:** "Try On" button appears next to "Remove"
4. Look at other items (if any)
5. Non-apparel items have no "Try On" button

### Test 4: Try On from Cart (60 seconds)
1. In cart, click "Try On" on hoodie
2. **✅ Success:** Navigates to VTO tab
3. **✅ Success:** Hoodie is pre-selected
4. Click "Use Camera" or "Upload"
5. Upload a photo of yourself
6. Click "Generate Try-On"
7. **✅ Success:** VTO generates (no 401 errors)
8. **✅ Success:** See try-on result with fit analysis

### Test 5: Network Tab Check (15 seconds)
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Click "Try On" and generate VTO
4. Look at `/api/vto/generate` request
5. **✅ Success:** Has `Authorization: Bearer ...` header
6. **✅ Success:** Returns 200 OK

## 🎯 Quick Verification Checklist

| Feature | Expected Result | Status |
|---------|----------------|--------|
| Backend starts | No errors, shows "Application startup complete" | ⬜ |
| Frontend starts | Opens in browser at localhost:5173 | ⬜ |
| Login works | Redirects to main app after login | ⬜ |
| Catalog loads | Products display, no 401 errors | ⬜ |
| Cart displays | Can view cart items | ⬜ |
| Try On button | Shows on apparel items only | ⬜ |
| Pre-selection | Product selected when navigating from cart | ⬜ |
| VTO upload | Photo upload works | ⬜ |
| VTO generate | Creates try-on image successfully | ⬜ |
| Auth headers | All requests have Authorization header | ⬜ |
| No 401 errors | Console is clear of authentication errors | ⬜ |

## 🔍 Troubleshooting

### Backend won't start
```bash
# Install missing dependencies
pip install passlib python-jose PyJWT
```

### Frontend errors on npm run dev
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Still getting 401 errors
1. **Check token:** Open DevTools → Application → Local Storage → `secondlife_jwt`
2. **If missing:** Logout and login again
3. **Check expiration:** Token expires after 24 hours
4. **Hard refresh:** Ctrl+Shift+R or Cmd+Shift+R

### Try On button not showing
1. **Check product name:** Must contain apparel keywords (hoodie, shirt, jacket)
2. **Check tab:** Must be on Prevention (cart) tab
3. **Check cart:** Item must be in cart

### VTO fails to generate
1. **Check backend logs:** Look for error messages
2. **Check network tab:** Verify 200 OK response
3. **Check file size:** Photo should be <10MB
4. **Try fallback:** System will retry with fallback endpoint

## 📊 Success Metrics

When everything is working:
- ✅ Backend: http://127.0.0.1:8000/health returns `{"status":"ML Microservice is ALIVE"}`
- ✅ Frontend: No 401 errors in console
- ✅ Frontend: All tabs load data
- ✅ VTO: Generates successfully with authentication
- ✅ Cart: Try On button works

## 🎨 What You Should See

### Cart with Try On Button
```
┌─────────────────────────────────────────────┐
│ Cart & Checkout                             │
├─────────────────────────────────────────────┤
│ Your cart                                   │
│                                             │
│ Essentials Cotton Hoodie    ₹2,999         │
│ Size M              [Try On] Remove         │
│                     ^^^^^^^^ NEW!           │
│                                             │
│ Bose QC Headphones          ₹7,900         │
│ Size N/A                    Remove          │
│                    (no Try On button)       │
└─────────────────────────────────────────────┘
```

### VTO Tab with Pre-Selected Product
```
┌─────────────────────────────────────────────┐
│ Virtual Try-On                              │
├─────────────────────────────────────────────┤
│ Select Product                              │
│                                             │
│ [Essentials Cotton Hoodie] ← Selected!     │
│ [iPhone 14 Pro Max]                         │
│ [Bose QC Headphones]                        │
│                                             │
│ Your Photo                Preview           │
│ ┌─────────┐       ┌─────────┐              │
│ │ Upload  │       │ Try-On  │              │
│ │ Photo   │       │ Result  │              │
│ └─────────┘       └─────────┘              │
└─────────────────────────────────────────────┘
```

## 📱 Mobile Testing

All features work on mobile:
1. Open http://localhost:5173 on phone (same network)
2. Login with test account
3. Add items to cart
4. Try On button works
5. Can use mobile camera for VTO
6. Responsive layout adjusts

## 🔐 Security Notes

- JWT tokens expire after 24 hours
- Tokens stored in browser localStorage
- All API requests require authentication
- CORS enabled for development
- Production should use HTTPS

## 📚 Documentation Files

Detailed guides available:
- `COMPLETE_FIX_SUMMARY.md` - All fixes overview
- `VTO_CART_INTEGRATION_FIX.md` - VTO integration details
- `CART_TRY_ON_FEATURE.md` - Try On button feature
- `AUTHENTICATION_TEST_GUIDE.md` - Testing procedures
- `AUTH_FLOW_DIAGRAM.md` - Authentication flow diagrams

## 💡 Tips

1. **Keep backend running** while developing frontend
2. **Check console** for any errors during development
3. **Use DevTools Network tab** to debug API calls
4. **Clear localStorage** if token gets corrupted
5. **Hard refresh** if seeing stale data

## 🎉 Success!

If all tests pass, you have:
- ✅ Working authentication system
- ✅ Functional VTO with file uploads
- ✅ Cart integration with Try On button
- ✅ Seamless user experience
- ✅ Proper API security
