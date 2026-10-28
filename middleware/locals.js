/**
 * Global Template Context Middleware
 * Supplies shared variables, user session data, flash messages, and formatting helpers to all EJS views.
 */
const setLocals = (req, res, next) => {
  const user = req.session ? req.session.user : null;

  res.locals.currentUser = user || null;
  res.locals.isLoggedIn = Boolean(user);
  res.locals.isStudent = user?.role === 'student';
  res.locals.isClient = user?.role === 'client';
  res.locals.isAdmin = user?.role === 'admin';

  res.locals.currentPath = req.path;
  res.locals.url = req.originalUrl;

  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError = req.flash('error');
  res.locals.flashInfo = req.flash('info');

  // Currency Formatter
  res.locals.formatCurrency = (amount) => {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Date Formatter
  res.locals.formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', { ...defaults, ...options });
  };

  // Relative Time Formatter
  res.locals.formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  };

  // Star Rating Helper
  res.locals.renderStars = (rating) => {
    const r = Math.round((Number(rating) || 0) * 2) / 2;
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (r >= i) {
        starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
      } else if (r === i - 0.5) {
        starsHtml += '<i class="bi bi-star-half text-warning"></i>';
      } else {
        starsHtml += '<i class="bi bi-star text-muted opacity-50"></i>';
      }
    }
    return starsHtml;
  };

  next();
};

module.exports = setLocals;
