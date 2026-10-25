import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface InvestorPayload {
  id: string;
  email: string;
  slug: string;
  firmName: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: InvestorPayload;
    }
  }
}

export const authenticateInvestor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: "Authorization token missing or malformed. Format should be 'Bearer <token>'",
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'dealflow_super_secret_jwt_key_2026';

  try {
    const decoded = jwt.verify(token, jwtSecret) as InvestorPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      slug: decoded.slug,
      firmName: decoded.firmName,
      role: decoded.role,
    };
    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

/**
 * Optional authentication middleware:
 * If Bearer token is provided and valid, attaches req.user.
 * Does not block the request if token is absent or invalid.
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET || 'dealflow_super_secret_jwt_key_2026';

  try {
    const decoded = jwt.verify(token, jwtSecret) as InvestorPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      slug: decoded.slug,
      firmName: decoded.firmName,
      role: decoded.role,
    };
  } catch {
    // Continue without req.user
  }

  next();
};
