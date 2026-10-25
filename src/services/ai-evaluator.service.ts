import OpenAI from "openai";

export interface PitchEvaluationInput {
  pitchData: {
    startupName: string;
    tagline?: string;
    founderNames: string;
    founderEmail: string;
    sector: string;
    stage: string;
    reportedMrr: number;
    askAmount: number;
    valuation: number;
  };
  pdfText?: string;
  thesis: {
    id: string;
    firmName: string;
    slug: string;
    targetSectors: string[];
    minMonthlyRev: number;
    maxValuation: number;
    preferredStage: string;
    customCriteria: string;
  };
}

export interface EvaluationResult {
  matchScore: number; // 0 to 100
  status: "TOP_1_PERCENT" | "REVIEW" | "REJECTED";
  summary: string;
  pros: string[];
  cons: string[];
  redFlags: string[];
}

/**
 * Sanitizes and compacts raw extracted PDF text to keep payload clean,
 * reduce prompt token size, and minimize API latency.
 * Slices to a maximum of 4,000 characters.
 */
export const cleanExtractedText = (rawText?: string): string => {
  if (!rawText) return "";
  return rawText
    .replace(/\t+/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, 4000);
};

/**
 * Deterministic institutional evaluation fallback engine
 * Used when GROQ_API_KEY is missing or when the API call fails or times out.
 */
export const evaluatePitchDeckFallback = (
  input: PitchEvaluationInput,
): EvaluationResult => {
  const { pitchData, thesis, pdfText } = input;
  const cleanedText = cleanExtractedText(pdfText);
  let score = 50;

  const redFlags: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [
    "Unverified document: Automated AI parsing was unavailable at submission time; manual document review is required.",
  ];

  // 1. Sector vertical alignment
  const sectorMatch = thesis.targetSectors.some(
    (s) =>
      s.toLowerCase().includes(pitchData.sector.toLowerCase()) ||
      pitchData.sector.toLowerCase().includes(s.toLowerCase()),
  );

  if (sectorMatch) {
    score += 5;
    pros.push(
      `Direct sector alignment with active investment mandate (${pitchData.sector}).`,
    );
  } else {
    score -= 5;
    redFlags.push(
      `Vertical divergence: '${pitchData.sector}' is outside mandated target sectors [${thesis.targetSectors.join(", ")}].`,
    );
  }

  // 2. MRR check
  if (pitchData.reportedMrr >= thesis.minMonthlyRev) {
    score += 5;
    pros.push(
      `Reported MRR ($${pitchData.reportedMrr.toLocaleString()}/mo) meets or exceeds threshold ($${thesis.minMonthlyRev.toLocaleString()}/mo).`,
    );
  } else {
    score -= 5;
    redFlags.push(
      `Revenue deficit: Reported MRR ($${pitchData.reportedMrr.toLocaleString()}) falls below fund minimum ($${thesis.minMonthlyRev.toLocaleString()}/mo).`,
    );
  }

  // 3. Valuation check
  if (pitchData.valuation > 0 && pitchData.valuation <= thesis.maxValuation) {
    score += 3;
    pros.push(
      `Target valuation ($${pitchData.valuation.toLocaleString()}) fits comfortably within $${thesis.maxValuation.toLocaleString()} fund cap.`,
    );
  } else if (pitchData.valuation > thesis.maxValuation) {
    score -= 5;
    redFlags.push(
      `Valuation overshoot: Valuation of $${pitchData.valuation.toLocaleString()} exceeds mandated cap of $${thesis.maxValuation.toLocaleString()}.`,
    );
  }

  // 4. Stage check
  const stageMatch =
    thesis.preferredStage
      .toLowerCase()
      .includes(pitchData.stage.toLowerCase()) ||
    pitchData.stage.toLowerCase().includes(thesis.preferredStage.toLowerCase());

  if (stageMatch) {
    score += 2;
  } else {
    cons.push(
      `Investment stage mismatch: Startup submitted as ${pitchData.stage}, whereas partnership prefers ${thesis.preferredStage}.`,
    );
  }

  // 5. Ask Amount vs Valuation Check
  if (pitchData.askAmount > 0 && pitchData.valuation > 0) {
    const dilution = (pitchData.askAmount / pitchData.valuation) * 100;
    if (dilution > 30) {
      cons.push(
        `High dilution round structure (${dilution.toFixed(1)}% of post-money equity).`,
      );
    } else if (dilution < 5) {
      cons.push(`Round allocation yields low equity ownership (<5%).`);
    }
  }

  // 6. Documentation quality & Validity check
  const isInvalidDocument = cleanedText
    ? /(fbr|federal board of revenue|taxpayer|tax return|tax certificate|national tax|income tax|inland revenue|curriculum vitae|resume|birth certificate|passport|bank statement|utility bill|challan)/i.test(
        cleanedText,
      )
    : false;

  if (isInvalidDocument) {
    redFlags.unshift(
      "Invalid Document: Uploaded file is not a startup pitch deck (detected tax/administrative/personal paperwork). Formal startup pitch deck is required.",
    );
  } else if (!cleanedText || cleanedText.length <= 150) {
    cons.push(
      "Pitch deck text extraction limited; qualitative review recommended.",
    );
  }

  // Fill standard pros if needed
  if (pros.length < 3) {
    pros.push(
      `Active founder leadership by ${pitchData.founderNames} in ${pitchData.sector}.`,
    );
  }
  if (pros.length < 3) {
    pros.push(
      `Demonstrated capital efficiency on currently requested ask of $${pitchData.askAmount.toLocaleString()}.`,
    );
  }
  if (cons.length < 2) {
    cons.push(
      `Competitive moat requires ongoing validation against incumbents in ${pitchData.sector}.`,
    );
  }

  // 1. Cap Fallback Score to Neutral: strictly between 40 and 55 (never exceeds 55, never reaches TOP_1_PERCENT)
  const finalScore = Math.max(40, Math.min(55, score));

  // 2. Enforce Status: force status to 'REVIEW' whenever fallback engine is triggered
  const status: "TOP_1_PERCENT" | "REVIEW" | "REJECTED" = "REVIEW";

  // 3. Transparent Fallback Summary
  const summary =
    "Automated AI evaluation is temporarily unavailable due to upstream service demand. Deal data recorded with a neutral baseline and queued for manual analyst review against " +
    thesis.firmName +
    "'s thesis parameters.";

  return {
    matchScore: finalScore,
    status,
    summary,
    pros: pros.slice(0, 3),
    cons: cons.slice(0, 3),
    redFlags,
  };
};

