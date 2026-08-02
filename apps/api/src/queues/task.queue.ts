import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
export const TASK_QUEUE = 'task-execution';
export const taskQueue = new Queue(TASK_QUEUE, { connection: redis });
export const enqueueTask = (taskId: string, scheduledFor?: Date | null) => taskQueue.add('execute-task', { taskId }, { jobId: taskId, delay: scheduledFor && scheduledFor > new Date() ? scheduledFor.getTime() - Date.now() : 0, attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100, removeOnFail: 200 });
