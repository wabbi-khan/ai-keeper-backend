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
 * Deterministic institutional evaluation fallback engine
 * Used when OPENAI_API_KEY is missing or when the API call fails or times out.
 */
export const evaluatePitchDeckFallback = (
  input: PitchEvaluationInput,
): EvaluationResult => {
  const { pitchData, thesis, pdfText } = input;
  let score = 75;

  const redFlags: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [];

  // 1. Sector vertical alignment
  const sectorMatch = thesis.targetSectors.some(
    (s) =>
      s.toLowerCase().includes(pitchData.sector.toLowerCase()) ||
      pitchData.sector.toLowerCase().includes(s.toLowerCase()),
  );

  if (sectorMatch) {
    score += 10;
    pros.push(
      `Direct sector alignment with active investment mandate (${pitchData.sector}).`,
    );
  } else {
    score -= 15;
    redFlags.push(
      `Vertical divergence: '${pitchData.sector}' is outside mandated target sectors [${thesis.targetSectors.join(", ")}].`,
    );
  }

  // 2. MRR check
  if (pitchData.reportedMrr >= thesis.minMonthlyRev) {
    score += 10;
    pros.push(
      `Reported MRR ($${pitchData.reportedMrr.toLocaleString()}/mo) meets or exceeds threshold ($${thesis.minMonthlyRev.toLocaleString()}/mo).`,
    );
  } else {
    score -= 22;
    redFlags.push(
      `Revenue deficit: Reported MRR ($${pitchData.reportedMrr.toLocaleString()}) falls below fund minimum ($${thesis.minMonthlyRev.toLocaleString()}/mo).`,
    );
  }

  // 3. Valuation check
  if (pitchData.valuation > 0 && pitchData.valuation <= thesis.maxValuation) {
    score += 5;
    pros.push(
      `Target valuation ($${pitchData.valuation.toLocaleString()}) fits comfortably within $${thesis.maxValuation.toLocaleString()} fund cap.`,
    );
  } else if (pitchData.valuation > thesis.maxValuation) {
    score -= 18;
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
    score += 5;
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

  // 6. Documentation quality & Validity
  const isInvalidDocument = pdfText
    ? /(fbr|federal board of revenue|taxpayer|tax return|tax certificate|national tax|income tax|inland revenue|curriculum vitae|resume|birth certificate|passport|bank statement|utility bill|challan)/i.test(
        pdfText,
      )
    : false;

  if (isInvalidDocument) {
    score = 18;
    redFlags.unshift(
      "Invalid Document: Uploaded file is not a startup pitch deck (detected tax/administrative/personal paperwork). Formal startup pitch deck is required.",
    );
  } else if (pdfText && pdfText.trim().length > 150) {
    score += 2;
  } else {
    cons.push(
      "Pitch deck text extraction limited; qualitative review recommended.",
    );
  }

  // Fill standard pros and cons if needed
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

  score = Math.max(15, Math.min(97, score));

  let status: "TOP_1_PERCENT" | "REVIEW" | "REJECTED";
  if (score >= 85) {
    status = "TOP_1_PERCENT";
  } else if (score >= 60) {
    status = "REVIEW";
  } else {
    status = "REJECTED";
  }

  const summary = `${pitchData.startupName} is a ${pitchData.stage}-stage venture in ${pitchData.sector} reporting $${pitchData.reportedMrr.toLocaleString()}/mo MRR. Autonomous gatekeeper evaluation assigned a ${score}/100 mandate alignment score relative to ${thesis.firmName}'s investment parameters.`;

  return {
    matchScore: score,
    status,
    summary,
    pros: pros.slice(0, 3),
    cons: cons.slice(0, 2),
    redFlags,
  };
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Identifies transient OpenAI errors such as HTTP 503, 502, 429 (rate limit), or high demand.
 */
const isTransientOpenAIError = (error: any): boolean => {
  if (!error) return false;
  const status = error.status || error.code || error.statusCode;
  if (status === 503 || status === 502 || status === 504 || status === 429) {
    return true;
  }
  const msg = String(error.message || error).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("504") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("service unavailable")
  );
};

/**
 * Main AI Evaluator service using OpenAI with automatic deterministic fallback.
 */
export const evaluatePitchDeck = async (
  input: PitchEvaluationInput,
): Promise<EvaluationResult> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "OPENAI_API_KEY is not defined. Using deterministic evaluation fallback.",
    );
    return evaluatePitchDeckFallback(input);
  }

  try {
    const openai = new OpenAI({
      apiKey,
      timeout: 20000, // 20s request timeout
      maxRetries: 1,
    });

    const prompt = `Conduct a rigorous institutional gatekeeper evaluation of this startup's pitch deck submission against our investment thesis mandate.

INVESTOR THESIS MANDATE:
- Firm Name: ${input.thesis.firmName}
- Target Sectors: ${input.thesis.targetSectors.join(", ")}
- Minimum Monthly Revenue (MRR): $${input.thesis.minMonthlyRev.toLocaleString()}
- Maximum Valuation Cap: $${input.thesis.maxValuation.toLocaleString()}
- Preferred Stage: ${input.thesis.preferredStage}
- Mandate Criteria: ${input.thesis.customCriteria}

STARTUP SUBMISSION:
- Name: ${input.pitchData.startupName}
- Tagline: ${input.pitchData.tagline || "N/A"}
- Founders: ${input.pitchData.founderNames} (${input.pitchData.founderEmail})
- Vertical: ${input.pitchData.sector}
- Stage: ${input.pitchData.stage}
- Reported MRR: $${input.pitchData.reportedMrr.toLocaleString()}
- Ask Amount: $${input.pitchData.askAmount.toLocaleString()}
- Valuation: $${input.pitchData.valuation.toLocaleString()}

EXTRACTED PITCH DECK TEXT:
${input.pdfText ? input.pdfText.slice(0, 4000) : "No PDF deck attached; evaluate submitted deal data."}

CRITICAL DOCUMENT VALIDATION RULE:
Examine the EXTRACTED PITCH DECK TEXT above.
If the extracted text indicates the file is NOT a genuine startup pitch deck (e.g. it is a tax certificate, FBR or IRS document, taxpayer registration, government paperwork, personal resume / CV, invoice, utility bill, or unrelated administrative paperwork):
1. You MUST heavily penalize the matchScore: assign an integer strictly BELOW 30 (e.g., between 10 and 25).
2. You MUST set status to "REJECTED".
3. You MUST include this explicit redFlag: "Invalid Document: The uploaded PDF is not a valid startup pitch deck (appears to be administrative, tax, or personal paperwork). A formal investor pitch deck is required."
4. In the summary, state clearly that the submission was rejected due to an invalid/non-pitch deck document upload.

INSTRUCTIONS:
Return STRICT JSON with the following structure:
{
  "matchScore": integer (0 to 100),
  "status": "TOP_1_PERCENT" (if score >= 85), "REVIEW" (if score 60-84), or "REJECTED" (if score < 60 or document invalid),
  "summary": "Exactly 2 concise sentences providing an institutional briefing.",
  "pros": ["3 specific startup strengths"],
  "cons": ["2 specific operational or market risks"],
  "redFlags": ["Array of critical violations like invalid document, valuation > cap, or MRR < minimum. Return empty array if none."]
}`;

    const maxRetries = 2;
    const retryDelayMs = 2000;
    let responseText: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const completionPromise = openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a Senior Institutional Investment Analyst at ${input.thesis.firmName}. You evaluate startup pitches against thesis mandates with strict institutional precision. Always output valid JSON.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("OpenAI API call timed out after 20s")),
            20000,
          ),
        );

        const response = await Promise.race([
          completionPromise,
          timeoutPromise,
        ]);
        responseText = response.choices[0]?.message?.content || null;

        if (responseText) {
          break;
        }

        throw new Error("Empty response from OpenAI API");
      } catch (callError: any) {
        const canRetry =
          attempt < maxRetries && isTransientOpenAIError(callError);
        if (canRetry) {
          console.warn(
            `⚠️ OpenAI API transient error (${callError.message || callError}). Retrying in ${retryDelayMs / 1000}s (retry ${attempt + 1}/${maxRetries})...`,
          );
          await sleep(retryDelayMs);
          continue;
        }
        throw callError;
      }
    }

    if (!responseText) {
      throw new Error("Empty response from OpenAI API");
    }

    const parsed = JSON.parse(responseText);

    let matchScore =
      typeof parsed.matchScore === "number"
        ? Math.round(parsed.matchScore)
        : 75;
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
      "OpenAI evaluation failed or timed out. Falling back to deterministic engine:",
      error.message,
    );
    return evaluatePitchDeckFallback(input);
  }
};
