import { Router } from 'express';
import { getThesisBySlug, updateThesisBySlug } from '../controllers/thesis.controller';
import { authenticateInvestor } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/thesis/:slug - Fetch thesis mandate by unique investor slug (public or protected)
router.get('/:slug', getThesisBySlug);

// PUT /api/thesis/:slug - Update thesis parameters (protected by JWT authenticateInvestor)
router.put('/:slug', authenticateInvestor, updateThesisBySlug);

export default router;
