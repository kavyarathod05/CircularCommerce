# Virtual Try-On Test Images

## ✅ Sample Person Photos (for uploading)

### Best Quality Person Images for VTO Testing

#### Option 1: Professional Model Photo (RECOMMENDED)
**Best for**: Black Jacket Try-On
- **Download Link**: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80
- **Description**: Male model, front-facing, neutral background, good lighting
- **Why it works**: Clear body outline, straight pose, visible shoulders and torso
- **Direct Download**: Right-click and save as `person-model-1.jpg`

#### Option 2: Casual Portrait
**Best for**: Hoodie Try-On
- **Download Link**: https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80
- **Description**: Male, casual, front-facing, clean background
- **Why it works**: Relaxed pose, clear body structure

#### Option 3: Professional Woman
**Best for**: Jacket/Blazer Try-On
- **Download Link**: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80
- **Description**: Female model, professional look, neutral background
- **Why it works**: Clear shoulders, straight posture, good lighting

#### Option 4: Young Adult Male
**Best for**: General Apparel
- **Download Link**: https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80
- **Description**: Young male, gray background, professional
- **Why it works**: Perfect frontal pose, clear body outline

## 📦 Product Images (Already in Catalog)

### Black Leather Jacket
- **URL**: https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800
- **In Catalog**: ✅ Yes (lst-demo-3)
- **GTIN**: 00819264088945
- **Brand**: Urban Essentials
- **Price**: ₹8,999 (Grade A)

### Essentials Cotton Hoodie
- **URL**: https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800
- **In Catalog**: ✅ Yes (lst-demo-2)

## 🎯 Quick Test Instructions

### Step 1: Download a Person Photo
1. Open one of the person photo links above (Option 1 recommended)
2. Right-click → Save image as → `test-person.jpg`
3. Save to your Downloads folder or Desktop

### Step 2: Access VTO Interface
1. Open browser: `http://localhost:5173`
2. Select role: **Buyer**
3. Click: **Try Before You Buy** tab

### Step 3: Generate Try-On
1. Click "Upload" button
2. Select the person photo you downloaded
3. Enter your height (e.g., 170 cm)
4. Select size: M or L
5. Click on "Black Leather Jacket" product card
6. Click "Generate try-on"
7. Wait 15-30 seconds for Kolors AI to process

## 💡 Tips for Best Results

### Person Photo Requirements
✅ **DO**:
- Use front-facing photos
- Clear, well-lit background
- Person standing straight
- Arms at sides or slightly away from body
- Full upper body visible (at least to waist)
- High resolution (at least 512x512)

❌ **DON'T**:
- Side profiles or angled shots
- Busy/cluttered backgrounds
- Poor lighting or shadows
- Arms crossed or hidden
- Low resolution images
- Already wearing heavy jackets

### For Black Jacket Specifically
- Lighter colored clothing underneath works best
- Clear shoulder and chest area
- Standing straight posture
- Neutral or solid color background

## 🔗 Direct Download Commands

### Using PowerShell (Windows)
```powershell
# Download person photo
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" -OutFile "vto-test-person.jpg"

# Download alternative
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80" -OutFile "vto-test-person-2.jpg"
```

### Using curl (if available)
```bash
curl "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" -o vto-test-person.jpg
```

## 📊 Expected Results

### With Kolors AI (Enabled)
- **Processing Time**: 15-30 seconds
- **Quality**: Photorealistic garment draping
- **Model Badge**: "⚡ KOLORS AI"
- **Features**: 
  - Natural wrinkles and folds
  - Accurate color and texture
  - Proper garment fit
  - Preserved face and background

### With Local Overlay (Fallback)
- **Processing Time**: 2-5 seconds
- **Quality**: Basic overlay
- **Model Badge**: "LOCAL OVERLAY"
- **Features**:
  - Simple garment placement
  - Basic transparency
  - No wrinkle simulation

## 🎨 Sample Expected Output

```
┌─────────────────────────────────────┐
│  [Person Photo with Black Jacket]  │
│                                     │
│  Fit Analysis:                      │
│  ├─ Size Match: 87%                 │
│  ├─ Stress: shoulders, chest        │
│  └─ Return Risk: 4%                 │
│                                     │
│  Engine: kolors-vto-api             │
│  ⚡ KOLORS AI                        │
└─────────────────────────────────────┘
```

## 🐛 Troubleshooting

### "First request takes 30-60 seconds"
- **Normal**: HuggingFace Space needs to wake up
- **Solution**: Be patient on first try, subsequent tries are faster

### "Using fallback overlay engine"
- **Cause**: Kolors API timeout or error
- **Result**: Still works, but lower quality
- **Solution**: Try again, Space may be sleeping

### "Poor quality results"
- **Check**: Person photo quality (resolution, lighting, pose)
- **Check**: Product image has clear garment outline
- **Try**: Different person photo from list above

## 📸 Alternative Test Images

### From Your Webcam
1. Use the "Camera" button in VTO interface
2. Position yourself front-facing
3. Good lighting from front
4. Solid color background if possible
5. Click "Capture"

---

**Pro Tip**: Option 1 (photo-1507003211169) typically gives the BEST results for jacket try-ons!
