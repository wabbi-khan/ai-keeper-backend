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
    fileSize: 15 * 1024 * 1024, // 15MB maximum
  },
  fileFilter,
});

/**
 * Middleware wrapper around upload.single('pitchDeck') to catch errors
 * and return structured 400 responses for non-PDF files and file size limits.
 */
export const handlePitchDeckUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uploadSingle = upload.single('pitchDeck');

  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            message: 'Pitch deck PDF exceeds maximum allowed size of 15MB.',
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
    next();
  });
};
