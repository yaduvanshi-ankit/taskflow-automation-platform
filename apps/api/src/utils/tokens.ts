import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
export type JwtPayload = { sub: string; role: 'admin' | 'user'; email: string; jti?: string };
export const createAccessToken = (payload: JwtPayload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] });
export const createRefreshToken = (payload: JwtPayload) => { const jti = crypto.randomUUID(); return { jti, token: jwt.sign({ ...payload, jti }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'] }) }; };
export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
