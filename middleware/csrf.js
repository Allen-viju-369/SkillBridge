const crypto = require('crypto');

/**
 * Robust, session-backed CSRF protection middleware.
 * Generates cryptographically secure tokens and validates state-changing requests.
 */
const csrfProtection = (req, res, next) => {
  // Ensure session exists
  if (!req.session) {
    return next(new Error('Session middleware must be initialized before CSRF protection'));
  }

  // Generate token if not already in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Helper function on request
  req.csrfToken = () => req.session.csrfToken;

  // Make token available to all EJS templates
  res.locals.csrfToken = req.session.csrfToken;

  // Safe HTTP methods do not require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Allow bypass only in automated test mode if explicitly flagged
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-csrf'] === 'true') {
    return next();
  }

  // Extract token from request body, query parameter, or headers
  const token = 
    (req.body && req.body._csrf) ||
    (req.query && req.query._csrf) ||
    req.headers['x-csrf-token'] ||
    req.headers['csrf-token'];

  if (!token || token !== req.session.csrfToken) {
    console.warn(`[Security Alert] CSRF token mismatch or missing for path: ${req.originalUrl} (${req.method})`);
    req.flash('error', 'Security check failed (CSRF token expired or invalid). Please try again.');
    return res.status(403).render('pages/error', {
      title: 'Invalid Request',
      statusCode: 403,
      message: 'Action rejected due to an invalid or missing security token. Please refresh the page and try again.'
    });
  }

  next();
};

module.exports = csrfProtection;
