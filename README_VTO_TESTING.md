# 🎯 Virtual Try-On Testing Guide

## ✅ System Status

**Backend**: Running on `http://127.0.0.1:8000`  
**Frontend**: Running on `http://localhost:5173`  
**VTO Engine**: IDM-VTON API (State-of-the-art quality)

## 🚀 Quick Test (5 Minutes)

### Step 1: Get Test Photo
Download this professional model photo (best results):
```
https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80
```
Or use your webcam in the app.

### Step 2: Access VTO
1. Open: `http://localhost:5173`
2. Click: **Try Before You Buy** (left sidebar)
3. You'll see purple "Kolors AI Virtual Try-On Enabled" banner

### Step 3: Generate Try-On
1. Click **"Upload"** → select your downloaded photo
2. Enter height: `175` cm
3. Select size: `M`
4. Click product: **"Black Leather Jacket"**
5. Click: **"Generate try-on"**
6. Wait 20-30 seconds (first time may take longer)

### Step 4: View Result
You should see:
- ✅ Black leather jacket realistically draped on person
- ✅ Natural wrinkles, shadows, lighting
- ✅ Face and background preserved
- ✅ Fit analysis card with size match percentage
- ✅ Badge: "IDM-VTON" (high quality AI)

## 📦 Available Products

| Product | Best For | MSRP |
|---------|----------|------|
| **Black Leather Jacket** | VTO Testing | ₹8,999 |
| Essentials Cotton Hoodie | Casual wear VTO | ₹2,999 |
| Bose QC Headphones | Accessories | ₹7,900 |
| iPhone 14 Pro Max | Electronics | ₹95,000 |

## 🎨 What You'll See

### Loading States
```
📸 Processing your photo...
📏 Estimating body measurements...
🤖 Initializing Kolors AI Virtual Try-On...
✨ Virtual try-on complete!
⚡ Powered by IDM-VTON
```

### Result Display
- High-quality try-on image
- Fit analysis card showing:
  - Size match percentage (e.g., 87%)
  - Stress points (shoulders, chest)
  - Return risk estimate
  - Recommended size
- Model badge indicating AI engine used

## 🔧 Configuration

### Current Settings (`.env`)
```bash
VTO_USE_KOLORS=1              # Enabled
VTO_USE_IDM=1                 # Using IDM-VTON API
VTO_USE_HF_RMBG=1             # Background removal
VTO_USE_DEMO_GARMENT=0        # Real products only
IDM_VTON_TIMEOUT_SEC=30       # API timeout
```

### Performance
- **First Request**: 30-60 seconds (Space wakeup)
- **Subsequent Requests**: 15-25 seconds
- **Cached Results**: Instant
- **Quality**: Photorealistic

## 🐛 Common Issues

### Issue: "First request is slow"
**Cause**: HuggingFace Space needs to wake up  
**Solution**: Normal behavior, wait 60s on first try

### Issue: "Using fallback overlay engine"
**Cause**: API timeout or Space sleeping  
**Solution**: Try again after 1 minute

### Issue: "Still seeing demo graphics"
**Cause**: Browser cache  
**Solution**: Hard refresh (`Ctrl+F5`)

### Issue: "No products showing"
**Cause**: Backend not running  
**Solution**: Check `http://127.0.0.1:8000/health`

## 📊 Quality Comparison

### IDM-VTON (Current)
- ✅ Photorealistic garment draping
- ✅ Accurate colors and textures
- ✅ Natural wrinkles and folds
- ✅ Proper lighting and shadows
- ✅ Face and background preserved
- ⏱️ 15-30s processing time

### Local Overlay (Fallback)
- ⚠️ Simple 2D overlay
- ⚠️ No wrinkle simulation
- ⚠️ Basic transparency
- ⚠️ Limited realism
- ⏱️ 2-5s processing time

## 🎯 Best Practices

### For Best Results:
1. **Person Photo**:
   - Front-facing, standing straight
   - Arms at sides
   - Clear background
   - Good lighting
   - At least 512x512 resolution

2. **Product Selection**:
   - Black Leather Jacket works best
   - Apparel items get AI processing
   - Non-apparel uses overlay

3. **First-Time Users**:
   - Expect 30-60s on very first try
   - Subsequent tries are faster (15-25s)
   - Results are cached for identical requests

## 📝 Technical Details

### API Flow
```
User Upload
    ↓
Body Measurement Estimation (MediaPipe/Heuristic)
    ↓
Fit Score Calculation (Size Charts)
    ↓
IDM-VTON API Call (HuggingFace Space)
    ↓
Result Caching (MD5 hash)
    ↓
Display Result
```

### Caching
- Cache Key: MD5(photo + product_id + height + size)
- Storage: In-memory dictionary
- Benefit: Instant results for repeat requests

### Fallback Chain
1. IDM-VTON API (primary)
2. Local overlay (always available)

## 🔗 Resources

- **VTO Test Images**: See `VTO_TEST_IMAGES.md`
- **Setup Guide**: See `KOLORS_VTO_README.md`
- **Implementation Guide**: See `VTO_IMPLEMENTATION_GUIDE.md`
- **Fix Details**: See `KOLORS_VTO_FIX.md`

---

**Ready to test!** Open `http://localhost:5173` and navigate to the VTO tab. 🚀
