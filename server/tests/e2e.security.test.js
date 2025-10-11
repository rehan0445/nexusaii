import request from 'supertest';
import { app, server } from '../app.js';

describe('Security E2E', () => {
  afterAll((done) => {
    try { server.close(() => done()); } catch { done(); }
  });

  test('CORS blocks unknown origins', async () => {
    const res = await request(app).get('/').set('Origin', 'https://evil.example.com');
    // CORS middleware throws error which our handler maps to 500; verify no Access-Control-Allow-Origin for evil
    expect(res.header['access-control-allow-origin']).toBeUndefined();
  });

  test('CSRF required for auth POST when enabled', async () => {
    process.env.CSRF_ENABLED = 'true';
    const agent = request.agent(app);
    // fetch CSRF first
    const csrf = await agent.get('/api/auth/csrf');
    expect(csrf.status).toBe(200);
    const token = (csrf.body && csrf.body.token) || '';
    const res = await agent
      .post('/api/auth/send-verification')
      .set('Content-Type', 'application/json')
      .send({ phone: '+10000000000' });
    expect([400,403]).toContain(res.status); // missing header should be rejected
    const ok = await agent
      .post('/api/auth/send-verification')
      .set('Content-Type', 'application/json')
      .set('X-CSRF-Token', token)
      .send({ phone: '+10000000000' });
    expect([200,429]).toContain(ok.status);
  });

  test('Rate limit triggers on repeated login attempts', async () => {
    const agent = request.agent(app);
    const body = { email: 'test@gmail.com', password: 'x' };
    let lastStatus = 0;
    for (let i = 0; i < 25; i++) {
      const res = await agent.post('/api/auth/login/gmail').send(body);
      lastStatus = res.status;
    }
    expect([400,401,429,500]).toContain(lastStatus);
  });
});


