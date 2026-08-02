import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api.js';

export const notFound: RequestHandler = (_req, _res, next) => next(new ApiError(404, 'Route not found'));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: { message: 'Validation failed', details: err.flatten() } });
  }
  const status = err instanceof ApiError ? err.status : err?.name === 'ValidationError' ? 422 : err?.name === 'MulterError' ? 400 : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, error: { message: err.message || 'Internal server error', details: err instanceof ApiError ? err.details : undefined } });
};
