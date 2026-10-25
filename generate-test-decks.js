const fs = require('fs');
const PDFDocument = require('pdfkit');

function buildDeck(filename, meta, slides) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(fs.createWriteStream(filename));

  slides.forEach((slide, idx) => {
    if (idx > 0) doc.addPage();

    // Slide Header
    doc.fontSize(8).fillColor('#666666').text(`${meta.company} | ${meta.tagline} | Confidential Deck`, { align: 'right' });
    doc.moveDown(0.5);

    // Slide Number & Title
    doc.fontSize(18).fillColor('#111111').text(`Slide ${idx + 1}: ${slide.title}`, { bold: true });
    doc.moveDown(0.5);

    // Separator Line
    doc.strokeColor('#cccccc').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Slide Body Content
    doc.fontSize(10).fillColor('#222222').text(slide.body, { lineGap: 5, paragraphGap: 10 });
    
    // Slide Footer
    doc.fontSize(8).fillColor('#999999').text(`Page ${idx + 1} of ${slides.length} — Investment Evaluation Copy`, 45, 780, { align: 'center' });
  });

  doc.end();
  console.log(`Generated: ${filename} (${slides.length} Pages)`);
}

// -------------------------------------------------------------
// DECK 1: SENTINELOPS AI (MATCHING THESIS - 20 PAGES)
// -------------------------------------------------------------
const matchingSlides = [
  {
    title: "Executive Summary & Fund Mandate Alignment",
    body: "SentinelOps AI is an enterprise-grade cloud security and automated IAM runtime monitoring platform. Built strictly for B2B SaaS and high-volume Fintech infrastructure, our agentic engine remediates identity-based zero-day threats in under 4 seconds.\n\nKey Alignment:\n- Mandate Sector: Cybersecurity & Enterprise AI (B2B SaaS)\n- Compliance: SOC 2 Type II, ISO 27001, PCI-DSS Level 1 certified\n- Target ICP: Mid-market SaaS platforms and regulated fintech enterprises."
  },
  {
    title: "The Problem — Machine Identity Proliferation",
    body: "Modern microservices architectures utilize over 45 times more machine identities (API tokens, service accounts, ephemeral pods) than human identities. Existing identity management platforms (Okta, Ping) were architected for human single-sign-on, leaving non-human tokens completely unmonitored."
  },
  {
    title: "Market Validation & Security Blindspots",
    body: "Enterprise telemetry indicates that 84% of cloud security breaches in 2025-2026 originated from stale or misconfigured machine credentials. When a service token leaks via CI/CD pipelines, unauthorized lateral movement occurs in less than 9 minutes before human security analysts detect an anomaly."
  },
  {
    title: "The SentinelOps Autonomous Solution",
    body: "SentinelOps deploys eBPF-level lightweight agents across Kubernetes nodes and cloud environments. It maps real-time RPC communication topologies and enforces zero-trust boundaries dynamically without impacting pipeline throughput or engineering velocity."
  },
  {
    title: "Proprietary Agentic LLM Architecture",
    body: "Our patent-pending deterministic security engine operates in conjunction with local quantized models. It continuously analyzes container execution traces, isolates rogue IAM service accounts, and performs rollback interventions with zero false-positive disruption."
  },
  {
    title: "Product Capabilities & Threat Prevention",
    body: "- Autonomous Secret Rotation: Automatically rotates compromised AWS IAM and GitHub tokens.\n- Least-Privilege Enforcer: Continuously strips unused permissions across cloud clusters.\n- Dynamic Gateway Firewall: Inspects inter-service gRPC and REST transactions at line speed."
  },
  {
    title: "Multi-Cloud Integration Ecosystem",
    body: "Seamless zero-code integration across AWS, Google Cloud, Microsoft Azure, HashiCorp Vault, Datadog, Snowflake, and Kubernetes clusters. Average client time-to-value is under 15 minutes via our automated Helm deployment charts."
  },
  {
    title: "Market Opportunity (TAM / SAM / SOM)",
    body: "Total Addressable Market (TAM): Global Cloud Security is projected to reach $51.4 Billion by 2028.\nServiceable Addressable Market (SAM): Cloud Identity & Machine Governance accounts for $12.8 Billion.\nTarget Initial Beachhead: $2.1 Billion among North American and European B2B SaaS and Fintech firms."
  },
  {
    title: "Ideal Customer Profile & Sales Motion",
    body: "Targeting high-growth engineering organizations with 100 to 3,000 developers running cloud-native production workloads. Inbound velocity driven by developer adoption of our open-source credential scanner, transitioning to annual enterprise contracts."
  },
  {
    title: "Enterprise Case Study — Tier 1 Payment Gateway",
    body: "A Tier-1 European digital payments processor with 420 microservices deployed SentinelOps. Within 48 hours, SentinelOps identified 1,420 dormant administrative keys and thwarted two credential-stuffing campaigns against internal settlement APIs."
  },
  {
    title: "Enterprise Case Study — Global Logistics SaaS",
    body: "An enterprise supply-chain platform with 18,000 daily container rollouts achieved 100% compliance with ISO 27001 machine governance mandates, reducing cloud auditing overhead by 78% annually."
  },
  {
    title: "Competitive Landscape & Moat",
    body: "Unlike legacy SIEM providers (Splunk, Sentinel) that only generate static retrospective alerts, SentinelOps intervenes autonomously at runtime. Our telemetry dataset of 120M+ verified machine transactions creates an insurmountable data network effect."
  },
  {
    title: "SaaS Business Model & Pricing Tiers",
    body: "- Developer Tier: Free open-source local scanning.\n- Growth Tier: $2,500/month for up to 50 cloud compute nodes.\n- Enterprise Tier: $8,000 - $35,000/month annual commitments with custom SLAs, dedicated audit logs, and on-premise air-gapped support."
  },
  {
    title: "Historical Financial Growth Cohorts",
    body: "Demonstrated disciplined, capital-efficient growth over the preceding 12 months with net revenue retention (NRR) of 132% and gross churn below 0.8% monthly. Gross margin currently stands at 86% across all deployed accounts."
  },
  {
    title: "Audited Recurring Revenue Performance",
    body: "Current Financial Metrics (Strictly Verified):\n- Current Monthly Recurring Revenue (MRR): $48,500 / month\n- Annualized Run Rate (ARR): $582,000 ARR\n- Threshold Status: Comfortably clears institutional requirement of $420,000 ARR floor.\n- Month-over-Month Revenue Growth: 15.8% compounded."
  },
  {
    title: "Customer Concentration & Pipeline",
    body: "Top client represents 9% of total ARR (zero adverse concentration risk). Current sales pipeline features 34 vetted enterprise proof-of-concepts representing $1.8M in qualified annualized pipeline value."
  },
  {
    title: "The Fundraise Ask & Valuation Framework",
    body: "Target Investment Round: Seed Capital Round\n- Total Capital Ask: $2,500,000\n- Pre-Money Valuation: $15,500,000\n- Agreed Post-Money Valuation Cap: $18,000,000\n- Mandate Compliance: Fully compliant with Apex Family Office's $25.0M maximum fund valuation ceiling."
  },
  {
    title: "Strategic Use of Capital (24 Months)",
    body: "- 55% Core AI & Systems Engineering (Expanding runtime kernel team)\n- 30% Enterprise Direct Sales & Solutions Architecture\n- 10% Security Compliance & SOC Audits\n- 5% General Corporate & Working Capital"
  },
  {
    title: "Executive Founding Team",
    body: "Alex Vance (CEO): 11 years in enterprise cybersecurity; former Director of Cloud Threat Intelligence at CrowdStrike.\nDr. Elena Rostova (CTO): PhD in Distributed Systems from MIT; former Principal Security Architect at Datadog.\nMarcus Chen (Head of Product): Ex-Palo Alto Networks Product Lead."
  },
  {
    title: "Strategic Advisory Board & Closing Roadmap",
    body: "Advisors include former CISOs from top fintech institutions and lead maintainers of the Linux kernel eBPF project. Target round close date: End of Q4 2026. For diligence data room access: founders@sentinelops.ai."
  }
];

