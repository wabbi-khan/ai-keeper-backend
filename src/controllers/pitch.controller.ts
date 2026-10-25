import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { extractTextFromPdf } from '../utils/pdf';
import { evaluatePitchDeck } from '../services/ai-evaluator.service';

const submitPitchSchema = z.object({
  startupName: z.string().min(2, 'Startup name must be at least 2 characters'),
  tagline: z.string().optional().default(''),
  founderNames: z.string().min(2, 'Founder name(s) must be provided'),
  founderEmail: z.string().email('Invalid founder email address'),
  sector: z.string().min(2, 'Sector is required'),
  stage: z.string().optional().default('Seed'),
  reportedMrr: z.coerce.number().min(0, 'MRR cannot be negative').default(0),
  askAmount: z.coerce.number().min(0, 'Ask amount cannot be negative').default(0),
  valuation: z.coerce.number().min(0, 'Valuation cannot be negative').default(0),
  referenceId: z.string().optional(),
});

const updatePitchStatusSchema = z.object({
  status: z.enum(['TOP_1_PERCENT', 'REVIEW', 'REJECTED'] as const),
});

const parseQueryString = (val: unknown): string | undefined => {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim();
  }
  if (Array.isArray(val) && typeof val[0] === 'string' && val[0].trim().length > 0) {
    return val[0].trim();
  }
  return undefined;
};

const getIdParam = (req: Request): string | null => {
  const param = req.params.id;
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
    return param[0].trim();
  }
  return null;
};

const getSlugParam = (req: Request): string | null => {
  const param = req.params.slug;
  if (typeof param === 'string' && param.trim().length > 0) {
    return param.trim();
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
    return param[0].trim();
  }
  return null;
};

/**
 * POST /api/pitches/submit/:slug
 * Public founder submission endpoint with in-memory PDF deck upload,
 * raw binary PostgreSQL persistence (Bytes), and autonomous AI gatekeeper scoring.
 */
