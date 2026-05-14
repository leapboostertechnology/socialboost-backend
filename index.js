// Modify your server.js file:

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// In your server.js after other requires:
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, UserRole } = require('./models/User');
const crypto = require('crypto');
// Add this at the top of your server.js file
const axios = require('axios');

const seedSuperAdmin = require('./utils/seedSuperAdmin');


// Load env variables
dotenv.config();

// Initialize app
const app = express();

// Special route for Stripe webhooks
app.use('/api/stripe/webhooks/stripe', express.raw({ type: 'application/json' }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://www.socialboosts.co',
  'https://socialboosts.co',
  'https://socialboost-3nfby.ondigitalocean.app',
  'https://api-staging-5.preview.emergentagent.com'
];

const corsOriginsEnv = process.env.CORS_ORIGINS;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // CORS_ORIGINS=* means allow all
    if (corsOriginsEnv === '*') return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin); // Add logging
      callback(null, false); // Don't throw error, just block with proper CORS response
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Standard middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
// Initialize passport
app.use(passport.initialize());

// Fix route paths to match your actual file names
app.use('/api/auth', require('./routes/authRoutes')); // Changed from authRoutes to auth
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/custombookings', require('./routes/customPlanBookingsRoutes'));
app.use('/api/myOrders', require('./routes/userOrdersRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
// In server.js, add this line with your other routes:
app.use('/api/admin/subscriptions', require('./routes/adminSubscriptions'));
const metaEventsRoutes = require('./routes/metaEvents');

// Add this line where you register other routes
app.use('/api', metaEventsRoutes);

// === NEW: SEO + CMS + Blog routes (Phase 2-3) ===
app.use('/api/seo', require('./routes/seoRoutes'));
app.use('/api/cms', require('./routes/cmsRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
// Sitemap routes mounted both at root and under /api so K8s ingress works
app.use('/', require('./routes/sitemapRoutes'));
app.use('/api', require('./routes/sitemapRoutes'));

// Root route with version for debugging
app.get('/', (req, res) => {
  res.send('API Running - v1.0.3 (with SEO/Blog CMS)');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Hash function for server-side
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Make MongoDB connection resilient
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || `${process.env.MONGO_URL || 'mongodb://localhost:27017'}/${process.env.DB_NAME || 'socialboost'}`;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    // Idempotent SuperAdmin seed
    try {
      await seedSuperAdmin();
    } catch (e) {
      console.error('SuperAdmin seed error (non-fatal):', e.message);
    }
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB', err);
    console.log('Will retry MongoDB connection in 30 seconds...');
    setTimeout(connectDB, 30000);
  }
};

// Call connectDB but don't wait for it
connectDB();

// Configure Google strategy (only when credentials are present)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
          ? 'https://socialboost-3nfby.ondigitalocean.app/api/auth/google/callback'
          : (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'),
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists, return the user for login flow
            return done(null, user);
          }

          // Create new user with Google profile info (this is a new registration via Google)
          user = new User({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            password: crypto.randomBytes(16).toString('hex'),
            emailVerified: true,
            role: UserRole.USER
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy registered');
} else {
  console.log('⚠️  Google OAuth disabled (GOOGLE_CLIENT_ID/SECRET not set)');
}


// Initialize server
const PORT = process.env.PORT || 8002; // Local proxy expects 8002
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