// -------------------------------------------------------------
// DECK 2: URBANBITE WELLNESS (FATAL DISQUALIFICATION - 20 PAGES)
// -------------------------------------------------------------
const failingSlides = [
  {
    title: "Company Story & Brand Mission",
    body: "UrbanBite is a boutique direct-to-consumer (D2C) food & beverage wellness enterprise. We create hand-crafted cold-pressed turmeric wellness shots, probiotic beverages, and artisan keto pastry boxes distributed across physical pop-up kiosks."
  },
  {
    title: "The Urban Consumer Wellness Crisis",
    body: "Busy urban office workers drink excessive artificial caffeine and consume processed cafeteria food, resulting in afternoon lethargy and poor gut biome vitality. There is an absence of locally-bottled cold-pressed juice inside suburban office parks."
  },
  {
    title: "Our Hand-Crafted Organic Product Range",
    body: "We blend 100% locally sourced organic fruits and herbs without preservatives or high-pressure processing:\n- Daily Vitality Ginger-Turmeric Shots (60ml)\n- Matcha Green Detox Tonics\n- Raw Gluten-Free Almond Flour Pastry Packs"
  },
  {
    title: "Physical Retail Kitchen Infrastructure",
    body: "We lease two commercial commissary kitchens in secondary industrial zones. Every morning at 4:00 AM, our culinary staff prepares small-batch recipes by hand and packs them in custom glass containers for van delivery."
  },
  {
    title: "Eco-Friendly Sustainable Glass Packaging",
    body: "To appeal to conscious millennials, we avoid recyclable plastic and use heavy Italian-imported apothecary glass bottles. We offer a 50-cent deposit return program for customers who return clean empty bottles to our kiosks."
  },
  {
    title: "Physical Kiosk Operations & Foot Traffic",
    body: "UrbanBite operates 6 temporary pop-up kiosks inside regional shopping malls and rapid-transit commuter stations. Foot traffic conversion rates average 2.1% during morning rush hours."
  },
  {
    title: "D2C Shopify E-Commerce Experience",
    body: "Customers can order custom weekly subscription bundles on our Shopify portal. We ship insulated foam ice-packs across two regional delivery zones via standard courier networks."
  },
  {
    title: "Supply Chain & Perishability Vulnerabilities",
    body: "Because our beverages are 100% preservative-free, inventory shelf-life is strictly limited to 72 hours under refrigeration. Spoilage losses currently average 19.4% of total manufacturing batches during hot summer months."
  },
  {
    title: "Social Media Influencer Marketing Strategy",
    body: "Our brand awareness relies heavily on gifting free product hampers to lifestyle and fitness micro-influencers on TikTok and Instagram. Customer acquisition cost (CAC) currently averages $48 per first-time buyer."
  },
  {
    title: "Unit Economics & High Cost of Goods (COGS)",
    body: "Unit Economics Breakdown:\n- Retail Selling Price per bottle: $7.50\n- Raw Ingredients & Organic Sourcing: $2.40\n- Glass Bottle & Custom Labeling: $1.90\n- Refrigerated Logistics: $1.30\n- Net Gross Margin: 25.3% (Severely sub-scale for institutional venture profile)."
  },
  {
    title: "Customer Retention & Subscription Churn",
    body: "Repeat purchase rates drop significantly after the initial trial discount. Monthly subscriber churn sits at 24.5%, with the average customer lifetime value (LTV) standing at $62 against our $48 acquisition cost."
  },
  {
    title: "Regional Delivery Logistics & Fuel Costs",
    body: "Maintaining our own fleet of 4 refrigerated delivery vans has led to unpredictable vehicle maintenance expenses and fuel cost volatility, further suppressing operating operating cash flows."
  },
  {
    title: "Competitive Landscape in Brick-and-Mortar Retail",
    body: "Facing intense shelf-space competition from major multinational beverage conglomerates (Coca-Cola, Suja, Naked Juice) who benefit from industrial economies of scale and national cold-chain logistics."
  },
  {
    title: "Expansion Roadblocks & Regulatory Permits",
    body: "Opening physical kiosks requires lengthy local municipal health department inspections and high commercial lease security deposits, restricting rapid horizontal expansion into new territories."
  },
  {
    title: "Historical Financial Performance & Revenue",
    body: "Financial Metrics for Last 12 Months:\n- Total Monthly Revenue (MRR equivalent): $3,150 / month\n- Annualized Revenue: ~$37,800 ARR\n- Fatal Violation: Severe failure against Apex Family Office's minimum mandate of $420,000 ARR floor."
  },
  {
    title: "Operating Burn & Cash Flow Deficit",
    body: "The business operates at a net cash loss of $14,000 monthly due to commissary kitchen rent, retail kiosk leases, and van depreciation. Current cash reserves stand at approximately 45 days of remaining runway."
  },
  {
    title: "The Fundraise Ask & Excessive Valuation",
    body: "Current Capital Ask:\n- Total Investment Sought: $6,000,000 Series A\n- Pre-Money Valuation: $29,000,000\n- Target Valuation Cap: $35,000,000\n- Fatal Violation: Grossly breaches Apex Family Office's maximum fund cap of $25.0M."
  },
  {
    title: "Proposed Use of Funds",
    body: "- 50% Opening 40 new physical retail kiosks in suburban strip malls\n- 30% National television advertising and influencer partnerships\n- 20% Purchasing high-speed automated bottling and pasteurization machinery"
  },
  {
    title: "Founding Team Background",
    body: "Chloe Adams (Founder & Creative Director): Former freelance fashion stylist and boutique bakery manager.\nTyler Smith (Head of Operations): 4 years experience managing local bar and catering events.\nNo technical, software engineering, or enterprise B2B sales background."
  },
  {
    title: "Summary of Investment Opportunity",
    body: "UrbanBite aims to bring organic artisanal beverages to mass retail consumers. We invite investors to participate in reshaping suburban breakfast habits. Contact: chloe@urbanbitewellness.com."
  }
];

// Generate both multi-page files
buildDeck('SentinelOps_Enterprise_20Pages_PASS.pdf', { company: 'SentinelOps AI', tagline: 'Enterprise Cloud Security' }, matchingSlides);
buildDeck('UrbanBite_Retail_20Pages_FAIL.pdf', { company: 'UrbanBite Wellness', tagline: 'D2C Artisan Food & Beverage' }, failingSlides);