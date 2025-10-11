// Centralized environment loader with dotenv-safe to enforce required vars
import { config as dotenvSafeConfig } from 'dotenv-safe';

try {
  dotenvSafeConfig({
    allowEmptyValues: true,
    example: process.env.DOTENV_EXAMPLE_PATH || '.env.example',
  });
} catch {}

export function getEnv(key, fallback) {
  const val = process.env[key];
  return val === undefined || val === null || val === '' ? fallback : val;
}


