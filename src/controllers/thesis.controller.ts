import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';

const updateThesisSchema = z.object({
  firmName: z.string().min(2, 'Firm name must be at least 2 characters').optional(),
  targetSectors: z
    .array(z.string().min(1, 'Sector name cannot be empty'))
    .min(1, 'Select at least one target sector')
    .optional(),
  minMonthlyRev: z.coerce
    .number()
    .min(0, 'Minimum monthly revenue must be 0 or greater')
    .optional(),
  maxValuation: z.coerce
    .number()
    .min(0, 'Maximum valuation must be 0 or greater')
    .optional(),
  preferredStage: z.string().min(1, 'Preferred stage is required').optional(),
  customCriteria: z
    .string()
    .min(10, 'Custom criteria must be at least 10 characters')
    .optional(),
});

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
 * GET /api/thesis/:slug
 * Public/Protected endpoint to fetch an investor's thesis mandate by their unique slug.
 */
export const getThesisBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = getSlugParam(req);

    if (!slug) {
      res.status(400).json({
        success: false,
        message: 'Thesis slug parameter is required.',
      });
      return;
    }

    const thesis = await prisma.investorThesis.findUnique({
      where: { slug },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            firmName: true,
            slug: true,
            role: true,
          },
        },
      },
    });

    if (!thesis) {
      res.status(404).json({
        success: false,
        message: `Investment thesis mandate not found for slug '${slug}'.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: thesis,
    });
  } catch (error: any) {
    console.error('Error fetching thesis mandate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve investment thesis mandate.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * PUT /api/thesis/:slug
 * Protected endpoint for the authenticated investor to update their thesis parameters.
 */
export const updateThesisBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = getSlugParam(req);

    if (!slug) {
      res.status(400).json({
        success: false,
        message: 'Thesis slug parameter is required.',
      });
      return;
    }

    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required to update thesis mandate.',
      });
      return;
    }

    const parseResult = updateThesisSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error in thesis parameters.',
        errors: parseResult.error.format(),
      });
      return;
    }

    // Verify existing thesis
    const existingThesis = await prisma.investorThesis.findUnique({
      where: { slug },
    });

    if (!existingThesis) {
      res.status(404).json({
        success: false,
        message: `Investment thesis mandate not found for slug '${slug}'.`,
      });
      return;
    }

    // Verify ownership: authenticated investor must own this thesis
    if (existingThesis.investorId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this investment thesis.',
      });
      return;
    }

    const {
      targetSectors,
      minMonthlyRev,
      maxValuation,
      preferredStage,
      customCriteria,
      firmName,
    } = parseResult.data;

    // Execute thesis update
    const updatedThesis = await prisma.investorThesis.update({
      where: { slug },
      data: {
        ...(targetSectors !== undefined && { targetSectors }),
        ...(minMonthlyRev !== undefined && { minMonthlyRev }),
        ...(maxValuation !== undefined && { maxValuation }),
        ...(preferredStage !== undefined && { preferredStage }),
        ...(customCriteria !== undefined && { customCriteria }),
        ...(firmName !== undefined && { firmName }),
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            firmName: true,
            slug: true,
            role: true,
          },
        },
      },
    });

    // Sync firmName to InvestorUser if provided and changed
    if (firmName && firmName !== existingThesis.firmName) {
      await prisma.investorUser.update({
        where: { id: req.user.id },
        data: { firmName },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Investment thesis updated successfully',
      data: updatedThesis,
    });
  } catch (error: any) {
    console.error('Error updating thesis mandate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update investment thesis mandate.',
      error: error.message || 'Internal server error',
    });
  }
};
