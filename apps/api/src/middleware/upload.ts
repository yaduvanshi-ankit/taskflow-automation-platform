import multer from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/api.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`)
});
export const uploadAttachment = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => { if (!allowedTypes.has(file.mimetype)) return callback(new ApiError(415, 'Only JPG, PNG, WEBP, and PDF files are allowed')); callback(null, true); } }).single('attachment');
