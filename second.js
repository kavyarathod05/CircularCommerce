const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak, VerticalAlign
} = require('docx');
const fs = require('fs');

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CELL_MARGINS = { top: 100, bottom: 100, left: 140, right: 140 };

const ORANGE = "E47911";   // Amazon orange
const DARK = "131921";     // Amazon dark
const LIGHT_ORANGE = "FFF3E0";
const LIGHT_BLUE = "E8F4F8";
const LIGHT_RED = "FFEBEE";
const LIGHT_GREEN = "E8F5E9";
const LIGHT_YELLOW = "FFFDE7";
const LIGHT_PURPLE = "F3E5F5";
const LIGHT_GRAY = "F5F5F5";
const WHITE = "FFFFFF";

function h(text, level, color = DARK) {
  const sizes = { 1: 40, 2: 32, 3: 26, 4: 24 };
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
    spacing: { before: level <= 2 ? 360 : 240, after: level <= 2 ? 180 : 120 },
    children: [new TextRun({ text, bold: true, size: sizes[level] || 24, color, font: "Arial" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 60, after: opts.after || 120 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold || false, color: opts.color || DARK, font: "Arial", italics: opts.italic || false })]
  });
}

function bullet(text, level = 0, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 60 },
    children: [new TextRun({ text, size: 22, bold, font: "Arial", color: DARK })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function divider(color = ORANGE) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 1 } },
    children: [new TextRun("")]
  });
}

function coloredCell(text, fill, width, bold = false, center = false, small = false) {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold, size: small ? 18 : 20, font: "Arial", color: DARK })]
    })]
  });
}

function headerCell(text, width, fill = DARK) {
  return new TableCell({
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, font: "Arial", color: WHITE })]
    })]
  });
}

function tableRow(cells) {
  return new TableRow({ children: cells });
}

// ─── ISSUE TABLE helper ──────────────────────────────────────────────────────
function issueTable(rows) {
  const cols = [1600, 1600, 1600, 1600, 1260, 1700];
  const total = cols.reduce((a, b) => a + b, 0); // 9360
  const headers = ["Problem Statement", "Stakeholders Affected", "Root Cause", "Current Mitigation", "Severity", "Opportunity Area"];
  const fills = [LIGHT_ORANGE, LIGHT_BLUE, LIGHT_RED, LIGHT_GREEN, LIGHT_YELLOW, LIGHT_PURPLE];

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      tableRow(headers.map((h, i) => headerCell(h, cols[i], ORANGE))),
      ...rows.map(row => {
        const mappedRow = [row[0], row[1], row[6], row[7], row[10], row[11]];
        return tableRow(mappedRow.map((cell, i) => coloredCell(cell, fills[i], cols[i], false, false, true)));
      })
    ]
  });
}

// ─── SIMPLE 2-COL TABLE ──────────────────────────────────────────────────────
function twoColTable(rows, col1w = 2800, col2w = 6560) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [col1w, col2w],
    rows: rows.map(([k, v]) => tableRow([
      coloredCell(k, LIGHT_ORANGE, col1w, true),
      coloredCell(v, LIGHT_GRAY, col2w)
    ]))
  });
}

function section(label, content) {
  return twoColTable([[label, content]]);
}

function spaceP() {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun("")] });
}

