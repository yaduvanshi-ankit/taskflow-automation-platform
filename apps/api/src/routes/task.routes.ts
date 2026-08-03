import { Router } from 'express';
import { z } from 'zod';
import { Task, taskStatuses } from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError, ok } from '../utils/api.js';
import { enqueueTask, taskQueue } from '../queues/task.queue.js';
import { redis } from '../config/redis.js';
import { uploadAttachment } from '../middleware/upload.js';
const router = Router();
const taskInput = z.object({ title: z.string().min(1).max(140), description: z.string().max(3000).optional(), priority: z.enum(['low', 'medium', 'high']).optional(), scheduledFor: z.string().datetime().nullable().optional() });
const ownsTask = async (id: string, userId: string) => { const task = await Task.findOne({ _id: id, ownerId: userId }); if (!task) throw new ApiError(404, 'Task not found'); return task; };
const invalidateUserCache = async (userId: string) => {
  const keys = await redis.keys(`tasks:${userId}:*`);
  if (keys.length) {
    await redis.del(...keys);
  }
  await redis.del(`dashboard:${userId}`);
};

router.use(authenticate);
router.get('/', async (req, res) => { const query = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(10), search: z.string().optional(), status: z.enum(taskStatuses).optional(), priority: z.enum(['low', 'medium', 'high']).optional(), sort: z.enum(['newest', 'oldest', 'priority']).default('newest') }).parse(req.query); const key = `tasks:${req.user!.sub}:${JSON.stringify(query)}`; const cached = await redis.get(key); if (cached) return ok(res, JSON.parse(cached), 200, { cached: true }); const filter: Record<string, unknown> = { ownerId: req.user!.sub }; if (query.status) filter.status = query.status; if (query.priority) filter.priority = query.priority; if (query.search) filter.$text = { $search: query.search }; const sort: Record<string, 1 | -1> = query.sort === 'oldest' ? { createdAt: 1 } : query.sort === 'priority' ? { priority: -1, createdAt: -1 } : { createdAt: -1 }; const [items, total] = await Promise.all([Task.find(filter).sort(sort).skip((query.page - 1) * query.limit).limit(query.limit).lean(), Task.countDocuments(filter)]); const data = { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } }; await redis.set(key, JSON.stringify(data), 'EX', 30); return ok(res, data); });
router.post('/', uploadAttachment, async (req, res) => { const input = taskInput.parse(req.body); const attachment = req.file ? { filename: req.file.originalname, path: `/uploads/${req.file.filename}`, mimeType: req.file.mimetype, size: req.file.size } : undefined; const task = await Task.create({ ...input, attachment, scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null, ownerId: req.user!.sub }); await enqueueTask(task.id, task.scheduledFor); await invalidateUserCache(req.user!.sub); return ok(res, task, 201); });
router.patch('/:id', async (req, res) => {
  const input = taskInput.partial().parse(req.body);

  const task = await ownsTask(req.params.id, req.user!.sub);

  if (task.status === 'processing') {
    throw new ApiError(409, 'A processing task cannot be edited');
  }

  Object.assign(
    task,
    input,
    input.scheduledFor
      ? { scheduledFor: new Date(input.scheduledFor) }
      : {}
  );

  await task.save();

  await invalidateUserCache(req.user!.sub);

  return ok(res, task);
});
router.delete('/:id', async (req, res) => {
  const task = await ownsTask(req.params.id, req.user!.sub);

  if (task.status === 'processing') {
    throw new ApiError(409, 'A processing task cannot be deleted');
  }

  await taskQueue.remove(task.id).catch(() => undefined);

  await task.deleteOne();

  await invalidateUserCache(req.user!.sub);

  return res.status(204).send();
});

router.post('/:id/retry', async (req, res) => {
  const task = await ownsTask(req.params.id, req.user!.sub);

  if (task.status !== 'failed') {
    throw new ApiError(409, 'Only failed tasks can be retried');
  }

  task.status = 'pending';
  task.lastError = null;

  await task.save();

  await enqueueTask(task.id);

  await invalidateUserCache(req.user!.sub);

  return ok(res, task);
});

export default router;
