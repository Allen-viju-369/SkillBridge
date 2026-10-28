const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting for login & register endpoints to prevent brute-force abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: (req, res) => {
    req.flash('error', 'Too many login or registration attempts from this IP. Please try again after 15 minutes.');
    return res.redirect('/auth/login');
  }
});

// General request limiter for the application
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false
});

// Helmet configuration with relaxed CSP for Bootstrap CDN & Google Fonts
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://api.dicebear.com"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  });
};

module.exports = {
  authLimiter,
  generalLimiter,
  configureHelmet
};