// ────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets", levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } },
        ]
      },
      {
        reference: "numbers", levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 40, bold: true, font: "Arial", color: WHITE }, paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0, shading: { fill: DARK, type: ShadingType.CLEAR } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: ORANGE }, paragraph: { spacing: { before: 300, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: DARK }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: "555555" }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 3 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    children: [

      // ═══ COVER ══════════════════════════════════════════════════════════════
      new Paragraph({ spacing: { before: 1440, after: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HackOn with Amazon — Season 6.0", bold: true, size: 28, color: ORANGE, font: "Arial" })] }),
      new Paragraph({ spacing: { before: 0, after: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "THEME 3 — SECOND LIFE COMMERCE", bold: true, size: 52, color: DARK, font: "Arial" })] }),
      new Paragraph({ spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AI-Powered Returns & Sustainable Resale", bold: false, size: 32, color: "555555", font: "Arial", italics: true })] }),
      divider(),
      new Paragraph({ spacing: { before: 120, after: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Deep-Dive Problem Research Report  |  Customer-Centric Breakdown", size: 24, color: "555555", font: "Arial", italics: true })] }),
      new Paragraph({ spacing: { before: 60, after: 1440 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Solution-Agnostic Analysis  •  Infrastructure & Architecture  •  All Stakeholders  •  Root Causes", size: 20, color: "777777", font: "Arial" })] }),
      pageBreak(),

      // ═══ EXECUTIVE SUMMARY ══════════════════════════════════════════════════
      h("EXECUTIVE SUMMARY", 1),
      divider(),
      p("Every year, hundreds of millions of products bought online are returned, resold on grey markets, landfilled, or quietly forgotten in warehouses. The reverse commerce ecosystem—covering returns, refurbishment, resale, recycling, and redistribution—is broken at almost every layer. This report conducts a surgery-level dissection of that broken system."),
      spaceP(),
      p("Three headline numbers frame the problem's scale:"),
      bullet("~30% average e-commerce return rate in India; electronics and fashion touch 40–50%."),
      bullet("₹25,000–₹35,000 crore worth of returned goods move through the reverse logistics chain in India annually."),
      bullet("60–70% of returned products that could be resold are either landfilled or sold at steep losses through opaque liquidation channels."),
      spaceP(),
      p("The core dysfunction: the current ecosystem treats the returned product as a problem to be disposed of, not an asset to be optimized. This report identifies 27 distinct problem clusters across Customer Experience, Seller Operations, Warehouse & Inspection, Logistics, Refurbishment, Trust & Authentication, Data & Technology, Sustainability, and Policy."),
      spaceP(),
      p("For hackathon participants targeting Theme 3, this report is your map of the real battlefield before you design your solution."),
      pageBreak(),

      // ═══ SECTION 1: ECOSYSTEM OVERVIEW ══════════════════════════════════════
      h("SECTION 1: CURRENT ECOSYSTEM OVERVIEW", 1),
      divider(),
      h("1.1 What Is the Second Life Commerce Ecosystem?", 2),
      p("Second Life Commerce describes the full lifecycle of a product after its first sale. It covers six operational branches, each with its own actors, processes, and failure modes:"),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1400, 2500, 2500, 2960],
        rows: [
          tableRow([headerCell("Branch", 1400), headerCell("What It Covers", 2500), headerCell("Key Actors", 2500), headerCell("Current Scale in India", 2960)]),
          tableRow([coloredCell("Returns", LIGHT_ORANGE, 1400, true), coloredCell("Customer sends product back after purchase", WHITE, 2500), coloredCell("Customer, marketplace, logistics partner, warehouse", WHITE, 2500), coloredCell("~100M+ returns/year across major platforms", WHITE, 2960)]),
          tableRow([coloredCell("Refurbishment", LIGHT_BLUE, 1400, true), coloredCell("Returned goods are cleaned, repaired, re-packaged", WHITE, 2500), coloredCell("OEMs, third-party refurbishers, marketplace centers", WHITE, 2500), coloredCell("₹8,000–12,000 crore market; highly fragmented", WHITE, 2960)]),
          tableRow([coloredCell("Resale / Recommerce", LIGHT_GREEN, 1400, true), coloredCell("Refurbished or used goods sold to new buyers", WHITE, 2500), coloredCell("Marketplaces, individual resellers, OLX, Cashify", WHITE, 2500), coloredCell("Growing at ~25% CAGR; trust remains barrier", WHITE, 2960)]),
          tableRow([coloredCell("Peer-to-Peer (P2P)", LIGHT_YELLOW, 1400, true), coloredCell("Individuals selling directly to other individuals", WHITE, 2500), coloredCell("Sellers, buyers, platform (OLX, Facebook)", WHITE, 2500), coloredCell("₹15,000+ crore; almost zero quality assurance", WHITE, 2960)]),
          tableRow([coloredCell("Recycling / E-waste", LIGHT_RED, 1400, true), coloredCell("End-of-life products broken down or recycled", WHITE, 2500), coloredCell("PROs, kabadiwala network, authorized dismantlers", WHITE, 2500), coloredCell("Only 22% of India's e-waste recycled formally", WHITE, 2960)]),
          tableRow([coloredCell("Liquidation", LIGHT_PURPLE, 1400, true), coloredCell("Bulk selling of returns at discounted prices", WHITE, 2500), coloredCell("B2B liquidation platforms, wholesale buyers", WHITE, 2500), coloredCell("Opaque market; large losses for sellers", WHITE, 2960)]),
        ]
      }),
      spaceP(),

      h("1.2 How the Current Return Lifecycle Works (End-to-End)", 2),
      p("A typical returned product in India goes through the following journey — which is where almost every problem originates:"),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 2200, 3380, 3380],
        rows: [
          tableRow([headerCell("Step", 400), headerCell("Stage", 2200), headerCell("What Actually Happens", 3380), headerCell("Where It Breaks", 3380)]),
          tableRow([coloredCell("1", LIGHT_GRAY, 400, true, true), coloredCell("Return Initiation", LIGHT_GRAY, 2200, true), coloredCell("Customer triggers return via app. Pickup or drop-off scheduled.", WHITE, 3380), coloredCell("Vague return reasons collected. No photo/video proof required upfront.", WHITE, 3380)]),
          tableRow([coloredCell("2", LIGHT_GRAY, 400, true, true), coloredCell("Pickup / Drop-off", LIGHT_GRAY, 2200, true), coloredCell("Logistics partner collects item. Basic check for box/seal done.", WHITE, 3380), coloredCell("Delivery agent has no training for quality checks. Fraudulent returns pass easily.", WHITE, 3380)]),
          tableRow([coloredCell("3", LIGHT_GRAY, 400, true, true), coloredCell("Transit to Return Hub", LIGHT_GRAY, 2200, true), coloredCell("Item travels to nearest return processing hub (RPC / FC).", WHITE, 3380), coloredCell("No item-level tracking. Damage during transit unattributed.", WHITE, 3380)]),
          tableRow([coloredCell("4", LIGHT_GRAY, 400, true, true), coloredCell("Receiving at Warehouse", LIGHT_GRAY, 2200, true), coloredCell("Warehouse scans barcode. Item placed in 'returns bin'.", WHITE, 3380), coloredCell("No AI grading. Items pile up waiting for manual inspection.", WHITE, 3380)]),
          tableRow([coloredCell("5", LIGHT_GRAY, 400, true, true), coloredCell("Manual QC / Inspection", LIGHT_GRAY, 2200, true), coloredCell("Worker manually checks item. Decides: resell as new, refurb, or dispose.", WHITE, 3380), coloredCell("Highly inconsistent. No standardized grading rubric. Understaffed.", WHITE, 3380)]),
          tableRow([coloredCell("6", LIGHT_GRAY, 400, true, true), coloredCell("Routing Decision", LIGHT_GRAY, 2200, true), coloredCell("Item routed to: restock shelf / refurb center / liquidation / scrap.", WHITE, 3380), coloredCell("Decision made without profitability data. Often defaults to liquidation.", WHITE, 3380)]),
          tableRow([coloredCell("7", LIGHT_GRAY, 400, true, true), coloredCell("Refurbishment (if chosen)", LIGHT_GRAY, 2200, true), coloredCell("Item sent to refurb center. Cleaned, repaired, re-packaged.", WHITE, 3380), coloredCell("No standard process. Quality variance high. No digital tracking.", WHITE, 3380)]),
          tableRow([coloredCell("8", LIGHT_GRAY, 400, true, true), coloredCell("Relisting / Resale", LIGHT_GRAY, 2200, true), coloredCell("Refurbished item listed on marketplace under 'Renewed' or 'Open Box'.", WHITE, 3380), coloredCell("No trust signals. Low conversion. Priced too low to recover costs.", WHITE, 3380)]),
          tableRow([coloredCell("9", LIGHT_GRAY, 400, true, true), coloredCell("Customer Purchase (2nd)", LIGHT_GRAY, 2200, true), coloredCell("New buyer purchases refurbished/used item.", WHITE, 3380), coloredCell("Buyer has no transparency about item history. Returns again if disappointed.", WHITE, 3380)]),
          tableRow([coloredCell("10", LIGHT_GRAY, 400, true, true), coloredCell("Unsold → Liquidation", LIGHT_GRAY, 2200, true), coloredCell("Items unsold after X days bulk-sold to liquidators at 10–20p/₹.", WHITE, 3380), coloredCell("Massive value destruction. No better-matching attempted first.", WHITE, 3380)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 2: CURRENT INFRASTRUCTURE & ARCHITECTURE ═══════════════════
      h("SECTION 2: CURRENT INFRASTRUCTURE & ARCHITECTURE", 1),
      divider(),
      h("2.1 Technology Stack Used by Marketplaces Today", 2),
      p("Understanding the current tech architecture reveals why the system cannot self-optimize. These systems were designed for forward commerce and retrofitted for reverse logistics — which is the root of most data and automation failures."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2100, 3400, 3860],
        rows: [
          tableRow([headerCell("System Layer", 2100), headerCell("Current Tools / Tech", 3400), headerCell("Limitation for Reverse Commerce", 3860)]),
          tableRow([coloredCell("Order Management System (OMS)", LIGHT_GRAY, 2100, true), coloredCell("Custom OMS (Amazon's internal), SAP, Unicommerce", WHITE, 3400), coloredCell("Built for forward orders. Return workflows are add-ons. Limited routing intelligence.", WHITE, 3860)]),
          tableRow([coloredCell("Warehouse Management (WMS)", LIGHT_GRAY, 2100, true), coloredCell("Manhattan WMS, HighJump, Amazon Fulfillment Tech", WHITE, 3400), coloredCell("Returns treated as inventory events, not product-health events. No grade tracking.", WHITE, 3860)]),
          tableRow([coloredCell("Returns Processing Portal", LIGHT_GRAY, 2100, true), coloredCell("Custom web portals, basic barcode scan + reason code", WHITE, 3400), coloredCell("No image capture, no AI assessment, no real-time routing decision engine.", WHITE, 3860)]),
          tableRow([coloredCell("Logistics & Tracking", LIGHT_GRAY, 2100, true), coloredCell("Delhivery, Ecom Express, Amazon Logistics TMS", WHITE, 3400), coloredCell("Reverse tracking visibility is 48–72 hrs delayed. No condition-in-transit sensing.", WHITE, 3860)]),
          tableRow([coloredCell("Quality Inspection", LIGHT_GRAY, 2100, true), coloredCell("Manual inspection sheets, paper-based checklists", WHITE, 3400), coloredCell("100% manual. No CV/AI assist. Massive throughput bottleneck. High variance.", WHITE, 3860)]),
          tableRow([coloredCell("Grading System", LIGHT_GRAY, 2100, true), coloredCell("Internal labels (Grade A/B/C) — no standardization", WHITE, 3400), coloredCell("Grades not visible to end customer. No cross-platform grade standard.", WHITE, 3860)]),
          tableRow([coloredCell("Recommerce Platform", LIGHT_GRAY, 2100, true), coloredCell("Amazon Renewed, Flipkart 2GUD (now defunct)", WHITE, 3400), coloredCell("Separate siloed catalog. No integration with demand signals or AI pricing.", WHITE, 3860)]),
          tableRow([coloredCell("Customer Communication", LIGHT_GRAY, 2100, true), coloredCell("Push notifications, email, SMS triggers from OMS", WHITE, 3400), coloredCell("No proactive intervention before return. No 'save the return' AI layer.", WHITE, 3860)]),
          tableRow([coloredCell("Analytics / BI", LIGHT_GRAY, 2100, true), coloredCell("Tableau, Redshift-based dashboards", WHITE, 3400), coloredCell("Reports on return volume, not return cause patterns or product-level profitability.", WHITE, 3860)]),
          tableRow([coloredCell("Fraud Detection", LIGHT_GRAY, 2100, true), coloredCell("Rule-based systems (return frequency, value thresholds)", WHITE, 3400), coloredCell("Binary block/allow. Cannot detect sophisticated fraud (e.g. counterfeit returns).", WHITE, 3860)]),
          tableRow([coloredCell("Sustainability Tracking", LIGHT_GRAY, 2100, true), coloredCell("None / Excel-based carbon estimates", WHITE, 3400), coloredCell("No carbon footprint per return calculated. No green incentive infrastructure.", WHITE, 3860)]),
        ]
      }),
      spaceP(),

      h("2.2 Physical Infrastructure Gaps", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 3180, 3180],
        rows: [
          tableRow([headerCell("Infrastructure", 3000), headerCell("Current State", 3180), headerCell("Gap", 3180)]),
          tableRow([coloredCell("Return Processing Centers (RPC)", LIGHT_GRAY, 3000, true), coloredCell("Located only in Tier 1 cities. 8–10 major RPCs for all of India.", WHITE, 3180), coloredCell("Tier 2/3 returns travel 400–800 km, adding cost and transit damage.", WHITE, 3180)]),
          tableRow([coloredCell("Refurbishment Facilities", LIGHT_GRAY, 3000, true), coloredCell("OEM-run facilities (Samsung, Apple) + 3rd party (Cashify, Revampo). Fragmented.", WHITE, 3180), coloredCell("No standardized process. Amazon cannot certify non-OEM refurbs reliably.", WHITE, 3180)]),
          tableRow([coloredCell("Drop-off Points", LIGHT_GRAY, 3000, true), coloredCell("Amazon counters at select locations + courier drop points.", WHITE, 3180), coloredCell("Very limited Tier 2+ coverage. Inconvenient for customers.", WHITE, 3180)]),
          tableRow([coloredCell("Sorting Automation", LIGHT_GRAY, 3000, true), coloredCell("Minimal. Some conveyor systems in large FCs. Returns sorted manually.", WHITE, 3180), coloredCell("Processing 500+ returns/day per facility manually is the norm. Massive error rate.", WHITE, 3180)]),
          tableRow([coloredCell("Cold-Chain / Sensitive Handling", LIGHT_GRAY, 3000, true), coloredCell("Exists for food/pharma. Not applied to electronics.", WHITE, 3180), coloredCell("Sensitive electronics handled alongside non-sensitive items causing damage.", WHITE, 3180)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 3: STAKEHOLDER ANALYSIS ═════════════════════════════════════
      h("SECTION 3: COMPLETE STAKEHOLDER MAPPING", 1),
      divider(),
      p("Every stakeholder in the ecosystem faces unique and compounding pain points. Below is a full breakdown by stakeholder role."),
      spaceP(),

      h("3.1 The End Customer (Buyer)", 2),
      p("The customer is the most critical stakeholder — and the most misunderstood. Their behavior drives returns, and their lack of trust drives low recommerce conversion."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 7360],
        rows: [
          tableRow([headerCell("Dimension", 2000, DARK), headerCell("Customer Reality", 7360, DARK)]),
          tableRow([coloredCell("Why They Return", LIGHT_GRAY, 2000, true), coloredCell("Product doesn't match description (32%), size/fit wrong (28%), changed mind (18%), defective (15%), wrong item delivered (7%). Most of these are preventable.", WHITE, 7360)]),
          tableRow([coloredCell("Return Friction", LIGHT_GRAY, 2000, true), coloredCell("Confusing return policies across sellers. Different time windows. Packaging hassle. Waiting at home for pickup. Delayed refunds (5–10 business days standard).", WHITE, 7360)]),
          tableRow([coloredCell("Trust in Refurbished", LIGHT_GRAY, 2000, true), coloredCell("72% of Indian customers say they are 'uncomfortable' buying refurbished electronics. Main concerns: hidden damage, battery health, hygiene, no warranty, no return on refurb.", WHITE, 7360)]),
          tableRow([coloredCell("Price Sensitivity", LIGHT_GRAY, 2000, true), coloredCell("Would buy refurbished if discount is 25–40% AND quality is certified. Current offerings give 15–20% discount without credible certification — the worst of both worlds.", WHITE, 7360)]),
          tableRow([coloredCell("P2P Selling Intent", LIGHT_GRAY, 2000, true), coloredCell("~40% of customers have unused products they'd sell. 65% abandon the process due to safety concerns, hassle of listing, pricing uncertainty, and fear of no-shows.", WHITE, 7360)]),
          tableRow([coloredCell("Sustainability Awareness", LIGHT_GRAY, 2000, true), coloredCell("Tier 1 customers (25–35 age group) express environmental concern but do not see visible eco-options on Amazon. No green credits, no carbon footprint info shown.", WHITE, 7360)]),
        ]
      }),
      spaceP(),

      h("3.2 Sellers & Brands", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 7360],
        rows: [
          tableRow([headerCell("Dimension", 2000, DARK), headerCell("Seller Reality", 7360, DARK)]),
          tableRow([coloredCell("Financial Loss", LIGHT_GRAY, 2000, true), coloredCell("Average return costs seller ₹250–600 in reverse logistics + 15–30% product value loss from damage/depreciation. High-return categories can erode margins entirely.", WHITE, 7360)]),
          tableRow([coloredCell("Lack of Visibility", LIGHT_GRAY, 2000, true), coloredCell("Sellers receive returned items 10–21 days after return initiation with no real-time status. Cannot plan inventory or cash flow.", WHITE, 7360)]),
          tableRow([coloredCell("Fraudulent Returns", LIGHT_GRAY, 2000, true), coloredCell("Return fraud costs Indian e-commerce ₹1,200–1,500 crore/year. Empty box returns, item-swapping, used-as-new returns. Sellers absorb most of this loss.", WHITE, 7360)]),
          tableRow([coloredCell("Listing Difficulty", LIGHT_GRAY, 2000, true), coloredCell("Reselling returned/refurbished goods on the same marketplace is operationally complex. Separate seller accounts, different policies, stigmatized category.", WHITE, 7360)]),
          tableRow([coloredCell("No Decision Support", LIGHT_GRAY, 2000, true), coloredCell("Sellers must independently decide: relist? refurb? liquidate? destroy? No system provides profitability-based routing recommendations.", WHITE, 7360)]),
        ]
      }),
      spaceP(),

      h("3.3 Logistics Partners", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 7360],
        rows: [
          tableRow([headerCell("Dimension", 2000, DARK), headerCell("Logistics Reality", 7360, DARK)]),
          tableRow([coloredCell("Reverse > Forward Cost", LIGHT_GRAY, 2000, true), coloredCell("Reverse pickup costs 1.4–1.8x forward delivery due to failed attempts, customer availability, and non-standard packaging.", WHITE, 7360)]),
          tableRow([coloredCell("No Condition Capture", LIGHT_GRAY, 2000, true), coloredCell("Delivery agents have no mobile tool to photograph/assess product condition at pickup. Any damage claim later is unverifiable.", WHITE, 7360)]),
          tableRow([coloredCell("Route Inefficiency", LIGHT_GRAY, 2000, true), coloredCell("Returns from Tier 2/3 cities consolidated and sent to Tier 1 hubs even when local refurbishers exist. Massive empty-mile waste.", WHITE, 7360)]),
          tableRow([coloredCell("Accountability Gap", LIGHT_GRAY, 2000, true), coloredCell("When item arrives damaged at warehouse, it's unclear if damage happened in transit or at customer's home. No attribution = no incentive to improve.", WHITE, 7360)]),
        ]
      }),
      spaceP(),

      h("3.4 Warehouse & Inspection Center Staff", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 7360],
        rows: [
          tableRow([headerCell("Dimension", 2000, DARK), headerCell("Warehouse Reality", 7360, DARK)]),
          tableRow([coloredCell("Volume vs Capacity", LIGHT_GRAY, 2000, true), coloredCell("Peak season return volumes spike 3–4x. Fixed workforce. Items queue for 5–10 days uninspected — further degrading quality.", WHITE, 7360)]),
          tableRow([coloredCell("No Standard Rubric", LIGHT_GRAY, 2000, true), coloredCell("Inspector decides grade based on personal experience. Same item graded differently by different staff. No AI assist, no image-based reference.", WHITE, 7360)]),
          tableRow([coloredCell("Data Entry Burden", LIGHT_GRAY, 2000, true), coloredCell("Manual entry of condition, reason, disposition into WMS. Time-consuming, error-prone. Many items entered as 'unknown' category.", WHITE, 7360)]),
          tableRow([coloredCell("Missing Items", LIGHT_GRAY, 2000, true), coloredCell("~8–12% of return parcels arrive with missing accessories, wrong items, or incomplete packaging. No systematic tracking of these discrepancies.", WHITE, 7360)]),
        ]
      }),
      spaceP(),

      h("3.5 Refurbishment Centers", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 7360],
        rows: [
          tableRow([headerCell("Dimension", 2000, DARK), headerCell("Refurb Reality", 7360, DARK)]),
          tableRow([coloredCell("Fragmented Operations", LIGHT_GRAY, 2000, true), coloredCell("India has ~500+ refurb operators but no certification standard. Each has different processes, tools, parts sourcing, and grading criteria.", WHITE, 7360)]),
          tableRow([coloredCell("Parts Availability", LIGHT_GRAY, 2000, true), coloredCell("Genuine spare parts are difficult to source in India. OEMs restrict part supply to protect new device sales. Grey market parts used = quality risk.", WHITE, 7360)]),
          tableRow([coloredCell("Digital Tracking Gap", LIGHT_GRAY, 2000, true), coloredCell("No digital trail of what was done to a product during refurbishment. Cannot communicate repair history to buyers. Kills trust.", WHITE, 7360)]),
          tableRow([coloredCell("Margin Squeeze", LIGHT_GRAY, 2000, true), coloredCell("Refurbishment cost (labor + parts + testing) often exceeds resale premium available. Economics don't work for many product categories.", WHITE, 7360)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 4: CUSTOMER JOURNEY ANALYSIS ════════════════════════════════
      h("SECTION 4: CUSTOMER JOURNEY ANALYSIS — WHERE IT BREAKS", 1),
      divider(),
      h("4.1 The 'Disappointed Buyer' Journey (Most Common Return Trigger)", 2),
      p("This journey accounts for 60%+ of returns. The customer felt misled at purchase — not at delivery. This is a pre-return failure."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 2200, 2380, 2380, 2000],
        rows: [
          tableRow([headerCell("#", 400), headerCell("Customer Touchpoint", 2200), headerCell("What Customer Experiences", 2380), headerCell("System Failure Here", 2380), headerCell("Emotion", 2000)]),
          tableRow([coloredCell("1", LIGHT_GRAY, 400, true, true), coloredCell("Browsing / Discovery", WHITE, 2200), coloredCell("Sees product with 4.2★ rating, professional photos, bullet specs.", WHITE, 2380), coloredCell("Reviews contain fakes. Images are manufacturer renders. Specs incomplete.", WHITE, 2380), coloredCell("Hopeful, excited", WHITE, 2000)]),
          tableRow([coloredCell("2", LIGHT_GRAY, 400, true, true), coloredCell("Purchase Decision", WHITE, 2200), coloredCell("Buys based on photos + reviews. No size guide, no real-world demo.", WHITE, 2380), coloredCell("No AR try-on. No 'real customer photos' requirement. No 'return likelihood' warning.", WHITE, 2380), coloredCell("Confident", WHITE, 2000)]),
          tableRow([coloredCell("3", LIGHT_GRAY, 400, true, true), coloredCell("Delivery", WHITE, 2200), coloredCell("Item arrives. Unboxes. Doesn't match expectation.", WHITE, 2380), coloredCell("No last-mile quality check. Packaging condition not recorded.", WHITE, 2380), coloredCell("Disappointed", WHITE, 2000)]),
          tableRow([coloredCell("4", LIGHT_GRAY, 400, true, true), coloredCell("Return Initiation", WHITE, 2200), coloredCell("Navigates to Returns section. Selects reason from dropdown.", WHITE, 2380), coloredCell("Reason codes are broad (e.g. 'did not like'). No root cause captured.", WHITE, 2380), coloredCell("Frustrated", WHITE, 2000)]),
          tableRow([coloredCell("5", LIGHT_GRAY, 400, true, true), coloredCell("Waiting for Pickup", WHITE, 2200), coloredCell("Stays home for pickup window. Agent may not come.", WHITE, 2380), coloredCell("No real-time ETA for return pickup. Failed attempts common.", WHITE, 2380), coloredCell("Anxious", WHITE, 2000)]),
          tableRow([coloredCell("6", LIGHT_GRAY, 400, true, true), coloredCell("Waiting for Refund", WHITE, 2200), coloredCell("Item picked up. Waits 5–10 days for refund confirmation.", WHITE, 2380), coloredCell("Refund delayed until item reaches warehouse AND is inspected.", WHITE, 2380), coloredCell("Angry", WHITE, 2000)]),
          tableRow([coloredCell("7", LIGHT_GRAY, 400, true, true), coloredCell("Next Purchase", WHITE, 2200), coloredCell("Might search for the same product. Buys elsewhere or from same platform.", WHITE, 2380), coloredCell("No learning fed back to product discovery. Same failure cycle continues.", WHITE, 2380), coloredCell("Wary", WHITE, 2000)]),
        ]
      }),
      spaceP(),

      h("4.2 The 'Refurbished Buyer' Journey (Trust Barrier in Action)", 2),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 2200, 3380, 3380],
        rows: [
          tableRow([headerCell("#", 400), headerCell("Touchpoint", 2200), headerCell("Customer Experience", 3380), headerCell("Trust Failure", 3380)]),
          tableRow([coloredCell("1", LIGHT_GRAY, 400, true, true), coloredCell("Finding Refurb Product", WHITE, 2200), coloredCell("Searches for laptop. Sees 'Amazon Renewed' or 'Open Box' listing buried in results.", WHITE, 3380), coloredCell("Refurb listings de-prioritized. No clear differentiation from new. Suspicious labeling.", WHITE, 3380)]),
          tableRow([coloredCell("2", LIGHT_GRAY, 400, true, true), coloredCell("Reading Product Page", WHITE, 2200), coloredCell("Reads 'Grade A — Excellent Condition'. No definition of Grade A. No photos of the actual unit.", WHITE, 3380), coloredCell("Grade standards not disclosed. Condition photos show stock images, not actual item.", WHITE, 3380)]),
          tableRow([coloredCell("3", LIGHT_GRAY, 400, true, true), coloredCell("Checking Warranty", WHITE, 2200), coloredCell("Sees '6-month seller warranty'. Unclear if OEM-backed or seller-backed.", WHITE, 3380), coloredCell("No clarity on who honors warranty. Fear of abandonment after purchase.", WHITE, 3380)]),
          tableRow([coloredCell("4", LIGHT_GRAY, 400, true, true), coloredCell("Purchase or Abandon", WHITE, 2200), coloredCell("72% of users abandon at this stage and buy new instead.", WHITE, 3380), coloredCell("Price saving not worth trust risk. No proof of quality certifications shown.", WHITE, 3380)]),
          tableRow([coloredCell("5", LIGHT_GRAY, 400, true, true), coloredCell("Post-Purchase (if bought)", WHITE, 2200), coloredCell("Item arrives. Battery at 78%. Screen has micro-scratches. Not 'Grade A' as expected.", WHITE, 3380), coloredCell("Grade definition gap. What was promised ≠ what was delivered.", WHITE, 3380)]),
          tableRow([coloredCell("6", LIGHT_GRAY, 400, true, true), coloredCell("Review & Never Repeat", WHITE, 2200), coloredCell("Leaves 2-star review. Never buys refurbished again. Tells 5 friends.", WHITE, 3380), coloredCell("One bad experience poisons the entire refurb category perception.", WHITE, 3380)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 5: COMPREHENSIVE ISSUE BREAKDOWN ════════════════════════════
      h("SECTION 5: COMPREHENSIVE ISSUE BREAKDOWN BY CATEGORY", 1),
      divider(),

      // 5.1 Customer Issues
      h("5.1 Customer Experience Issues", 2),
      spaceP(),
      issueTable([
        ["Return process is complex, time-consuming and stressful for buyers", "End customers, marketplace", "Wasted time, anxiety, cash flow blocked during refund wait", "High customer churn; increased support costs", "Pickup failures, processing delays", "Low — packaging materials wasted on failed pickups", "Returns designed as deterrent not service; no UX investment", "Simplified UI, extended windows", "Doesn't address pickup failures or refund delays", "NPS, return completion rate, CSAT", "CRITICAL", "Frictionless return UX with real-time tracking"],
        ["Product descriptions mismatch reality — drives 32% of all returns", "Buyers, sellers", "Deep disappointment, distrust, wasted purchase cycle", "Lost revenue, increased returns, listing quality issues", "Return processing backlog, re-shelving costs", "Unnecessary transport emissions for avoidable returns", "Marketplace prioritizes sell-through over accuracy; seller incentives misaligned", "Review flagging, A9 algorithm quality signals", "Reactive not preventive; fraudulent reviews persist", "Return rate by category, return reason distribution", "CRITICAL", "AI-powered listing quality scoring + AR previews"],
        ["No visibility into refund status after return pickup", "End customers", "Financial anxiety — money stuck for 5–10 days", "Trust erosion; customers avoid high-value purchases", "Adds customer service call volume significantly", "None direct", "OMS not integrated with reverse logistics tracking in real time", "Email/SMS refund notifications", "Notifications sent without real-time data; often incorrect", "Refund cycle time, CS contacts per return", "HIGH", "Real-time reverse logistics + instant conditional refunds"],
        ["Customers cannot easily resell unused/unwanted products safely inside Amazon", "Buyers who are also potential sellers", "Missed value recovery on unused goods; safety fears on external platforms", "Lost GMV on recommerce; missed C2B2C revenue", "None currently", "Unused products eventually discarded or landfilled", "Marketplace designed only for forward commerce; P2P marketplace investments low", "Third-party platforms (OLX, Quikr)", "Lack trust, safety, and Amazon's reliability", "Recommerce GMV, unused product volume", "HIGH", "In-platform P2P resale with identity verification"],
        ["No green/sustainability option or incentive for responsible product disposal", "Environmentally conscious buyers (Tier 1, 25–35 age)", "No reward for sustainable behavior; eco options invisible", "Missing loyalty lever; ESG metrics weak", "None", "Products landfilled that could be recycled", "No business model built around green incentives yet", "None systematic", "No existing mechanism", "Carbon per return, green credit redemption rate", "MEDIUM", "Green credits tied to circular commerce behaviors"],
      ]),
      spaceP(),

      // 5.2 Seller Issues
      h("5.2 Seller & Brand Issues", 2),
      spaceP(),
      issueTable([
        ["Return fraud (empty box, item swap, counterfeit return) costs sellers ₹1,200+ crore/year", "Marketplace sellers, brands", "Direct financial loss, product inventory corruption", "Margin erosion; some sellers exit high-return categories", "Fraud investigation is manual, slow, and expensive", "Returns of genuine items with fraudulent substitutes creates e-waste", "Rule-based fraud detection cannot catch sophisticated fraud", "Return reason codes, return frequency thresholds", "Binary allow/block; doesn't prevent first fraud event", "Return fraud rate, seller loss ratio", "CRITICAL", "AI-powered fraud detection at pickup + image comparison"],
        ["Sellers have no real-time visibility into returned inventory location or condition", "All marketplace sellers", "Cannot plan inventory replenishment or cash flow", "Inventory inaccuracy, inability to forecast restocking", "Double-ordering, phantom inventory, overstock", "Overproduction to compensate for invisible returns", "OMS returns data siloed from seller-facing dashboards", "Manual seller portal updates (10–14 day lag)", "Far too slow for operational decisions", "Seller return dashboard accuracy, days-to-reconcile", "HIGH", "Seller-facing real-time returns dashboard with condition tracking"],
        ["No profitability-based routing: sellers don't know if refurb ROI is positive", "SMB sellers, brand aggregators", "Items liquidated when refurbishment would be more profitable", "Direct revenue loss from suboptimal routing decisions", "Processing effort wasted when best path wasn't taken", "Items disposed/landfilled when economic refurb was possible", "No cost modeling tool exists in the returns flow", "Gut-feel decisions by warehouse staff", "Not data-driven; misses item-specific economics", "Per-item recovery rate, liquidation vs refurb split", "HIGH", "AI disposition engine with per-unit economic modeling"],
        ["Brands cannot control how their returned products are refurbished and re-presented", "Major brands (electronics, fashion, appliances)", "Brand damage from low-quality refurb under brand name", "Reputational damage; may pull from platform", "Inconsistent refurb quality standards", "Chemical/improper handling of brand products", "No brand governance framework in reverse logistics", "OEM-authorized refurb programs (limited reach)", "Covers only top OEMs; misses mid-tier brands entirely", "Brand perception score, customer return satisfaction by brand", "MEDIUM", "Brand governance layer in refurbishment certification"],
      ]),
      spaceP(),

      // 5.3 Logistics Issues
      h("5.3 Logistics & Physical Operations Issues", 2),
      spaceP(),
      issueTable([
        ["No condition-capture at pickup point — damage attribution is impossible", "Logistics partners, sellers, marketplace", "Customer disputes cannot be fairly resolved", "Fraud escalates; seller trust in platform erodes", "Every disputed return requires manual investigation (₹300–500 cost)", "Damaged items often scrapped due to unresolvable disputes", "Reverse logistics designed from cost-saving angle, not data-capture angle", "Spot checks by supervisors", "Non-systematic; misses most events", "Disputed return rate, damage attribution accuracy", "CRITICAL", "Mobile damage-capture app at pickup with AI photo assessment"],
        ["Tier 2/3 city returns travel 400–800 km to Tier 1 hubs unnecessarily", "Customers in non-metro areas, logistics partners", "Slower refunds for Tier 2/3 customers", "Higher per-return logistics cost for non-metro returns", "Long transit time = more damage, longer turnaround", "Higher carbon per return from unnecessary long-haul transport", "Centralized RPC infrastructure built for scale, not proximity", "Third-party pickup points", "Inadequate coverage and no local processing capability", "Days-to-process by city tier, carbon per return, logistics cost", "HIGH", "Hyperlocal return processing nodes in Tier 2/3 cities"],
        ["Return pickup failure rates are 15–25% on first attempt", "Customers, logistics partners", "Customer must reschedule; delays refund further", "Increased cost per pickup attempt; SLA violations", "Increased return handling time", "Additional vehicle trips = more emissions", "Customers not home; no flexible time-slot booking", "SMS reminders, time slot selection", "Window too broad (half-day); customers miss it", "Pickup success rate, re-attempt rate", "HIGH", "Flexible 1-hour return pickup slot booking with real-time tracking"],
        ["No cross-docking or smart routing to nearest refurb facility", "Logistics partners, refurb centers", "Items travel to hub then back out to refurb = double journey", "Transport cost 40–60% higher than direct routing", "Turnaround time 3–5 days longer than necessary", "Unnecessary fuel consumption, carbon emissions", "No real-time refurb capacity integration in logistics TMS", "Manual routing decisions", "Not optimized; no real-time visibility", "Routing efficiency, days-in-transit, cost per refurb item", "MEDIUM", "Smart logistics routing engine with refurb node integration"],
      ]),
      spaceP(),

      // 5.4 Quality Grading Issues
      h("5.4 Quality Grading & Authentication Issues", 2),
      spaceP(),
      issueTable([
        ["No standardized product grading system exists across India's recommerce market", "Buyers, sellers, refurbishers, platforms", "Buyer cannot compare Grade A from Platform A vs Platform B", "Low recommerce conversion; customer disappointment and churn", "Inconsistent inventory valuation; routing decisions suboptimal", "Items graded incorrectly — either over-processed or under-processed", "No industry body enforced standard; each player built own system", "Internal grading rubrics (A/B/C labels)", "Not disclosed to buyers; no external validation", "Grade accuracy, post-purchase return rate for refurb items", "CRITICAL", "Open grading standard + AI-assisted automated grading"],
        ["Manual visual inspection cannot detect internal damage (battery, motherboard)", "Buyers of electronics, refurbishers", "Item passes visual grade but fails within weeks of second use", "Returns of refurb items = double cost; reputation damage", "Secondary return processing, re-inspection, re-routing", "Two full return journeys for one defective item", "No functional test automation in inspection workflow", "Some OEM diagnostic tools (for own products only)", "Not available for 3rd-party sellers or non-OEM products", "Post-refurb defect rate, secondary return rate for refurb", "CRITICAL", "Automated functional test bench + AI defect detection"],
        ["Product authentication (genuine vs counterfeit return) has no scalable solution", "Brands, sellers, marketplace, buyers", "Fake items enter refurb pipeline; buyers get counterfeits", "Brand liability, seller loss, platform trust damage", "Fake items processed at cost, no value recovery", "Counterfeit items eventually landfilled as unresolvable", "No image-based or spec-based authentication layer in return flow", "Brand-specific authentication tools (serialization)", "Only covers branded SKUs; misses OEM-unlicensed products", "Authentication failure rate, counterfeit detection rate", "HIGH", "AI-powered image authentication at product intake"],
        ["Grading for non-electronic categories (apparel, furniture) is almost non-existent", "Buyers of fashion, home goods; sellers", "No quality trust for high-return categories where need is greatest", "Cannot build recommerce for 60%+ of returned product volume", "Returns in these categories go straight to liquidation", "High landfill rate for fashion returns especially", "Technology focus has been electronics; soft goods grading is a hard CV problem", "Visual inspection with rejection of 'used' apparel", "Binary pass/fail — no grade 1/2/3 nuance", "Category-specific return resolution rate", "HIGH", "Multi-modal AI grading for apparel (texture, stain, wear)"],
      ]),
      spaceP(),

      // 5.5 Technology & Data Issues
      h("5.5 Technology & Data Gaps", 2),
      spaceP(),
      issueTable([
        ["No AI-powered disposition engine to recommend optimal fate of each returned item", "Marketplace, sellers, warehouse teams", "Value lost through suboptimal routing (liquidate instead of refurb)", "₹3,000–5,000 crore/year in preventable value loss estimated", "Routing decisions made manually, slowly, inconsistently", "Items scrapped when economic alternatives exist", "Build cost + data infra investment not prioritized historically", "Rule-based routing (item type → category → disposition)", "Too rigid; ignores real-time market prices, item condition, demand", "Item recovery value, liquidation vs refurb rate", "CRITICAL", "AI disposition engine with real-time pricing + demand data"],
        ["Return prediction before purchase — no model deployed in product discovery", "Buyers, sellers, platform", "High-return products sold without risk warning to buyers", "Avoidable returns reduce profitability platform-wide", "Unnecessary processing of predictable returns", "Avoidable reverse logistics emissions", "Data exists but not operationalized in discovery flow", "Post-hoc return analysis reports", "Backward-looking only; no purchase-time intervention", "Return rate by product, return prediction accuracy", "HIGH", "Return likelihood score shown at product listing page"],
        ["No unified product identity / passport across its entire lifecycle", "All stakeholders", "Cannot trace product from manufacture → sale → return → refurb → resale", "Cannot certify refurbished item's history credibly", "No audit trail for multi-hop product journeys", "E-waste items untraceable for recycling compliance", "Forward logistics never needed item-level lifecycle tracking", "Serial number tracking (partial; electronics only)", "Doesn't capture condition changes, repairs, or ownership history", "Product traceability score, refurb certification trust", "HIGH", "Digital product passport with blockchain or append-only log"],
        ["Demand-supply matching for recommerce inventory is manual and inefficient", "Buyers, sellers, marketplace", "Right refurb item doesn't reach right buyer at right time/price", "Recommerce inventory piles up; deep discounting required", "Slow inventory turns in recommerce = capital locked up", "Slow-moving refurb items eventually disposed of", "No AI recommendation layer connecting returns to demand signals", "Static category pages for refurb products", "Passive discovery; no personalization or demand prediction", "Recommerce conversion rate, inventory age, GMV per refurb item", "HIGH", "AI-powered recommerce matching engine + personalized recommendations"],
        ["No sustainability data layer — carbon per return not calculated", "Marketplace, ESG-conscious buyers, regulators", "Cannot report carbon savings from circular commerce", "Cannot monetize ESG value; regulatory risk as laws tighten", "No data to optimize for carbon reduction in reverse logistics", "Returns contribute ~2–3kg CO2 per item on average; unmeasured", "Sustainability was not a business KPI historically", "Annual CSR report carbon estimates", "Not granular or real-time; cannot drive operational decisions", "Carbon per return, total circular commerce carbon saved", "MEDIUM", "Per-return carbon calculator + green impact dashboard"],
      ]),
      spaceP(),

      // 5.6 Trust & Transparency
      h("5.6 Trust & Transparency Problems", 2),
      spaceP(),
      issueTable([
        ["Buyers of refurbished products have no transparency into item history or repairs done", "Refurb buyers, brands", "Cannot make informed purchase decisions; often regret purchase", "High post-purchase return rate for refurb (18–22% vs 8% for new)", "Secondary return processing of refurb items is most expensive in pipeline", "Second full reverse logistics cycle for each double-return", "Refurb process has no digital documentation requirement", "Seller self-declaration of condition on listing", "Self-certified, unverifiable; no third-party audit", "Refurb item return rate, buyer satisfaction score", "CRITICAL", "Verified refurbishment report card per item (what was checked/fixed)"],
        ["Platform reviews for refurbished products are unreliable and misleading", "All refurb buyers", "Review from new-product buyer shown alongside refurb listing", "Trust destroyed; conversion collapses", "Distorted signals for disposition routing", "Good refurb items unsold due to review conflation = disposal", "Review system built for single product SKU, not condition-specific listings", "Condition filter on reviews (partial implementation)", "Not prominent; still shows aggregate star rating prominently", "Refurb-specific review volume, refurb NPS", "HIGH", "Condition-specific review and rating system for recommerce"],
        ["No verified seller identity or accountability in P2P resale", "P2P buyers, especially women and senior citizens", "Safety risk, financial fraud, ghost sellers", "Reputational damage if fraud occurs on-platform", "Dispute resolution cost is high for P2P fraud cases", "None direct", "P2P commerce was low priority vs managed marketplace", "ID verification at account creation", "Not transaction-specific; outdated verification", "P2P fraud rate, P2P completion rate, dispute volume", "HIGH", "Transaction-level identity verification + reputation scoring for P2P"],
        ["No clarity on warranty terms, who honors it, and how to claim for refurb items", "Refurb buyers", "Warranty honored differently by different sellers; claim experience terrible", "Lost sales due to warranty ambiguity; high post-sale support cost", "Unclear accountability = escalation to platform support", "None direct", "Warranty infrastructure designed for new products only", "Seller-stated warranty on listing", "Unenforceable; no standard claim process", "Warranty claim completion rate, warranty-related return rate", "HIGH", "Standardized warranty product for all certified refurb items"],
      ]),
      pageBreak(),

      // ═══ SECTION 6: ROOT CAUSE ANALYSIS ══════════════════════════════════════
      h("SECTION 6: ROOT CAUSE ANALYSIS — WHY THESE PROBLEMS PERSIST", 1),
      divider(),
      p("Understanding root causes is essential to avoid building solutions that treat symptoms. Below are the 8 systemic root causes behind the ecosystem's dysfunction:"),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [300, 2100, 3480, 3480],
        rows: [
          tableRow([headerCell("#", 300), headerCell("Root Cause", 2100), headerCell("How It Manifests", 3480), headerCell("Downstream Problems It Creates", 3480)]),
          tableRow([coloredCell("RC1", LIGHT_RED, 300, true, true), coloredCell("Forward Commerce Optimization Bias", LIGHT_GRAY, 2100, true), coloredCell("Every platform investment — tech, warehouse, logistics, analytics — has been optimized for the forward purchase journey. Returns are an afterthought.", WHITE, 3480), coloredCell("No AI in returns; no real-time tracking; no automation in inspection; no incentive architecture for circular commerce.", WHITE, 3480)]),
          tableRow([coloredCell("RC2", LIGHT_ORANGE, 300, true, true), coloredCell("Absence of a Standardized Grading Framework", LIGHT_GRAY, 2100, true), coloredCell("No industry-wide grade standard for used/refurbished goods in India. Each platform invented its own Grade A/B/C with different meanings.", WHITE, 3480), coloredCell("Buyer distrust, grade inflation, inconsistent resale pricing, inability to compare across platforms, high post-refurb return rates.", WHITE, 3480)]),
          tableRow([coloredCell("RC3", LIGHT_BLUE, 300, true, true), coloredCell("Returns Treated as Cost Center, Not Revenue Stream", LIGHT_GRAY, 2100, true), coloredCell("Historically, reverse logistics was budgeted as a cost to minimize. Revenue potential of recovered goods was never modeled.", WHITE, 3480), coloredCell("Liquidation default, no disposition engine investment, recommerce P&L never tracked, sustainable recovery never prioritized.", WHITE, 3480)]),
          tableRow([coloredCell("RC4", LIGHT_GREEN, 300, true, true), coloredCell("No Digital Product Identity Layer", LIGHT_GRAY, 2100, true), coloredCell("Products lack a persistent digital identity that carries condition, ownership, and repair history across their lifecycle.", WHITE, 3480), coloredCell("Cannot certify refurb history, cannot authenticate products, cannot build buyer trust, cannot comply with emerging e-waste regulations.", WHITE, 3480)]),
          tableRow([coloredCell("RC5", LIGHT_YELLOW, 300, true, true), coloredCell("Fragmented Physical Infrastructure for Reverse Logistics", LIGHT_GRAY, 2100, true), coloredCell("Return processing, refurbishment, and resale are handled by different entities with no integration — marketplaces, 3PLs, independent refurbishers, B2B liquidators.", WHITE, 3480), coloredCell("No end-to-end visibility, high transit distances, no smart routing, quality inconsistency, value leakage at every handoff.", WHITE, 3480)]),
          tableRow([coloredCell("RC6", LIGHT_PURPLE, 300, true, true), coloredCell("Incentive Misalignment Across Stakeholders", LIGHT_GRAY, 2100, true), coloredCell("Sellers want easy returns for customer satisfaction. Buyers want fast refunds. Logistics wants minimized pickups. Warehouse wants fast throughput. None of these align with maximizing item recovery value.", WHITE, 3480), coloredCell("Perverse outcomes: high return approvals, rushed inspections, low-ball liquidation, sustainable options bypassed.", WHITE, 3480)]),
          tableRow([coloredCell("RC7", LIGHT_RED, 300, true, true), coloredCell("Asymmetric Information at Every Handoff", LIGHT_GRAY, 2100, true), coloredCell("At each handoff (customer → pickup → warehouse → refurb → resale), information about the product's condition is lost, degraded, or not captured.", WHITE, 3480), coloredCell("Damage attribution failures, grading inconsistencies, fraudulent returns, buyer distrust, inability to certify refurb quality.", WHITE, 3480)]),
          tableRow([coloredCell("RC8", LIGHT_ORANGE, 300, true, true), coloredCell("Consumer Trust Deficit in Second-Hand Commerce", LIGHT_GRAY, 2100, true), coloredCell("Cultural reluctance (especially in India) to buy used goods, exacerbated by genuine bad experiences with misrepresented refurb products.", WHITE, 3480), coloredCell("Low recommerce conversion rates even when price is right, word-of-mouth negative amplification, growth ceiling on sustainable commerce.", WHITE, 3480)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 7: EXISTING SOLUTIONS & WHY THEY FAIL ═══════════════════════
      h("SECTION 7: EXISTING SOLUTIONS IN THE MARKET & THEIR LIMITATIONS", 1),
      divider(),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1600, 1800, 2500, 3460],
        rows: [
          tableRow([headerCell("Existing Solution", 1600), headerCell("Players", 1800), headerCell("What It Does", 2500), headerCell("Why It's Insufficient", 3460)]),
          tableRow([coloredCell("Amazon Renewed", LIGHT_GRAY, 1600, true), coloredCell("Amazon", WHITE, 1800), coloredCell("Certified refurbished products listed on separate store-within-store.", WHITE, 2500), coloredCell("No standardized inspection process visible to buyer. Low catalog depth. Poor discovery. No item-specific condition report. Trust still low.", WHITE, 3460)]),
          tableRow([coloredCell("Cashify", LIGHT_GRAY, 1600, true), coloredCell("Cashify", WHITE, 1800), coloredCell("Buy-back platform for smartphones. Gives instant quote + doorstep pickup.", WHITE, 2500), coloredCell("Works only for popular smartphone models. No multi-category support. Resale happens off-marketplace — no trust infrastructure.", WHITE, 3460)]),
          tableRow([coloredCell("OLX / Quikr", LIGHT_GRAY, 1600, true), coloredCell("Prosus / Quikr Media", WHITE, 1800), coloredCell("P2P classifieds for used goods. Broad category coverage.", WHITE, 2500), coloredCell("No quality assurance. Safety concerns (especially for women). Rampant fraud. Terrible UX for pricing and negotiation.", WHITE, 3460)]),
          tableRow([coloredCell("Apple Certified Refurb", LIGHT_GRAY, 1600, true), coloredCell("Apple India", WHITE, 1800), coloredCell("OEM-certified refurbishment with full warranty.", WHITE, 2500), coloredCell("Covers only Apple products. Prices remain high (only 10–15% below new). Not scalable to other brands.", WHITE, 3460)]),
          tableRow([coloredCell("Flipkart 2GUD", LIGHT_GRAY, 1600, true), coloredCell("Flipkart (defunct)", WHITE, 1800), coloredCell("Dedicated recommerce platform for unboxed/refurb goods.", WHITE, 2500), coloredCell("Shut down due to low traction. Proves the trust + discovery problem is not solved by a separate platform alone.", WHITE, 3460)]),
          tableRow([coloredCell("Back Market", LIGHT_GRAY, 1600, true), coloredCell("Back Market (Europe/US)", WHITE, 1800), coloredCell("Marketplace connecting certified refurbishers with buyers. Strong trust model.", WHITE, 2500), coloredCell("Not present in India. Model assumes sophisticated refurb ecosystem which India lacks.", WHITE, 3460)]),
          tableRow([coloredCell("Optoro (US)", LIGHT_GRAY, 1600, true), coloredCell("Optoro", WHITE, 1800), coloredCell("Returns optimization software for US retailers. AI routing for returned goods.", WHITE, 2500), coloredCell("B2B SaaS for large US retailers. India-specific logistics infra mismatch. Not available to Amazon India or Indian SMBs.", WHITE, 3460)]),
          tableRow([coloredCell("E-waste PROs (Attero, etc.)", LIGHT_GRAY, 1600, true), coloredCell("Attero, Karma Recycling", WHITE, 1800), coloredCell("Formal e-waste collection and recycling in India.", WHITE, 2500), coloredCell("Handles only true end-of-life items. No integration with returns/recommerce pipeline. Minimal consumer touchpoints.", WHITE, 3460)]),
          tableRow([coloredCell("Rule-based Fraud Detection", LIGHT_GRAY, 1600, true), coloredCell("All major platforms", WHITE, 1800), coloredCell("Flag accounts by return frequency, return value, account age.", WHITE, 2500), coloredCell("Cannot detect first-time fraud. Cannot catch sophisticated swap fraud. Binary allow/block damages genuine customers.", WHITE, 3460)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 8: SEVERITY PRIORITIZATION MATRIX ════════════════════════════
      h("SECTION 8: SEVERITY PRIORITIZATION MATRIX", 1),
      divider(),
      p("Problems ranked by: Customer Pain (1–5) × Business Impact (1–5) × Frequency (1–5). Max score = 125. Scores above 75 are critical for hackathon focus."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 1000, 1000, 1000, 1000, 1000, 2560],
        rows: [
          tableRow([headerCell("Problem", 2800), headerCell("Cust. Pain", 1000), headerCell("Biz Impact", 1000), headerCell("Frequency", 1000), headerCell("Complexity", 1000), headerCell("Score", 1000), headerCell("Priority", 2560)]),
          tableRow([coloredCell("No AI disposition engine for returned items", WHITE, 2800), coloredCell("4", LIGHT_RED, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("High", LIGHT_YELLOW, 1000, false, true), coloredCell("100", LIGHT_RED, 1000, true, true), coloredCell("CRITICAL — Core engine of Theme 3", WHITE, 2560)]),
          tableRow([coloredCell("Product description ↔ reality mismatch drives returns", WHITE, 2800), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("Medium", LIGHT_YELLOW, 1000, false, true), coloredCell("100", LIGHT_RED, 1000, true, true), coloredCell("CRITICAL — Return prevention", WHITE, 2560)]),
          tableRow([coloredCell("No standardized grading — buyer distrust of refurb", WHITE, 2800), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("Medium", LIGHT_YELLOW, 1000, false, true), coloredCell("100", LIGHT_RED, 1000, true, true), coloredCell("CRITICAL — Trust infrastructure", WHITE, 2560)]),
          tableRow([coloredCell("No item condition capture at return pickup", WHITE, 2800), coloredCell("4", LIGHT_RED, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("Low", LIGHT_GREEN, 1000, false, true), coloredCell("80", LIGHT_RED, 1000, true, true), coloredCell("CRITICAL — Fraud & quality foundation", WHITE, 2560)]),
          tableRow([coloredCell("Refund delay (5–10 days) after return", WHITE, 2800), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("Medium", LIGHT_YELLOW, 1000, false, true), coloredCell("75", LIGHT_ORANGE, 1000, true, true), coloredCell("HIGH — CX quick win", WHITE, 2560)]),
          tableRow([coloredCell("Return fraud (empty box, item swap)", WHITE, 2800), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("High", LIGHT_RED, 1000, false, true), coloredCell("60", LIGHT_ORANGE, 1000, true, true), coloredCell("HIGH — Platform trust & financials", WHITE, 2560)]),
          tableRow([coloredCell("No product history / passport for refurb items", WHITE, 2800), coloredCell("4", LIGHT_RED, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("High", LIGHT_RED, 1000, false, true), coloredCell("64", LIGHT_ORANGE, 1000, true, true), coloredCell("HIGH — Trust & certification", WHITE, 2560)]),
          tableRow([coloredCell("P2P resale unsafe and unsupported inside Amazon", WHITE, 2800), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("Medium", LIGHT_YELLOW, 1000, false, true), coloredCell("48", LIGHT_GREEN, 1000, true, true), coloredCell("MEDIUM — Revenue opportunity", WHITE, 2560)]),
          tableRow([coloredCell("No return prediction at product listing stage", WHITE, 2800), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("5", LIGHT_RED, 1000, false, true), coloredCell("4", LIGHT_ORANGE, 1000, false, true), coloredCell("Medium", LIGHT_YELLOW, 1000, false, true), coloredCell("60", LIGHT_ORANGE, 1000, true, true), coloredCell("HIGH — Return prevention", WHITE, 2560)]),
          tableRow([coloredCell("No green incentive / carbon visibility for buyers", WHITE, 2800), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("3", LIGHT_YELLOW, 1000, false, true), coloredCell("Low", LIGHT_GREEN, 1000, false, true), coloredCell("27", LIGHT_GREEN, 1000, true, true), coloredCell("MEDIUM — ESG / differentiation", WHITE, 2560)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 9: UNSOLVED PROBLEM SPACES ═══════════════════════════════════
      h("SECTION 9: PRIORITIZED LIST OF UNSOLVED PROBLEM SPACES", 1),
      divider(),
      p("The following are the highest-value, still-unsolved opportunities in the Second Life Commerce ecosystem as of 2025. Each represents a space where no adequate solution currently exists."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [300, 2800, 3130, 3130],
        rows: [
          tableRow([headerCell("#", 300), headerCell("Unsolved Problem Space", 2800), headerCell("Why It's Unsolved", 3130), headerCell("Potential Value if Solved", 3130)]),
          tableRow([coloredCell("U1", LIGHT_RED, 300, true, true), coloredCell("AI-powered disposition routing at item level", WHITE, 2800), coloredCell("Requires real-time pricing data, condition assessment, and demand modeling simultaneously — no platform has connected these.", WHITE, 3130), coloredCell("₹3,000–5,000 crore/year in recovered product value; significant margin improvement for sellers.", WHITE, 3130)]),
          tableRow([coloredCell("U2", LIGHT_RED, 300, true, true), coloredCell("Automated quality grading using image/video AI", WHITE, 2800), coloredCell("CV-based grading works for electronics but not apparel/furniture. No training dataset standardized for India's return mix.", WHITE, 3130), coloredCell("Reduces manual inspection cost by 60–70%; enables 10x return processing throughput.", WHITE, 3130)]),
          tableRow([coloredCell("U3", LIGHT_ORANGE, 300, true, true), coloredCell("Digital product passport for full lifecycle traceability", WHITE, 2800), coloredCell("Requires coordination across OEMs, marketplaces, refurbishers — no single party owns this data layer.", WHITE, 3130), coloredCell("Enables certified refurb trust; supports incoming EPR regulations; reduces fraud.", WHITE, 3130)]),
          tableRow([coloredCell("U4", LIGHT_ORANGE, 300, true, true), coloredCell("Return prevention engine at point of purchase", WHITE, 2800), coloredCell("Return prediction models exist internally but are not surfaced to buyers or sellers pre-purchase.", WHITE, 3130), coloredCell("5–10% reduction in returns = ₹1,500–3,000 crore cost avoidance + equivalent carbon savings.", WHITE, 3130)]),
          tableRow([coloredCell("U5", LIGHT_ORANGE, 300, true, true), coloredCell("Trustworthy P2P resale inside a managed marketplace", WHITE, 2800), coloredCell("P2P requires identity verification, pricing tools, dispute resolution, and safe meetup/delivery — complexity that pure classifieds avoid.", WHITE, 3130), coloredCell("Captures ₹15,000+ crore P2P market currently on OLX/Quikr with better trust and monetization.", WHITE, 3130)]),
          tableRow([coloredCell("U6", LIGHT_YELLOW, 300, true, true), coloredCell("Personalized recommerce discovery and recommendation", WHITE, 2800), coloredCell("Refurb/used inventory is unique (no two items identical). Standard collaborative filtering doesn't work without condition + demand-side matching.", WHITE, 3130), coloredCell("Improves recommerce conversion from ~2% to 8–12%; reduces recommerce inventory age by 40–60%.", WHITE, 3130)]),
          tableRow([coloredCell("U7", LIGHT_YELLOW, 300, true, true), coloredCell("Instant conditional refund infrastructure", WHITE, 2800), coloredCell("Requires fraud risk scoring at pickup point + financial product for immediate credit — two separate capabilities that haven't been joined.", WHITE, 3130), coloredCell("Major NPS improvement for returners; reduces CS calls by 30%; competitive differentiator.", WHITE, 3130)]),
          tableRow([coloredCell("U8", LIGHT_GREEN, 300, true, true), coloredCell("Green credit / carbon reward system for circular behaviors", WHITE, 2800), coloredCell("Requires carbon accounting per product type + reward redemption infrastructure. No marketplace has built this in India.", WHITE, 3130), coloredCell("Loyalty differentiation; ESG reporting value; Tier 1 buyer segment stickiness.", WHITE, 3130)]),
          tableRow([coloredCell("U9", LIGHT_GREEN, 300, true, true), coloredCell("Hyperlocal return processing to cut logistics cost & time", WHITE, 2800), coloredCell("Requires a network of local refurb partners with standardized processes — a physical infrastructure problem.", WHITE, 3130), coloredCell("Cuts per-return cost by 35–50% in Tier 2/3 cities; faster refunds; lower carbon per return.", WHITE, 3130)]),
          tableRow([coloredCell("U10", LIGHT_BLUE, 300, true, true), coloredCell("Cross-category refurbishment economics modeling", WHITE, 2800), coloredCell("No tool exists to calculate whether refurb is economically positive for a specific SKU at a specific condition grade in real time.", WHITE, 3130), coloredCell("Prevents false liquidations; maximizes per-item recovery; enables dynamic routing decisions.", WHITE, 3130)]),
        ]
      }),
      pageBreak(),

      // ═══ SECTION 10: HACKATHON FOCUS MAP ══════════════════════════════════════
      h("SECTION 10: HACKATHON FOCUS MAP — WHAT TO BUILD FOR THEME 3", 1),
      divider(),
      p("Based on the full problem analysis, the six most demo-able and impactful solution areas for a 48-hour hackathon are mapped below. Each maps to one or more unsolved problem spaces identified above."),
      spaceP(),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [300, 2400, 2200, 2200, 2260],
        rows: [
          tableRow([headerCell("#", 300), headerCell("Build Area", 2400), headerCell("Problems It Solves", 2200), headerCell("Core Tech Required", 2200), headerCell("Why Judges Will Love It", 2260)]),
          tableRow([coloredCell("1", LIGHT_RED, 300, true, true), coloredCell("AI Disposition Engine", WHITE, 2400), coloredCell("U1, U10 — Routing returned items to highest-value outcome", WHITE, 2200), coloredCell("CV (condition), price APIs (market value), demand model, routing decision tree", WHITE, 2200), coloredCell("Directly solves the core economic problem of Theme 3. Clear ₹ impact.", WHITE, 2260)]),
          tableRow([coloredCell("2", LIGHT_ORANGE, 300, true, true), coloredCell("Smart Grading via Image/Video AI", WHITE, 2400), coloredCell("U2 — Automated quality assessment replacing manual inspection", WHITE, 2200), coloredCell("Computer Vision / Multimodal AI (Bedrock), structured grading rubric", WHITE, 2200), coloredCell("Visual demo. Clear before/after. Solves consistency and scale problem.", WHITE, 2260)]),
          tableRow([coloredCell("3", LIGHT_YELLOW, 300, true, true), coloredCell("Return Prevention Score at Listing", WHITE, 2400), coloredCell("U4 — Show return likelihood before purchase", WHITE, 2200), coloredCell("ML on return history + listing attributes + category signals", WHITE, 2200), coloredCell("Preventive over reactive. Shows systems thinking. Low infra ask.", WHITE, 2260)]),
          tableRow([coloredCell("4", LIGHT_BLUE, 300, true, true), coloredCell("Verified Refurb Report Card + Product Passport", WHITE, 2400), coloredCell("U3, U6 — Rebuild buyer trust in certified refurbished", WHITE, 2200), coloredCell("Digital identity layer, QR-linked history, AI-generated condition summary", WHITE, 2200), coloredCell("Trust is THE problem for recommerce. Elegantly solves it with clear UX.", WHITE, 2260)]),
          tableRow([coloredCell("5", LIGHT_GREEN, 300, true, true), coloredCell("P2P Resale with AI Pricing + ID Verification", WHITE, 2400), coloredCell("U5 — Safe, priced, trusted C2C resale inside Amazon", WHITE, 2200), coloredCell("AI price estimation, identity verification, escrow logic", WHITE, 2200), coloredCell("Massive market opportunity. Every customer is a potential P2P seller.", WHITE, 2260)]),
          tableRow([coloredCell("6", LIGHT_PURPLE, 300, true, true), coloredCell("Green Credits & Sustainability Dashboard", WHITE, 2400), coloredCell("U8 — Reward customers for circular commerce choices", WHITE, 2200), coloredCell("Carbon calculator, reward points engine, impact visualization", WHITE, 2200), coloredCell("ESG angle. Differentiates Amazon. Strong emotional demo for judges.", WHITE, 2260)]),
        ]
      }),
      spaceP(),
      divider(),
      p("RECOMMENDATION FOR YOUR TEAM: Build items 1 + 2 + 4 as an integrated system — AI Grading feeds the Disposition Engine, which generates the Product Passport. This forms the complete intelligent reverse commerce backbone. Add item 6 (Green Credits) as a user-facing layer. This architecture addresses every critical-severity problem identified in this report.", { bold: false, italic: true }),
      spaceP(),
      divider(),
      new Paragraph({ spacing: { before: 240, after: 60 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HackOn with Amazon Season 6.0  •  Theme 3: Second Life Commerce  •  Problem Research Report", size: 18, color: "888888", font: "Arial", italics: true })] }),
      new Paragraph({ spacing: { before: 0, after: 0 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Solution-Agnostic Analysis  |  All Rights to Amazon / HackOn  |  For Hackathon Use Only", size: 16, color: "AAAAAA", font: "Arial" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = "./SecondLifeCommerce_ProblemResearch.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("Document created successfully.");
});