# UX Innovation & Interface Design

To satisfy the jury's visual evaluation criteria, the SecondLife Commerce frontend incorporates dynamic, premium design components that move past static forms.

---

## 1. Customer & Seller Portals

### 1.1 Customer Dashboard
- **Active Returns Timeline**: Live visual tracking of returns in progress.
- **Carbon Impact Metrics**: Displays user's total CO₂ avoided in kilograms, tree-equivalent points, and comparative distance offsets (e.g. "equivalent to not driving 120km").
- **Eco-Points Wallet**: Displays gamified reward tier (Green Starter, Eco Warrior, Planet Champion) and redeemable credit balance.
- **History Map**: A visual map showing where returned items went (e.g. matched to a local neighbor or drop-off kiosk).

### 1.2 Seller & Admin Dashboard
- **Telemetry Charts**: High-density graphs showing cumulative recovery value, warehouse avoidance rates, and carbon certificates issued.
- **Consolidation Node Manifests**: Lists scheduled weekly bulk pickups for warehouse operations.
- **Listing Copy Approval**: Interface to review, edit, and approve Bedrock-generated open-box listing descriptions.

---

## 2. Interactive Return Wizard

- **Single-Screen Ingestion**: One-tap return selection with interactive swipeable reason carousels.
- **AI Inspection Preview**: Real-time progress tracker with updates:
  > `"Analyzing cosmetic state... ✓"`  
  > `"Validating product tags... ✓"`  
  > `"Hashing condition report... ✓"`  
- **Interactive Damage Heatmap**: Displays uploaded photos with clickable bounding boxes highlighting scratch/crack locations and severity ratings.
- **Live Routing Visibility**: Visual map showing the proposed route of the product (Customer → Local Locker / Local Buyer) before the customer confirms submission.

---

## 3. Product Health Card

Used on the open-box marketplace to eliminate buyer hesitation regarding secondhand item conditions:

```
┌─────────────────────────────────────────┐
│  PRODUCT HEALTH CARD                    │
│  AI-Verified | Certificate #INS-001     │
├─────────────────────────────────────────┤
│  Condition Grade:  ██████░░░░  B/Good   │
│  Cosmetic:         Minor scratch (3/10) │
│  Functional:       Fully operational    │
│  Packaging:        Original intact      │
│  Fraud Check:      ✓ Passed             │
├─────────────────────────────────────────┤
│  History:  Purchased → Returned (fit)   │
│            AI Inspected → Routed        │
│  [Scan QR to verify certificate]        │
└─────────────────────────────────────────┘
```

### Components
- **Visual Condition Meter**: Color-coded slide bar (A: Green, B: Yellow, C: Orange, D: Red).
- **Damage Map**: Annotations showing exactly where flaws are on the product.
- **Pricing Rationale**: Algorithmic breakdown justifying the open-box discount (e.g. "20% off original price: 15% cosmetic grade B, 5% packaging damage").
- **QR Code Verification**: Direct link to the KMS-signed validation certificate hosted on S3.

---

## 4. Gamification, Rewards & Referrals

- **Eco-Points Flywheel**: Points are awarded per action (e.g., +50 points for choosing locker drop-off, +100 points for a P2P neighbor handoff).
- **Leaderboards**: Friendly local rankings showing top carbon-saving neighbors.
- **Green Credits**: Restricted currency awarded during the Keep-and-Credit flow. Redeemable *exclusively* for open-box listings to eliminate cash-out exploits.
- **Partner Incentives**: Redundant or low-value items are exchanged for gift cards from local sustainable brands or tree-planting organizations.
