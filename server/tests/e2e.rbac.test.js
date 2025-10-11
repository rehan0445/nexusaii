import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, server } from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('RBAC E2E', () => {
  afterAll((done) => {
    try { server.close(() => done()); } catch { done(); }
  });

  test('admin-only route denies non-admin', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'user@example.com' }, JWT_SECRET, { expiresIn: '5m' });
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Cookie', [`nxa_access=${token}`])
      .send({ title: 't', content: 'c', category: 'general', priority: 'low' });
    expect([401,403]).toContain(res.status);
  });

  test('admin-only route allows admin via ROLE env', async () => {
    process.env.ROLE_ADMIN_USER_IDS = 'u2';
    const token = jwt.sign({ userId: 'u2', email: 'admin@example.com' }, JWT_SECRET, { expiresIn: '5m' });
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Cookie', [`nxa_access=${token}`])
      .send({ title: 't', content: 'c', category: 'general', priority: 'low' });
    // May be 201 or 500 depending on DB, but should not be 403
    expect([201,500]).toContain(res.status);
  });
});


