import type { Response } from 'express';
export const ok = (res: Response, data: unknown, status = 200, meta?: object) => res.status(status).json({ success: true, data, meta });
export class ApiError extends Error { constructor(public status: number, message: string, public details?: unknown) { super(message); } }
