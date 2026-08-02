import { Router } from 'express';
import { redis } from '../config/redis.js';
import { ok } from '../utils/api.js';
const router = Router();
router.get('/', async (_req, res) => ok(res, { status: 'healthy', redis: await redis.ping(), timestamp: new Date().toISOString() }));
export default router;
