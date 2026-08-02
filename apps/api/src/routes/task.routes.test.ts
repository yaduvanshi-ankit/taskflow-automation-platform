import request from 'supertest';
import { app } from '../app.js';

async function registerUser(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'Passw0rd!123' });
  return res.body.data.accessToken as string;
}

describe('Task routes', () => {
  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
  });

  it('creates, lists, updates, and deletes a task for the owning user', async () => {
    const token = await registerUser('owner@example.test');

    const create = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Generate report')
      .field('priority', 'high');
    expect(create.status).toBe(201);
    const taskId = create.body.data._id;

    const list = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.pagination.total).toBe(1);

    const update = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated description' });
    expect(update.status).toBe(200);
    expect(update.body.data.description).toBe('Updated description');

    const remove = await request(app).delete(`/api/v1/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(remove.status).toBe(204);

    const listAfter = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${token}`);
    expect(listAfter.body.data.items).toHaveLength(0);
  });

  it('isolates tasks between different users', async () => {
    const tokenA = await registerUser('a@example.test');
    const tokenB = await registerUser('b@example.test');

    await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${tokenA}`).field('title', 'A task');

    const listB = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${tokenB}`);
    expect(listB.body.data.items).toHaveLength(0);
  });

  it("prevents one user from editing or deleting another user's task", async () => {
    const tokenA = await registerUser('owner2@example.test');
    const tokenB = await registerUser('intruder@example.test');

    const create = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${tokenA}`).field('title', 'Private task');
    const taskId = create.body.data._id;

    const patch = await request(app).patch(`/api/v1/tasks/${taskId}`).set('Authorization', `Bearer ${tokenB}`).send({ title: 'Hijacked' });
    expect(patch.status).toBe(404);

    const del = await request(app).delete(`/api/v1/tasks/${taskId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(del.status).toBe(404);
  });

  it('filters, searches, and paginates tasks', async () => {
    const token = await registerUser('filter@example.test');
    const titles = ['Send invoices', 'Backup database', 'Send newsletter'];
    for (const title of titles) {
      await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).field('title', title).field('priority', 'low');
    }

    const search = await request(app).get('/api/v1/tasks?search=Send').set('Authorization', `Bearer ${token}`);
    expect(search.body.data.items).toHaveLength(2);

    const paged = await request(app).get('/api/v1/tasks?page=1&limit=2').set('Authorization', `Bearer ${token}`);
    expect(paged.body.data.items).toHaveLength(2);
    expect(paged.body.data.pagination.pages).toBe(2);
  });

  it('only allows retrying a failed task', async () => {
    const token = await registerUser('retry@example.test');
    const create = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).field('title', 'Pending task');
    const taskId = create.body.data._id;

    const retry = await request(app).post(`/api/v1/tasks/${taskId}/retry`).set('Authorization', `Bearer ${token}`);
    expect(retry.status).toBe(409);
  });

  it('rejects task creation without a title', async () => {
    const token = await registerUser('validation@example.test');
    const res = await request(app).post('/api/v1/tasks').set('Authorization', `Bearer ${token}`).field('title', '');
    expect(res.status).toBe(400);
  });
});
