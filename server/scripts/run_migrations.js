/*
  Lightweight SQL migration runner.
  Usage:
    POSTGRES_URL=postgres://user:pass@host:5432/db node scripts/run_migrations.js
*/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const conn = process.env.POSTGRES_URL;
  if (!conn) {
    console.error('Missing POSTGRES_URL env. Example: postgres://user:pass@localhost:5432/nexus');
    process.exit(1);
  }
  let pg;
  try {
    pg = await import('pg');
  } catch (e) {
    console.error('Please install pg in server package: npm i -w server pg');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: conn });
  await client.connect();

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('Running migrations...');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    console.log(`\n>>> ${f}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Applied ${f}`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`Failed ${f}:`, e.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('\nAll migrations applied successfully.');
}

main().catch((e) => { console.error(e); process.exit(1); });


