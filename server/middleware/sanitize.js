function stripDangerous(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }
  return value;
}

export function sanitizeBody(req, _res, next) {
  try {
    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (typeof v === 'object' && v !== null) obj[k] = walk(v);
        else obj[k] = stripDangerous(v);
      }
      return obj;
    };
    if (req.body && typeof req.body === 'object') {
      req.body = walk(req.body);
    }
  } catch {}
  next();
}


