import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  getPitches,
  updatePitchStatus,
  submitPitch,
  getPitchDeckFile,
} from '../controllers/pitch.controller';
import { authenticateInvestor, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

// In-Memory Multer configuration (stores PDF binary directly in req.file.buffer)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are accepted for pitch decks.'));
    }
  },
});

/**
 * Upload middleware accepting field names: 'file' || 'deck' || 'pitchDeck'
 * using memoryStorage and populating req.file.buffer.
 */
export const pitchUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'deck', maxCount: 1 },
    { name: 'pitchDeck', maxCount: 1 },
  ])(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            message: 'Pitch deck PDF exceeds maximum allowed size of 25MB.',
          });
          return;
        }
        res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
      return;
    }

    if (!req.file && req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.file = files['file']?.[0] || files['deck']?.[0] || files['pitchDeck']?.[0];
    }

    next();
  });
};

// POST /api/pitches/submit/:slug - Public founder pitch deck submission with in-memory PDF & AI scoring
router.post('/submit/:slug', pitchUploadMiddleware, submitPitch);

// GET /api/pitches/:id/deck - Stream stored PDF file directly from PostgreSQL binary data (by UUID or referenceId)
router.get('/:id/deck', getPitchDeckFile);

// GET /api/pitches?slug=... - Fetch pitches for an investor thesis (ordered by matchScore desc)
router.get('/', optionalAuthenticate, getPitches);

// PATCH /api/pitches/:id/status - Update a pitch's triage status (TOP_1_PERCENT, REVIEW, REJECTED)
router.patch('/:id/status', authenticateInvestor, updatePitchStatus);

export default router;
