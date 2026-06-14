# SecondLife Commerce - Feature Documentation

This document outlines the current state of all features across the three primary personas (Buyer, Seller, Admin). It details their implementation status, technical stack, and data sourcing (whether it relies on a live database or mock data for the hackathon presentation).

---

## 👤 Buyer Persona

### 1. Local Catalog Browsing
- **Status**: Implemented
- **Implementation**: Handled directly in `App.tsx` (`/catalog` route). Renders a responsive grid of available second-hand products with dynamic filtering.
- **Data Source**: **Fake/Mocked**. Relies on a hardcoded array of `mockCatalog` items in the frontend state.

### 2. Pre-Checkout Prevention (Friction Engine)
- **Status**: Implemented
- **Implementation**: Located in `App.tsx` (`/prevention` route). Analyzes the shopping cart to detect issues that historically lead to returns (e.g., ordering multiple sizes of the same item, or having high return velocity).
- **Data Source**: **Fake/Mocked**. Logic executes locally in the browser based on dummy variables like `returnVelocity`.

### 3. Logistics Telemetry Dashboard
- **Status**: Implemented
- **Implementation**: Handled by `LogisticsTelemetry.tsx` (`/logistics` route). Renders a live Leaflet map and dynamic metric cards.
- **Data Source**: **Simulated Live Stream**. Connects to a Python backend via WebSockets (`ws://localhost:8000/ws/logistics`) which uses `asyncio.sleep` to stream simulated live GPS coordinates and statuses for delivery agents.

---

## 🏢 Seller Persona

### 1. Return Processing & AI Grading
- **Status**: Implemented
- **Implementation**: Integrated into `App.tsx` (`/returns` route). Provides a wizard to upload photos of returned goods.
- **Data Source**: **Fake/Mocked**. Simulates an AI Visual Language Model (VLM) call with an artificial loading delay, returning pre-determined grades and bounding box coordinates for defects.

### 2. Unit Inventory Dashboard (Digital Product Passports)
- **Status**: Implemented
- **Implementation**: Handled by `UnitInventoryDashboard.tsx` (`/inventory` route). Displays a sophisticated table tracking the status, escrow state, and grading of individual SKUs.
- **Data Source**: **Fake/Mocked**. Uses a static array of generated inventory records.

### 3. Modular Seller Canvas
- **Status**: Implemented
- **Implementation**: Handled by `SellerCanvas.tsx` (`/admin` route). Provides a drag-and-drop or grid-based analytics dashboard for sellers to monitor conversion rates and sustainability metrics.
- **Data Source**: **Fake/Mocked**. Hardcoded JSON statistics.

---

## 🛡️ Admin Persona

### 1. Fraud Monitor (Suspicious Account Networks)
- **Status**: Implemented
- **Implementation**: Integrated into `App.tsx` (`/fraud` route). Renders a visual network topology of coordinated return fraud rings (e.g. wardrobing). 
- **Data Source**: **Fake/Mocked**. Rendered using a static SVG graph and hardcoded cluster anomaly cards.

### 2. Authenticity Checks (Serial Verification)
- **Status**: Implemented
- **Implementation**: Handled by `SerialVerification.tsx` (`/serial` route). Allows the admin to upload an image of a returned item to verify the serial number against the outbound database.
- **Data Source**: **Fake/Mocked**. Uses frontend `setTimeout` delays to simulate OCR/Vision API execution. Generates dynamic responses based on the provided Order ID (`ORD-001` triggers a mismatch, anything else passes).

### 3. Green Deliveries (Sustainable Fleet Optimizer)
- **Status**: Implemented
- **Implementation**: Handled by `FleetOptimizer.tsx` (`/routing` route). Allows tuning the balance between cost and sustainability, producing a breakdown of EV pods vs. cargo bikes vs. trucks. Hits the Python backend at `POST /api/v1/fleet/optimize`.
- **Data Source**: **Mixed (Real Math + Mock Coordinates)**. The backend executes a real algorithm (Genetic Algorithm/Heuristics via `ortools`) to solve the routing problem, but the initial delivery coordinates and demands are procedurally generated in Python.

### 4. Route Optimizer (NSGA-II)
- **Status**: Implemented
- **Implementation**: Handled by `RouteOptimizer.tsx` (`/nsga2` route). Calculates the most optimal delivery map routes. Hits the Python backend at `POST /api/v1/logistics/optimize-routes`.
- **Data Source**: **Mixed (Real Math + Mock Coordinates)**. Similar to the Fleet Optimizer, it uses the real Google `ortools` TSP/VRP solving engine against simulated map coordinates.

### 5. Logistics Telemetry
- **Status**: Implemented
- **Implementation**: Shares the `LogisticsTelemetry.tsx` component with the Buyer role.
- **Data Source**: **Simulated Live Stream** (WebSocket).
