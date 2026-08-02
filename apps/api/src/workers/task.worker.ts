import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { TASK_QUEUE } from '../queues/task.queue.js';
import { Task } from '../models/Task.js';
import type { Server } from 'socket.io';
export const startTaskWorker = (io: Server) => new Worker(TASK_QUEUE, async (job) => { const task = await Task.findById(job.data.taskId); if (!task) return; task.status = 'processing'; task.attempts += 1; await task.save(); io.to(`user:${task.ownerId}`).emit('task:updated', task); await new Promise((resolve) => setTimeout(resolve, 1200)); try { if (task.title.toLowerCase().includes('[fail]')) throw new Error('Simulated task failure requested by title'); task.status = 'completed'; task.lastError = null; await task.save(); await redis.del(`dashboard:${task.ownerId}`); io.to(`user:${task.ownerId}`).emit('task:updated', task); } catch (error) { task.status = 'failed'; task.lastError = error instanceof Error ? error.message : 'Unknown execution error'; await task.save(); await redis.del(`dashboard:${task.ownerId}`); io.to(`user:${task.ownerId}`).emit('task:updated', task); throw error; } }, { connection: redis });
