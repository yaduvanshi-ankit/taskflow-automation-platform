import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { Task, taskStatuses } from '../models/Task.js';
import { User } from '../models/User.js';
import { ok } from '../utils/api.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/users', async (_req, res) => {
  const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 }).lean();
  return ok(res, users);
});

router.get('/tasks', async (req, res) => {
  const query = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(taskStatuses).optional()
    })
    .parse(req.query);
  const filter: Record<string, unknown> = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Task.countDocuments(filter)
  ]);
  return ok(res, { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
});

router.get('/stats', async (_req, res) => {
  const [userCount, byStatus] = await Promise.all([
    User.countDocuments(),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  const statusCounts = Object.fromEntries(byStatus.map(({ _id, count }) => [_id, count]));
  return ok(res, { totalUsers: userCount, tasksByStatus: statusCounts });
});

export default router;
