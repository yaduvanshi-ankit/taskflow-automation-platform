import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/api.js';
import { verifyAccessToken } from '../utils/tokens.js';
export function authenticate(req: Request, _res: Response, next: NextFunction) { try { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) throw new ApiError(401, 'Authentication required'); req.user = verifyAccessToken(token); next(); } catch { next(new ApiError(401, 'Invalid or expired access token')); } }
export const authorize = (...roles: Array<'admin' | 'user'>) => (req: Request, _res: Response, next: NextFunction) => roles.includes(req.user!.role) ? next() : next(new ApiError(403, 'Insufficient permissions'));