/**
 * Main AI Evaluator service using Groq API (via OpenAI SDK) with automatic deterministic fallback.
 */
export const evaluatePitchDeck = async (
  input: PitchEvaluationInput,
): Promise<EvaluationResult> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn(
      "GROQ_API_KEY is not defined. Using deterministic evaluation fallback.",
    );
    return evaluatePitchDeckFallback(input);
  }

  const cleanedText = cleanExtractedText(input.pdfText);

  try {
    const groq = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const prompt = `You are a Senior Institutional Investment Analyst at ${input.thesis.firmName}.
Conduct a rigorous gatekeeper evaluation of this startup submission against our investment thesis mandate.

MANDATORY STEP 1 — GENERALIZED PITCH DECK AUTHENTICITY & FORMAT CHECK:
First, critically evaluate whether the EXTRACTED PITCH DECK TEXT genuinely represents a legitimate Startup Pitch Deck or Investor Presentation.
- A valid pitch deck must exhibit core venture components such as:
  * Problem statement / market pain point
  * Solution, value proposition, or product architecture
  * Market size / TAM / SAM / SOM
  * Business model, pricing, or go-to-market strategy
  * Traction, milestones, KPIs, or growth metrics
  * Investment ask, fundraise target, or use of funds

DISQUALIFICATION RULE:
If the extracted text lacks these structural characteristics OR represents any other document type (e.g. personal resumes/CVs, tax certificates/FBR/IRS papers, utility bills, receipts, legal contracts, invoices, academic research articles, certificates, or unrelated random text):
1. Immediately assign matchScore between 5 and 15 (maximum 15).
2. Set status strictly to "REJECTED".
3. Add this critical note to redFlags:
   "Invalid document type: The uploaded document does not qualify as a startup pitch deck or investor presentation."
4. Set summary stating clearly that the document was rejected because it does not qualify as a startup pitch deck or investor presentation.
5. In pros, provide a brief note indicating manual document resubmission is required.
6. In cons, list the missing core venture components (e.g. "Missing problem/solution narrative, traction metrics, and fundraise economics.").
7. CRITICAL: Do NOT evaluate MRR, valuation, dilution, or sector mandate alignment if the document is not a pitch deck.

STEP 2 — MANDATE EVALUATION (ONLY IF STEP 1 PASSES AS A LEGITIMATE PITCH DECK):
Only proceed with thesis mandate matching (sector alignment, MRR requirements, valuation caps, dilution analysis) if the document successfully passes Step 1 as a legitimate pitch deck:
- Target Sectors: ${input.thesis.targetSectors.join(", ")}
- Minimum Monthly Revenue (MRR): $${input.thesis.minMonthlyRev.toLocaleString()}
- Maximum Valuation Cap: $${input.thesis.maxValuation.toLocaleString()}
- Preferred Stage: ${input.thesis.preferredStage}
- Mandate Criteria: ${input.thesis.customCriteria}

STARTUP SUBMISSION METADATA:
- Name: ${input.pitchData.startupName}
- Tagline: ${input.pitchData.tagline || "N/A"}
- Founders: ${input.pitchData.founderNames} (${input.pitchData.founderEmail})
- Vertical: ${input.pitchData.sector}
- Stage: ${input.pitchData.stage}
- Reported MRR: $${input.pitchData.reportedMrr.toLocaleString()}
- Ask Amount: $${input.pitchData.askAmount.toLocaleString()}
- Valuation: $${input.pitchData.valuation.toLocaleString()}

EXTRACTED PITCH DECK TEXT (FIRST 4,000 CHARACTERS):
${cleanedText || "No PDF deck attached; evaluate submitted deal data."}

JSON OUTPUT REQUIREMENTS:
Return STRICT JSON with the following structure:
{
  "matchScore": integer (0 to 100, or 5-15 if document fails Step 1),
  "status": "TOP_1_PERCENT" (if score >= 85), "REVIEW" (if score 60-84), or "REJECTED" (if score < 60 or invalid document),
  "summary": "Exactly 2 concise sentences providing an institutional briefing.",
  "pros": ["3 specific startup strengths, or note if rejected at Step 1"],
  "cons": ["2 specific operational or market risks, or missing deck sections"],
  "redFlags": ["Array of critical violations like invalid document type, valuation > cap, or MRR < minimum. Return empty array if none."]
}`;

    const primaryModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const candidateModels = [
      primaryModel,
      "llama-3.1-8b-instant",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ];
    // Deduplicate candidate models
    const modelsToTry = Array.from(new Set(candidateModels));

    let completion: any;
    let lastError: any;

    for (const model of modelsToTry) {
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a Senior Institutional Investment Analyst and Gatekeeper. Respond ONLY with a valid JSON object matching the requested schema.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1500,
        });

        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (callError: any) {
        lastError = callError;
        console.warn(
          `⚠️ Groq model '${model}' error: ${callError.message || callError}. Attempting alternative model...`,
        );
      }
    }

    const responseText = completion?.choices?.[0]?.message?.content;
    if (!responseText) {
      throw lastError || new Error("Empty response from Groq API");
    }

    const parsed = JSON.parse(responseText);

    let matchScore =
      typeof parsed.matchScore === "number"
        ? Math.round(parsed.matchScore)
        : 50;
    matchScore = Math.max(0, Math.min(100, matchScore));

    let status: "TOP_1_PERCENT" | "REVIEW" | "REJECTED";
    if (parsed.status === "REJECTED" || matchScore < 60) {
      status = "REJECTED";
    } else if (parsed.status === "TOP_1_PERCENT" && matchScore >= 85) {
      status = "TOP_1_PERCENT";
    } else {
      status = "REVIEW";
    }

    return {
      matchScore,
      status,
      summary:
        parsed.summary ||
        `${input.pitchData.startupName} evaluation completed.`,
      pros:
        Array.isArray(parsed.pros) && parsed.pros.length > 0
          ? parsed.pros.slice(0, 3)
          : ["Strong founder vision"],
      cons:
        Array.isArray(parsed.cons) && parsed.cons.length > 0
          ? parsed.cons.slice(0, 2)
          : ["Early market validation required"],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    };
  } catch (error: any) {
    console.warn(
      "Groq AI evaluation failed or timed out. Falling back to deterministic engine:",
      error.message,
    );
    return evaluatePitchDeckFallback(input);
  }
};
