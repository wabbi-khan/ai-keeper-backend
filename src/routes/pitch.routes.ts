import { Router } from 'express';
import {
  getPitches,
  updatePitchStatus,
  submitPitch,
} from '../controllers/pitch-management.controller';
import { authenticateInvestor, optionalAuthenticate } from '../middlewares/auth.middleware';
import { handlePitchDeckUpload } from '../middlewares/upload';

const router = Router();

// POST /api/pitches/submit/:slug - Public founder pitch deck submission with PDF upload & AI scoring
router.post('/submit/:slug', handlePitchDeckUpload, submitPitch);

// GET /api/pitches?slug=... - Fetch pitches for an investor thesis (ordered by matchScore desc)
router.get('/', optionalAuthenticate, getPitches);

// PATCH /api/pitches/:id/status - Update a pitch's triage status (TOP_1_PERCENT, REVIEW, REJECTED)
router.patch('/:id/status', authenticateInvestor, updatePitchStatus);

export default router;
