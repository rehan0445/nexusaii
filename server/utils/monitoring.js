let Sentry = null;
let sentryEnabled = false;

export function initMonitoring() {
  try {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;
    // Lazy import to avoid dependency cost if unused (ESM-friendly)
    import('@sentry/node')
      .then((mod) => {
        Sentry = mod.default || mod;
        Sentry.init({ dsn, tracesSampleRate: 0.0 });
        sentryEnabled = true;
      })
      .catch(() => {});
  } catch {}
}

export function captureError(err, req) {
  try {
    if (!sentryEnabled || !Sentry) return;
    Sentry.withScope((scope) => {
      if (req) {
        scope.setTag('method', req.method);
        scope.setTag('url', req.originalUrl || req.url);
        scope.setExtra('ip', req.ip);
        scope.setExtra('headers', req.headers);
      }
      Sentry.captureException(err);
    });
  } catch {}
}


