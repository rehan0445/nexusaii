// Simple E2E smoke test for Nexus API (dev)
// Usage:
//   BASE=http://localhost:8002 node server/scripts/e2e_smoke.js
//   SUPABASE_TEST_JWT=eyJ... node server/scripts/e2e_smoke.js

import fetch from 'node-fetch';

const BASE = process.env.BASE || 'http://localhost:8002';
const AUTH = process.env.SUPABASE_TEST_JWT || '';

const json = (obj) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
const authHeaders = AUTH ? { Authorization: `Bearer ${AUTH}` } : {};

function log(step, ok, extra = '') {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${step}${extra ? ' - ' + extra : ''}`);
}

async function main() {
  try {
    // 1) Health
    const healthRes = await fetch(`${BASE}/api/health`).catch(() => null);
    const healthText = healthRes ? await healthRes.text() : 'NO_RESPONSE';
    log('Health', !!healthRes && healthRes.ok, healthText);

    // 2) Create Dark Room group (unprotected)
    const groupPayload = { name: `E2E Room ${Date.now()}`, description: 'Smoke test', tags: ['e2e'], createdBy: 'e2e-user' };
    const groupRes = await fetch(`${BASE}/api/v1/darkroom/create-group`, { method: 'POST', ...json(groupPayload) }).catch(() => null);
    const groupData = groupRes && (await groupRes.json().catch(() => ({})));
    log('Dark Room create-group', !!groupRes && groupRes.ok, groupRes ? String(groupRes.status) : 'NO_RESPONSE');

    // 3) Create Confession (unprotected)
    const confessionPayload = { content: `E2E confession ${Date.now()}`, alias: 'E2E', sessionId: 'e2e-session' };
    const confRes = await fetch(`${BASE}/api/confessions`, { method: 'POST', ...json(confessionPayload) }).catch(() => null);
    const confData = confRes && (await confRes.json().catch(() => ({})));
    const confId = confData?.data?.id;
    log('Confession create', !!confRes && confRes.ok && !!confId, confRes ? String(confRes.status) : 'NO_RESPONSE');

    // 4) Reply to Confession (unprotected)
    let replyOk = false;
    if (confId) {
      const replyPayload = { content: 'E2E reply', alias: 'E2E', sessionId: 'e2e-session' };
      const replyRes = await fetch(`${BASE}/api/confessions/${confId}/reply`, { method: 'POST', ...json(replyPayload) }).catch(() => null);
      replyOk = !!replyRes && replyRes.ok;
      log('Confession reply', replyOk, replyRes ? String(replyRes.status) : 'NO_RESPONSE');
    } else {
      log('Confession reply', false, 'No confession id');
    }

    // 5) Create Hangout room (requires auth). Skip if no token provided
    if (AUTH) {
      const hangoutPayload = {
        name: `E2E Palace ${Date.now()}`,
        description: 'Smoke test palace',
        category: 'general',
        isPrivate: false,
        roomType: 'palace',
        tags: ['e2e']
      };
      const hangRes = await fetch(`${BASE}/api/hangout/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(hangoutPayload)
      }).catch(() => null);
      log('Hangout create-room', !!hangRes && hangRes.ok, hangRes ? String(hangRes.status) : 'NO_RESPONSE');
    } else {
      log('Hangout create-room', false, 'Skipped (no SUPABASE_TEST_JWT provided)');
    }

    console.log('\nDone.');
  } catch (e) {
    console.error('E2E Smoke failed:', e.message);
    process.exitCode = 1;
  }
}

main();


