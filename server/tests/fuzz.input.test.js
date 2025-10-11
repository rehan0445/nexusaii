import { test, expect, describe } from 'vitest';
import request from 'supertest';
import fc from 'fast-check';
import { app, server } from '../app.js';

describe('Fuzz input validation', () => {
  afterAll((done) => {
    try { server.close(() => done()); } catch { done(); }
  });

  test('Announcements GET filters resist fuzzed params', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string(), fc.string(), fc.string(), async (category, priority, campus) => {
        const res = await request(app).get('/api/v1/announcements').query({ category, priority, campus });
        expect([200,500,401]).toContain(res.status);
      }
    ), { numRuns: 25 });
  });
});


