require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const { connectDB } = require('./config/db');
const { configureHelmet, generalLimiter } = require('./middleware/security');
const csrfProtection = require('./middleware/csrf');
const setLocals = require('./middleware/locals');

// Import routes
const homeRoutes = require('./routes/homeRoutes');
const authRoutes = require('./routes/authRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy for secure cookies (required for Vercel & HTTPS proxies)
app.set('trust proxy', 1);

// Connect to Database if not in automated test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(err => {
    console.error('[Fatal] Database startup failed:', err);
  });
}

// Ensure database connection is established for serverless / Vercel invocations
if (process.env.NODE_ENV !== 'test') {
  const mongoose = require('mongoose');
  app.use(async (req, res, next) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await connectDB();
      }
      next();
    } catch (err) {
      console.error('[Database Middleware Error]', err);
      return res.status(500).render('pages/error', {
        title: 'Database Unavailable',
        statusCode: 500,
        message: 'Could not connect to the database. Please verify your MONGODB_URI connection string.'
      });
    }
  });
}

// View Engine Setup (EJS + Layouts)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Security & Request Parsing Middlewares
app.use(configureHelmet());
app.use(generalLimiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(methodOverride('_method'));

// Static assets with explicit SVG mime handling
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    }
  }
}));

// Session Management with MongoDB store (or fallback in-memory)
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'skillbridge_default_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
};

// If not in test mode, persist sessions to MongoDB via connect-mongo
if (process.env.NODE_ENV !== 'test') {
  try {
    const mongoose = require('mongoose');
    sessionOptions.store = MongoStore.create({
      clientPromise: new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) {
          return resolve(mongoose.connection.getClient());
        }
        mongoose.connection.once('open', () => {
          resolve(mongoose.connection.getClient());
        });
      }),
      collectionName: 'sessions',
      ttl: 60 * 60 * 24
    });
  } catch (sessionStoreErr) {
    console.warn('[Session] Using default in-memory session store:', sessionStoreErr.message);
  }
}

app.use(session(sessionOptions));
app.use(flash());

// CSRF Security Protection
app.use(csrfProtection);

// Global Template Locals (User session, flash alerts, formatting helpers)
app.use(setLocals);

// Top-level Auth aliases
app.get('/login', (req, res) => {
  const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(`/auth/login${queryStr}`);
});
app.get('/register', (req, res) => {
  const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(`/auth/register${queryStr}`);
});

// Mount Application Routes
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/marketplace', marketplaceRoutes);
app.use('/services', serviceRoutes);
app.use('/', orderRoutes);
app.use('/', reviewRoutes);
app.use('/profile', profileRoutes);
app.use('/admin', adminRoutes);

// Health check endpoint with live database connection diagnostic
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'UP',
    database: states[mongoose.connection.readyState] || 'unknown',
    databaseName: mongoose.connection.name || 'none',
    databaseHost: mongoose.connection.host || 'unknown',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('pages/error', {
    title: 'Page Not Found (404) — SkillBridge',
    statusCode: 404,
    message: 'The page or resource you requested could not be found.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const statusCode = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).render('pages/error', {
    title: `Error ${statusCode} — SkillBridge`,
    statusCode,
    message: isDev ? err.message : 'An unexpected server error occurred. Our team has been notified.',
    stack: isDev ? err.stack : null
  });
});

// Start Server if not imported by test suite
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SkillBridge Marketplace is live at: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
