import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.ts';
import { getTenantId } from '../lib/tenant.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    const tenantId = getTenantId();

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, tenantId }).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found or mismatch tenant' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
