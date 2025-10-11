export function assertRequiredEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const required = ['JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);

  if (isProd && missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  // In development, only warn about missing variables
  if (!isProd && missing.length) {
    console.warn('⚠️ Missing environment variables in development mode:', missing.join(', '));
    console.warn('⚠️ Some features may not work properly without these variables');
  }
}


