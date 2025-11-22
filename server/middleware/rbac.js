const toSet = (csv = '') => new Set(csv.split(',').map(s => s.trim()).filter(Boolean));

const adminEmails = toSet(process.env.ROLE_ADMIN_EMAILS || '');
const adminUserIds = toSet(process.env.ROLE_ADMIN_USER_IDS || '');
const moderatorEmails = toSet(process.env.ROLE_MODERATOR_EMAILS || '');

export function attachRolesFromEnv(req, _res, next) {
  try {
    const user = req.user || {};
    const roles = new Set();
    const email = (user.email || '').toLowerCase();
    const userId = user.userId || user.id;

    if (email && adminEmails.has(email)) roles.add('admin');
    if (userId && adminUserIds.has(userId)) roles.add('admin');
    if (email && moderatorEmails.has(email)) roles.add('moderator');

    // Back-compat flags used across routes
    req.user = { ...user, roles: Array.from(roles), isAdmin: roles.has('admin') };
  } catch {}
  next();
}

export function requireRoles(required = []) {
  const requiredSet = new Set(Array.isArray(required) ? required : [required]);
  return (req, res, next) => {
    try {
      const roles = new Set(req.user?.roles || []);
      for (const r of requiredSet) {
        if (roles.has(r)) return next();
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    } catch {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  };
}


