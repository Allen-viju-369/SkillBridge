/**
 * Authentication and Role-Based Authorization Middleware
 */

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // Check if account is suspended
    if (req.session.user.accountStatus === 'suspended') {
      req.session.destroy(() => {
        res.status(403).render('pages/error', {
          title: 'Account Suspended',
          statusCode: 403,
          message: 'Your account has been suspended by an administrator. Please contact support.'
        });
      });
      return;
    }
    return next();
  }
  
  req.flash('error', 'Please log in to continue.');
  const returnTo = req.originalUrl !== '/auth/logout' ? req.originalUrl : '/';
  res.redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
};

const isGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin');
    if (req.session.user.role === 'student') return res.redirect('/dashboard/freelancer');
    return res.redirect('/dashboard/client');
  }
  next();
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Authentication required.');
      return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('pages/error', {
        title: 'Access Forbidden',
        statusCode: 403,
        message: `Access denied. This section requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

const requireStudent = requireRole('student');
const requireClient = requireRole('client');
const requireAdmin = requireRole('admin');

module.exports = {
  isAuthenticated,
  isGuest,
  requireRole,
  requireStudent,
  requireClient,
  requireAdmin
};
