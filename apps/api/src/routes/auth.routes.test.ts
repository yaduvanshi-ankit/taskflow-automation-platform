import request from 'supertest';
import { app } from '../app.js';

const credentials = { name: 'Ada Lovelace', email: 'ada@example.test', password: 'Passw0rd!123' };

describe('Auth routes', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: credentials.name, email: credentials.email, role: 'user' });
    expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
  });

  it('rejects duplicate registration emails', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    const res = await request(app).post('/api/v1/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with a short password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...credentials, email: 'short@example.test', password: '123' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
    const good = await request(app).post('/api/v1/auth/login').send({ email: credentials.email, password: credentials.password });
    expect(good.status).toBe(200);
    expect(good.body.data.accessToken).toEqual(expect.any(String));

    const bad = await request(app).post('/api/v1/auth/login').send({ email: credentials.email, password: 'WrongPassword1' });
    expect(bad.status).toBe(401);
  });

  it('rotates the refresh session and logs out cleanly', async () => {
    const register = await request(app).post('/api/v1/auth/register').send(credentials);
    const cookie = register.headers['set-cookie'];

    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));

    const newCookie = refreshed.headers['set-cookie'];
    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', newCookie);
    expect(logout.status).toBe(200);
  });

  it('rejects a refresh without a cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });
});
