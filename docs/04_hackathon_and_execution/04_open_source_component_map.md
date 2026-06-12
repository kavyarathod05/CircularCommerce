# Open-Source Component Map & Integration Guide

To maximize development speed during a 48-hour hackathon, we utilize proven open-source solutions for non-core capabilities, adapting them to connect with our core P2P Intercept and Triage engines.

---

## 1. Frontend & UI Foundations

### 1.1 Storefront: Second-Life Marketplace UI
- **Repository**: [vercel/commerce](https://github.com/vercel/commerce)
- **Component to Import**: Next.js e-commerce storefront structure (product cards, cart context, checkout page layouts).
- **Integration Instruction**:
  1. Wipe out default mock catalog datasets.
  2. Map listing cards to retrieve active items from the OpenSearch `listing` index.
  3. Ensure that when an item is graded "Excellent" by Bedrock, it auto-registers as a listing page here.
- **Role in Solution**: Client-facing secondhand resale portal.

### 1.2 Telemetry & Admin UI
- **Repository**: [tremorlabs/tremor](https://github.com/tremorlabs/tremor)
- **Component to Import**: High-density dashboard templates, carbon counter widgets, KPI grids, and area charts.
- **Integration Instruction**:
  1. Set up the dashboard shell inside `/frontend/admin`.
  2. Connect widgets to fetch data from `/v1/analytics/seller/{id}/dashboard` and `/v1/carbon/platform/summary`.
  3. Populate charts representing real-time carbon offsets and recaptured capital.
- **Role in Solution**: Seller dashboard and platform admin cockpit.

### 1.3 Primitive UI Components
- **Repository**: [shadcn-ui/ui](https://github.com/shadcn-ui/ui)
- **Component to Import**: Component primitives (dialogs, cards, badges, progress bars, layout tabs).
- **Integration Instruction**:
  1. Copy-paste Tailwind configurations and primitive code.
  2. Implement the Product Health Card, progress indicators for the AI return wizard, and trust badges.
- **Role in Solution**: Basic styling blocks across all user views.

### 1.4 Mobile Return Flow Layouts
- **Repository**: [adrianhajdin/ecommerce](https://github.com/adrianhajdin/ecommerce)
- **Component to Import**: Mobile-first product detail layout, swipeable carousels, action sheets.
- **Integration Instruction**:
  1. Extract the order details template to construct the return wizard.
  2. Hook the reason selection carousel and multipart file uploader triggers.
- **Role in Solution**: Mobile customer return interface.

---

## 2. AI, Grading & Computer Vision

### 2.1 Multimodal Ingestion Reference
- **Repository**: [openai/openai-cookbook](https://github.com/openai/openai-cookbook) (Vision Examples)
- **Component to Import**: Image-to-base64 converter pipelines, multipart image buffers, vision API client setup.
- **Integration Instruction**:
  1. Implement base64 encoding client-side for low-latency transmission.
  2. Construct system prompts mapping strictly to JSON schemas.
- **Role in Solution**: Streamlines photo transmission to Bedrock.

### 2.2 Damage Detection Bounding Box Annotation
- **Repository**: [ultralytics/ultralytics](https://github.com/ultralytics/ultralytics) (YOLOv8)
- **Component to Import**: Bounding box coordinate extraction methodologies.
- **Integration Instruction**:
  1. Do NOT run YOLO models or train custom image detection models.
  2. Extract damage coordinates returned by the Bedrock JSON response (`severity`, `location`, `description`).
  3. Render client-side overlay box highlights on product images using HTML5 Canvas.
- **Role in Solution**: Blemish highlights shown on the Product Health Card.

### 2.3 Product Risk Classification
- **Repository**: [GiorgiModebadze/Customer-returns-prediction](https://github.com/GiorgiModebadze/Customer-returns-prediction)
- **Component to Import**: Return prediction features (category indices, size metrics, purchase history parameters).
- **Integration Instruction**:
  1. Scrape tabular weights from this repository.
  2. Package them inside a Python/FastAPI helper running on AWS Lambda.
  3. Feed the resulting risk coefficients into the Prevention Service.
- **Role in Solution**: Return probability scoring before checkout.

---

## 3. Geospatial & Proximity Routing

### 3.1 Proximity Mapping & Route Rendering
- **Repository**: [mapbox/mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
- **Component to Import**: Interactive map containers, distance radius queries, marker pinning.
- **Integration Instruction**:
  1. Embed the map in the Return Wizard.
  2. Swap Tile Server endpoints to use Amazon Location Service maps for AWS compliance.
  3. Draw a 2km radius overlay highlighting the consolidation drop locker or neighbor swap location.
- **Role in Solution**: P2P Intercept route visualization.

### 3.2 Location Cluster Maps
- **Repository**: [Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)
- **Component to Import**: Marker clustering plugins.
- **Integration Instruction**:
  1. Implement marker clustering on the admin logistics view.
  2. Group nearby pending locker drop-offs into cluster nodes to schedule bulk weekly pickups.
- **Role in Solution**: Micro-consolidation locker monitoring.

---

## 4. Telemetry & Prevention Middleware

### 4.1 Session Dwell Time Tracking
- **Repository**: [gurbaaz27/amazon-hackathon](https://github.com/gurbaaz27/amazon-hackathon)
- **Component to Import**: Contextual Bandit middleware monitoring user click telemetry.
- **Integration Instruction**:
  1. Embed JS telemetry hooks (mouse hovers, scroll depth, variant selections) on the product page size chart.
  2. If a customer adds multi-size items to the cart, trigger the Prevention Service API.
- **Role in Solution**: Pre-checkout size validation warning.

### 4.2 Content Collaborative Filtering
- **Repository**: [microsoft/recommenders](https://github.com/microsoft/recommenders)
- **Component to Import**: Content-based filtering logic.
- **Integration Instruction**:
  1. Port content scoring schemas to query wishlist categories.
  2. Filter open-box listings local to the buyer before matching.
- **Role in Solution**: Second-life product recommendations.

---

## 5. Backend Serverless Orchestration

### 5.1 Serverless Application Scaffolding
- **Repository**: [aws-samples/serverless-patterns](https://github.com/aws-samples/serverless-patterns)
- **Component to Import**: EventBridge-to-Step-Functions CloudFormation/SAM templates.
- **Integration Instruction**:
  1. Copy SAM YAML files to wire `inspection.completed` to the Step Functions execution pipeline.
- **Role in Solution**: Infrastructure definition automation.

### 5.2 Go SDK Abstractions
- **Repository**: [google/go-cloud](https://github.com/google/go-cloud)
- **Component to Import**: Go cloud storage and messaging wrappers.
- **Integration Instruction**:
  1. Initialize S3 bucket and SQS handler clients in Go Lambda code using this abstraction layer.
- **Role in Solution**: Backend resource integration.

### 5.3 Long-Lived Step Function Sagas
- **Repository**: [aws-samples/aws-step-functions-long-lived-transactions](https://github.com/aws-samples/aws-step-functions-long-lived-transactions)
- **Component to Import**: Saga orchestration patterns (Step Function retry loops and fallbacks).
- **Integration Instruction**:
  1. Define fallback logic in JSON states: if a neighbor swap matches but expires (2 hours), trigger compensating rollback event.
  2. Rollback transitions state to Locker consolidation node, and then to Eco-Registry if locker is unavailable.
- **Role in Solution**: Return state management.

---

## 6. E-Commerce Resale & State Machines

### 6.1 Listing State Machine
- **Repository**: [sharetribe/sharetribe](https://github.com/sharetribe/sharetribe)
- **Component to Import**: Listing state flow (available → reserved → sold → expired).
- **Integration Instruction**:
  1. Port the state lifecycle transitions to DynamoDB transactions in the Marketplace Service.
- **Role in Solution**: P2P listing status control.

### 6.2 Condition Standards
- **Repository**: [eBay/ebay-sdk-python](https://github.com/eBay/ebay-sdk-python)
- **Component to Import**: eBay product condition taxonomies.
- **Integration Instruction**:
  1. Map the Bedrock AI inspection grade (A/B/C/D) to eBay condition labels to format open-box listings.
- **Role in Solution**: Secondhand buyer trust.

---

## 7. Sustainability Analytics

### 7.1 Emission Factor Constants
- **Repository**: [thegreenwebfoundation/co2.js](https://github.com/thegreenwebfoundation/co2.js)
- **Component to Import**: Travel emission database factors (grams of CO₂ per kilometer per vehicle type).
- **Integration Instruction**:
  1. Port the transport constants into your Go Carbon Service calculations.
- **Role in Solution**: Carbon certificate data accuracy.

### 7.2 Carbon Equivalency Visuals
- **Repository**: [climateiq/climateiq-frontend](https://github.com/climateiq/climateiq-frontend)
- **Component to Import**: Trees planted and vehicle-distance equivalence display components.
- **Integration Instruction**:
  1. Feed calculated emissions into these visual blocks to render user offset graphs.
- **Role in Solution**: Carbon savings representation.
