# AI Design & Core Algorithms

## 1. Amazon Bedrock Model Selection
- **Primary Model**: Claude 3.5 Sonnet (multimodal; handles high-fidelity image inspection and structured JSON parsing).
- **Fallback Model**: Amazon Titan Multimodal.
- **Latency Target**: Response returned in under 2 seconds for optimal user experience.

---

## 2. Image Inspection System Prompt

Used by the **Inspection Service** when sending images to Amazon Bedrock:

```
You are an expert product condition inspector for a reverse commerce platform.
You will receive 3-5 images of a returned product.

Analyze the images and return a JSON response with this exact structure:
{
  "grade": "A|B|C|D",
  "gradeReasoning": "brief explanation",
  "damages": [
    {
      "type": "surface_scratch|crack|missing_part|liquid_damage|packaging_damage|other",
      "severity": 1-10,
      "location": "description of location on product",
      "description": "details"
    }
  ],
  "packagingCondition": "original_intact|original_damaged|no_packaging",
  "functionalityAssessment": "likely_functional|needs_testing|likely_non_functional",
  "repairCostBracket": "none|low_under_500|medium_500_2000|high_over_2000",
  "fraudSignals": [
    {
      "type": "wrong_product|excessive_damage|model_mismatch|other",
      "confidence": 0-1,
      "description": "details"
    }
  ],
  "summary": "2-3 sentence human-readable summary",
  "confidenceScore": 0-1
}

Grade definitions:
- A: Like New. No visible defects. Packaging intact or minimally opened.
- B: Good. Minor cosmetic defects only. Fully functional expected.
- C: Fair. Visible wear or cosmetic damage. Functional with minor issues.
- D: Poor. Significant damage. May be non-functional or require major repair.

Return ONLY the JSON. No preamble or explanation.
```

---

## 3. Fraud Risk Assessment Algorithm

Executed by the **Routing Service** after inspection completion to evaluate return integrity:

```go
func assessFraudRisk(inspection Inspection, user User) FraudRisk {
    score := 0
    if len(inspection.FraudSignals) > 0 {
        for _, signal := range inspection.FraudSignals {
            score += int(signal.Confidence * 10)
        }
    }
    if user.ReturnCount > 5 && user.TrustScore < 50 {
        score += 20
    }
    if score > 30 {
        return FraudRisk{Level: "HIGH", Action: "manual_review"}
    }
    return FraudRisk{Level: "LOW", Action: "auto_approve"}
}
```

---

## 4. AI-Generated Listing Copy Prompt

Generates consumer-facing product descriptions for open-box listings:

```
You are a marketplace copywriter for second-life products.
Given the inspection result below, write a compelling, honest product listing description.

Inspection: {inspection_json}
Product Name: {product_name}
Price: {price}

Rules:
- Be honest about condition. Do not hide defects.
- Highlight positive aspects.
- 3-4 sentences maximum.
- End with a trust statement about the AI certificate.
```

---

## 5. Buyer Recommendation Prompt

Ranks available secondhand items based on user preferences and browser behavior:

```
Given a buyer's purchase history and wishlist categories: {buyer_context}
And these available second-life products: {product_list}

Rank the top 3 products most likely to interest this buyer.
Return JSON: [{ "listingId": "...", "reason": "one sentence explanation" }]
```

---

## 6. Pre-Checkout Prevention Engine

The best return is one that never happens. We use a predictive return engine at checkout.

### Size and Fit Intelligence
```
Bedrock prompt at checkout:
"Given this buyer's purchase history {history} and return pattern {returns},
and the product specifications {specs}, predict return likelihood.
If > 40% probability, surface a proactive recommendation."

→ Output: "Customers with your purchase profile prefer Size 8 in this brand.
           You selected Size 7. Switch?"
```

### Prevention Engine Event Flow (EventBridge)
```
Trigger: order.placed event
  → Lambda: fetch buyer return history + product fit data
  → Bedrock: compute return probability score
  → If score > 0.4: emit prevention.recommendation event
  → SNS: push fit alert to customer before dispatch
```

### Prevention API Definition
* **Path**: `POST /v1/prevention/score`
* **Request Body**:
```json
{
  "userId": "USR-001",
  "productId": "PROD-456",
  "selectedVariant": "size_7"
}
```
* **Response Body**:
```json
{
  "returnProbability": 0.67,
  "recommendation": "Customers with your profile prefer Size 8 in Nike Running. Switch?",
  "alternativeVariant": "size_8",
  "confidenceScore": 0.89
}
```
