import crypto from 'crypto';

const redact = (val) => {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.length > 64) return val.slice(0, 6) + '***' + val.slice(-4);
    return '***';
  }
  return '***';
};

export function createRequestLogger() {
  return function reqLogger(req, _res, next) {
    try {
      const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
      req.correlationId = correlationId;
      const safeHeaders = { ...req.headers };
      if (safeHeaders.authorization) safeHeaders.authorization = redact(safeHeaders.authorization);
      req.logContext = {
        id: correlationId,
        ip: req.ip,
        method: req.method,
        url: req.originalUrl || req.url,
        headers: safeHeaders,
      };
    } catch {}
    next();
  };
}

export function logError(err, req) {
  try {
    const ctx = req?.logContext || {};
    console.error('ERR', { id: ctx.id, method: ctx.method, url: ctx.url, ip: ctx.ip, msg: err?.message });
  } catch (e) {
    console.error(err);
  }
}


