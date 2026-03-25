const { getSession } = require('../lib/sessions');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const session = getSession(token);

  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  req.auth = session;
  return next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.auth.role === 'super') {
      return next();
    }

    const userPermissions = Array.isArray(req.auth.permissions) ? req.auth.permissions : [];
    if (!permissions.some((permission) => userPermissions.includes(permission))) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRoles,
  requireAnyPermission,
};
