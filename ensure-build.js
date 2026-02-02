/**
 * Ensures client/dist exists before starting the server.
 * If missing, runs npm run build so static assets (e.g. /assets/shrikant-gunjar.png) are available.
 * Used by: npm start (and Railway start when build phase didn't run).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'client', 'dist');

if (!fs.existsSync(distPath)) {
  console.log('client/dist missing — running build...');
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
}
