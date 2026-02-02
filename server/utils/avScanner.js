import fetch from 'node-fetch';

const isProd = process.env.NODE_ENV === 'production';

export async function scanBuffer(buffer, filename = 'file', mime = 'application/octet-stream') {
  try {
    if (process.env.AV_SCAN_ENABLED !== '1') {
      return { clean: true, skipped: true };
    }
    const url = process.env.AV_SCAN_URL;
    if (!url) {
      if (isProd) return { clean: false, reason: 'AV scan URL not configured' };
      return { clean: true, skipped: true };
    }
    const form = new FormData();
    form.append('file', new Blob([buffer]), filename);
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
      if (isProd) return { clean: false, reason: `AV scan HTTP ${res.status}` };
      return { clean: true, skipped: true };
    }
    const data = await res.json().catch(() => ({}));
    if (typeof data.clean === 'boolean') {
      return { clean: !!data.clean, reason: data.reason };
    }
    // Fallback: treat 2xx as clean in non-prod; block in prod
    return isProd ? { clean: false, reason: 'AV scan ambiguous result' } : { clean: true, skipped: true };
  } catch (e) {
    return isProd ? { clean: false, reason: 'AV scan error' } : { clean: true, skipped: true };
  }
}