export const submitPitch = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = getSlugParam(req);

    if (!slug) {
      res.status(400).json({
        success: false,
        message: 'Investor slug parameter is required in URL.',
      });
      return;
    }

    // 1. Resolve investor thesis by slug
    const thesis = await prisma.investorThesis.findUnique({
      where: { slug },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            firmName: true,
          },
        },
      },
    });

    if (!thesis) {
      res.status(404).json({
        success: false,
        message: `Investment thesis not found for slug '${slug}'.`,
      });
      return;
    }

    // 2. Validate form fields
    const parseResult = submitPitchSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error in submission fields.',
        errors: parseResult.error.format(),
      });
      return;
    }

    const {
      startupName,
      tagline,
      founderNames,
      founderEmail,
      sector,
      stage,
      reportedMrr,
      askAmount,
      valuation,
    } = parseResult.data;

    // 3. In-Memory File Buffer Extraction & Text Parsing
    let deckData: Buffer | null = null;
    let deckFileName: string | null = null;
    let deckMimeType: string | null = null;
    let extractedText: string | null = null;

    if (req.file) {
      deckData = req.file.buffer || null;
      deckFileName = req.file.originalname || 'pitch-deck.pdf';
      deckMimeType = req.file.mimetype || 'application/pdf';

      if (req.file.buffer) {
        extractedText = await extractTextFromPdf(req.file.buffer);
      }
    }

    // 4. Generate Unique Reference ID
    const referenceId =
      typeof req.body?.referenceId === 'string' && req.body.referenceId.trim().length > 0
        ? req.body.referenceId.trim()
        : `${(thesis.slug || 'DEA').slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}-AI`;

    const deckUrl = deckData ? `/api/pitches/${referenceId}/deck` : null;

    // 5. Run AI Gatekeeper Evaluation
    const evaluation = await evaluatePitchDeck({
      pitchData: {
        startupName,
        tagline,
        founderNames,
        founderEmail,
        sector,
        stage,
        reportedMrr,
        askAmount,
        valuation,
      },
      pdfText: extractedText || undefined,
      thesis,
    });

    // 6. Persist Pitch record directly in PostgreSQL with deckData binary Bytes
    const newPitch = await prisma.pitch.create({
      data: {
        referenceId,
        deckData: deckData ? (deckData as any) : null,
        deckFileName,
        deckMimeType,
        deckUrl,
        deckPdfPath: deckFileName,
        startupName,
        tagline: tagline || '',
        founderNames,
        founderEmail,
        sector,
        stage: stage || 'Seed',
        reportedMrr,
        askAmount,
        valuation,
        extractedText: extractedText || null,
        matchScore: evaluation.matchScore,
        status: evaluation.status,
        summary: evaluation.summary,
        pros: evaluation.pros,
        cons: evaluation.cons,
        redFlags: evaluation.redFlags,
        thesisId: thesis.id,
      },
    });

    // 7. Return pitch data without sending huge binary buffer over JSON
    const { deckData: _, ...safePitch } = newPitch;

    res.status(201).json({
      success: true,
      message: 'Pitch deck submitted and evaluated by DealFlow AI gatekeeper successfully.',
      data: {
        ...safePitch,
        referenceId: newPitch.referenceId,
        deckFileName: newPitch.deckFileName,
        deckUrl: newPitch.deckUrl,
      },
    });
  } catch (error: any) {
    console.error('Error submitting pitch deck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process pitch submission.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * GET /api/pitches/:id/deck
 * Streams stored PDF file directly from PostgreSQL binary Bytes column.
 * Supports querying by pitch UUID or referenceId.
 */
export const getPitchDeckFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetId = getIdParam(req);

    if (!targetId) {
      res.status(400).json({
        success: false,
        message: 'Pitch ID or Reference ID parameter is required.',
      });
      return;
    }

    const pitch = await prisma.pitch.findFirst({
      where: {
        OR: [{ id: targetId }, { referenceId: targetId }],
      },
      select: {
        id: true,
        deckData: true,
        deckFileName: true,
        deckMimeType: true,
      },
    });

    if (!pitch || !pitch.deckData) {
      res.status(404).json({
        success: false,
        message: 'Pitch deck PDF not found.',
      });
      return;
    }

    const mimeType = pitch.deckMimeType || 'application/pdf';
    const fileName = pitch.deckFileName || 'pitch-deck.pdf';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pitch.deckData.length);
    res.send(pitch.deckData);
  } catch (error: any) {
    console.error('Error retrieving pitch deck file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream pitch deck file.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * GET /api/pitches?slug=...
 * Fetches pitch submissions linked to an investor thesis slug, ordered by matchScore descending.
 * Excludes heavy deckData binary buffer from result.
 */
export const getPitches = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = parseQueryString(req.query.slug) || req.user?.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message:
          'Investor slug is required as a query parameter (e.g., /api/pitches?slug=apex-family-office)',
      });
      return;
    }

    // Resolve thesis for slug
    const thesis = await prisma.investorThesis.findUnique({
      where: { slug },
    });

    if (!thesis) {
      res.status(404).json({
        success: false,
        message: `Investment thesis not found for slug '${slug}'.`,
      });
      return;
    }

    const status = parseQueryString(req.query.status);
    const sector = parseQueryString(req.query.sector);

    const whereClause: any = {
      thesisId: thesis.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (sector) {
      whereClause.sector = {
        contains: sector,
        mode: 'insensitive',
      };
    }

    const search = parseQueryString(req.query.search);
    if (search) {
      whereClause.OR = [
        { startupName: { contains: search, mode: 'insensitive' } },
        { founderNames: { contains: search, mode: 'insensitive' } },
        { sector: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { referenceId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Select fields excluding deckData binary buffer for fast transfer
    const pitches = await prisma.pitch.findMany({
      where: whereClause,
      select: {
        id: true,
        referenceId: true,
        deckFileName: true,
        deckMimeType: true,
        deckUrl: true,
        deckPdfPath: true,
        startupName: true,
        tagline: true,
        founderNames: true,
        founderEmail: true,
        sector: true,
        stage: true,
        reportedMrr: true,
        askAmount: true,
        valuation: true,
        extractedText: true,
        matchScore: true,
        status: true,
        summary: true,
        pros: true,
        cons: true,
        redFlags: true,
        submittedAt: true,
        thesisId: true,
      },
      orderBy: { matchScore: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: pitches.length,
      data: pitches,
    });
  } catch (error: any) {
    console.error('Error fetching pitches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pitch submissions.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * PATCH /api/pitches/:id/status
 * Updates a pitch's status (TOP_1_PERCENT, REVIEW, REJECTED).
 * Protected: requires authenticateInvestor and verifies investor owns the pitch's thesis.
 */
export const updatePitchStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getIdParam(req);

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Pitch ID parameter is required.',
      });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required to update pitch status.',
      });
      return;
    }

    const parseResult = updatePitchStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error in status parameter.',
        errors: parseResult.error.format(),
      });
      return;
    }

    // Find pitch and associated thesis to verify ownership
    const pitch = await prisma.pitch.findUnique({
      where: { id },
      include: { thesis: true },
    });

    if (!pitch) {
      res.status(404).json({
        success: false,
        message: `Pitch submission not found for ID '${id}'.`,
      });
      return;
    }

    // Verify ownership
    if (pitch.thesis.investorId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to manage pitches for this thesis.',
      });
      return;
    }

    // Update status
    const updatedPitch = await prisma.pitch.update({
      where: { id },
      data: { status: parseResult.data.status },
      select: {
        id: true,
        referenceId: true,
        deckFileName: true,
        deckMimeType: true,
        deckUrl: true,
        deckPdfPath: true,
        startupName: true,
        tagline: true,
        founderNames: true,
        founderEmail: true,
        sector: true,
        stage: true,
        reportedMrr: true,
        askAmount: true,
        valuation: true,
        extractedText: true,
        matchScore: true,
        status: true,
        summary: true,
        pros: true,
        cons: true,
        redFlags: true,
        submittedAt: true,
        thesisId: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Pitch status successfully updated to '${parseResult.data.status}'.`,
      data: updatedPitch,
    });
  } catch (error: any) {
    console.error('Error updating pitch status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pitch status.',
      error: error.message || 'Internal server error',
    });
  }
};
