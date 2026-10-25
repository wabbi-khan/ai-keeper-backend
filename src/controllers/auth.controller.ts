import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firmName: z.string().min(2, 'Firm name must be at least 2 characters'),
  slug: z.string().optional(),
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || 'dealflow_super_secret_jwt_key_2026';
};

/**
 * Register a new Investor and create default investment thesis
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.format(),
      });
      return;
    }

    const { name, email, password, firmName, role } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists with this email
    const existingUser = await prisma.investorUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An investor account with this email already exists.',
      });
      return;
    }

    // Determine unique slug
    let baseSlug = parseResult.data.slug ? slugify(parseResult.data.slug) : slugify(firmName);
    if (!baseSlug) {
      baseSlug = `investor-${Math.random().toString(36).substring(2, 7)}`;
    }

    let finalSlug = baseSlug;
    let slugExists = await prisma.investorUser.findUnique({ where: { slug: finalSlug } });
    let counter = 1;

    while (slugExists) {
      finalSlug = `${baseSlug}-${counter}`;
      slugExists = await prisma.investorUser.findUnique({ where: { slug: finalSlug } });
      counter++;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and initial thesis in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.investorUser.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          firmName,
          slug: finalSlug,
          role: role || 'Managing Partner',
        },
      });

      const newThesis = await tx.investorThesis.create({
        data: {
          firmName,
          slug: finalSlug,
          targetSectors: ['B2B SaaS', 'Fintech', 'AI / Enterprise Tech', 'HealthTech'],
          minMonthlyRev: 10000,
          maxValuation: 15000000,
          preferredStage: 'Seed / Series A',
          customCriteria:
            'High-growth software companies with clear product-market fit, scalable unit economics, and defensible technology moats.',
          investorId: newUser.id,
        },
      });

      return { user: newUser, thesis: newThesis };
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        slug: result.user.slug,
        firmName: result.user.firmName,
        role: result.user.role,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Investor registered successfully',
      data: {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          firmName: result.user.firmName,
          slug: result.user.slug,
          role: result.user.role,
          createdAt: result.user.createdAt,
        },
        thesisSlug: result.thesis.slug,
        thesis: result.thesis,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register investor account.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Login Investor
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parseResult.error.format(),
      });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.investorUser.findUnique({
      where: { email: normalizedEmail },
      include: { thesis: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        slug: user.slug,
        firmName: user.firmName,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          firmName: user.firmName,
          slug: user.slug,
          role: user.role,
          createdAt: user.createdAt,
        },
        thesisSlug: user.thesis?.slug || user.slug,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authenticate investor.',
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get current authenticated investor profile + thesis
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized request',
      });
      return;
    }

    const user = await prisma.investorUser.findUnique({
      where: { id: req.user.id },
      include: { thesis: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Investor profile not found.',
      });
      return;
    }

    const { passwordHash: _, ...userProfile } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userProfile,
        thesis: user.thesis,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message || 'Internal server error',
    });
  }
};
