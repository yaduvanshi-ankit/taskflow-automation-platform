import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import { redis } from '../config/redis.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { enqueueTask } from '../queues/task.queue.js';

async function seed() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash('DemoPass123!', 12);
  const user = await User.findOneAndUpdate({ email: 'demo@taskflow.local' }, { name: 'Demo User', passwordHash, role: 'user' }, { new: true, upsert: true, setDefaultsOnInsert: true });
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 12);
  await User.findOneAndUpdate({ email: 'admin@taskflow.local' }, { name: 'Admin User', passwordHash: adminPasswordHash, role: 'admin' }, { new: true, upsert: true, setDefaultsOnInsert: true });
  if (await Task.countDocuments({ ownerId: user._id }) === 0) {
    const tasks = await Task.create([{ title: 'Generate weekly report', description: 'Example completed job', ownerId: user._id, status: 'completed', priority: 'high' }, { title: 'Send customer digest', description: 'Example background job', ownerId: user._id, priority: 'medium' }]);
    await enqueueTask(tasks[1].id);
  }
  console.log('Seeded demo@taskflow.local / DemoPass123! (user)');
  console.log('Seeded admin@taskflow.local / AdminPass123! (admin)');
  await redis.quit(); process.exit(0);
}
seed().catch(async (error) => { console.error(error); await redis.quit(); process.exit(1); });
