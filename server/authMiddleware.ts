import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Use JWT_SECRET or fallback to SESSION_SECRET for production security
if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET or SESSION_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "development_secret_change_in_production";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticateJWT;