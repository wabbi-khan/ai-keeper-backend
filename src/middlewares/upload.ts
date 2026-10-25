import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const isPdf =
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents (.pdf) are accepted for pitch decks.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB maximum
  },
  fileFilter,
});

/**
 * Handles pitch deck upload in-memory supporting field names: 'file', 'pitchDeck', or 'deck'.
 */
const uploadAnyField = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'pitchDeck', maxCount: 1 },
  { name: 'deck', maxCount: 1 },
]);

/**
 * Middleware wrapper around Multer memoryStorage to catch errors,
 * normalize req.file from fields, and return structured 400 responses.
 */
export const handlePitchDeckUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadAnyField(req, res, (err: any) => {
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
        message: err.message || 'Only PDF documents (.pdf) are accepted for pitch decks.',
      });
      return;
    }

    // Normalize req.file if uploaded via fields
    if (!req.file && req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.file = files['file']?.[0] || files['pitchDeck']?.[0] || files['deck']?.[0];
    }

    next();
  });
};
