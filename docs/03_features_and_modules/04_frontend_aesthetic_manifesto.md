# Frontend Design & Aesthetic Manifesto

Approaching the frontend architecture for SecondLife Commerce, we are explicitly rejecting generic "AI slop" aesthetics. We are designing as a boutique studio giving this product an unforgettable, signature visual identity. **All frontend code written during the hackathon MUST strictly adhere to this manifesto.**

## 1. Grounded in the Subject
SecondLife Commerce deals with reverse logistics, physical garments, electronics, shipping routes, and environmental impact. The aesthetic must reflect this reality.
- **Direction to Developer:** Pick a single, bold extreme. Do not build a generic SaaS dashboard. Choose either *Industrial/Utilitarian* (exposed grid lines, raw data tables, monospaced fonts, terminal-like efficiency) or *Editorial/Magazine* (asymmetric layouts, massive display typography, dramatic white space, high-fashion presentation of secondhand goods).
- **Mandate:** Stick to the chosen extreme. 

## 2. Unforgettable Typography & Palette
Do not use Arial, Roboto, Inter, Space Grotesk, or standard system fonts. 
- **Type Scale:** Pair a highly characterful, unexpected display font (e.g., a sharp serif or an ultra-condensed brutalist sans) with a complementary, highly legible body font. The typography must be a memorable part of the design, not just a delivery vehicle.
- **Color Palette:** Do not use "warm cream with terracotta" or "near-black with acid green" AI defaults. Define a tight palette of 4-6 named hex values derived from the physical world of shipping and textiles (e.g., Cardboard Brown, Safety Orange, Denim Blue, Receipt Paper White). Commit to these via CSS variables.

## 3. Orchestrated Motion & Layout
- **Layouts:** Break the standard grid. Utilize asymmetry, overlapping elements, and diagonal flows where appropriate. Do not default to centered boxes with heavy drop shadows.
- **Motion:** Use motion deliberately. Avoid scattered, cheap micro-interactions. Favor one highly orchestrated page-load sequence (using CSS animation delays) that builds the interface piece-by-piece to create a premium feel. Avoid over-animating to prevent the "AI-generated" feel.

## 4. Intentional Copywriting & UX
Words are design material. 
- **Voice:** Write from the end user's side of the screen. Use active voice ("Save changes", not "Submit").
- **Empty States:** Treat failure and emptiness as moments for direction. An empty return locker screen is an invitation to act, not a dead end.

## 5. Build Execution Constraints
When writing HTML/CSS/React/React Native:
- **No Generics:** Eliminate standard bootstrap-style padding and generic class naming.
- **Precision:** If executing maximalism, do it with elaborate textures (noise, grain, gradient meshes). If executing minimalism, do it with extreme precision in spacing and alignment.
- **Signature Element:** Every view must have one bold, memorable signature element that embodies the brief.

> **To the Developer:** Critique your own work as you build. If it looks like a template, delete it and start over. Build a distinctive point of view.
