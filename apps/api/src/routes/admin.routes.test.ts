import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { createAccessToken } from '../utils/tokens.js';

async function registerUser(email: string, role: 'user' | 'admin' = 'user') {
  const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test User', email, password: 'Passw0rd!123' });
  if (role === 'admin') {
    await User.findByIdAndUpdate(res.body.data.user.id, { role: 'admin' });
  }
  const token = createAccessToken({ sub: res.body.data.user.id, role, email });
  return token;
}

describe('Admin routes', () => {
  it('blocks non-admin users', async () => {
    const token = await registerUser('regular@example.test', 'user');
    const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.status).toBe(401);
  });

  it('allows an admin to list users and cross-user tasks', async () => {
    const adminToken = await registerUser('admin1@example.test', 'admin');
    const userToken = await registerUser('member@example.test', 'user');
    await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${userToken}`).field('title', 'Member task');

    const users = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(users.status).toBe(200);
    expect(users.body.data.length).toBeGreaterThanOrEqual(2);

    const tasks = await request(app).get('/api/v1/admin/tasks').set('Authorization', `Bearer ${adminToken}`);
    expect(tasks.status).toBe(200);
    expect(tasks.body.data.items.length).toBeGreaterThanOrEqual(1);

    const stats = await request(app).get('/api/v1/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalUsers).toBeGreaterThanOrEqual(2);
  });
});
