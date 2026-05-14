// /backend/routes/seoRoutes.js
// Public: GET /api/seo/:pageKey  (frontend reads meta dynamically)
// Admin: GET /api/seo (list all), PUT /api/seo/:pageKey (upsert)
const express = require('express');
const router = express.Router();
const SEOSettings = require('../models/SEOSettings');
const { auth, authorize } = require('../middleware/auth');
const { UserRole } = require('../models/User');

const adminOnly = [auth, authorize(UserRole.ADMIN, UserRole.SUPERADMIN)];

const sanitize = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  delete o._id;
  delete o.__v;
  return o;
};

// Default SEO defaults to fall back to when a page hasn't been customised yet
const DEFAULTS = {
  home: {
    title: 'SocialBoost – Elevate Your Digital Influence | Instagram Growth Platform',
    description: 'Transform casual scrollers into devoted followers with our AI-driven Instagram growth platform. Authentic connections that convert.',
    keywords: 'instagram growth, social media marketing, follower growth, instagram followers, social boost',
  },
  about: {
    title: 'About SocialBoost – AI-Driven Social Media Growth',
    description: 'Learn how SocialBoost helps creators and businesses grow real Instagram audiences using AI-driven targeting.',
  },
  pricing: {
    title: 'Pricing Plans – Affordable Instagram Growth | SocialBoost',
    description: 'Choose a SocialBoost plan that fits your goals. Transparent monthly and annual pricing with real-result guarantees.',
  },
  contact: {
    title: 'Contact SocialBoost – Get in Touch',
    description: 'Have questions about SocialBoost? Reach out to our growth experts and we will reply within 24 hours.',
  },
  faq: {
    title: 'FAQ – SocialBoost Common Questions',
    description: 'Answers to the most common questions about SocialBoost Instagram growth services, billing, and results.',
  },
  'how-it-works': {
    title: 'How It Works – SocialBoost Instagram Growth Process',
    description: 'See the 4-step process behind SocialBoost: targeting, engagement, content amplification and reporting.',
  },
  reviews: {
    title: 'Reviews & Testimonials – Real SocialBoost Results',
    description: 'Read testimonials and watch video reviews from creators and brands who scaled their Instagram with SocialBoost.',
  },
  blog: {
    title: 'SocialBoost Blog – Instagram Growth Tips & Insights',
    description: 'Latest tips, case studies and trends on Instagram marketing, audience growth and content strategy.',
  },
};

// Public read
router.get('/:pageKey', async (req, res) => {
  try {
    const pageKey = req.params.pageKey.toLowerCase();
    const doc = await SEOSettings.findOne({ pageKey });
    const fallback = DEFAULTS[pageKey] || {};
    const merged = { pageKey, ...fallback, ...(sanitize(doc) || {}) };
    res.json(merged);
  } catch (err) {
    console.error('SEO get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all
router.get('/', ...adminOnly, async (req, res) => {
  try {
    const docs = await SEOSettings.find().sort({ pageKey: 1 });
    res.json(docs.map(sanitize));
  } catch (err) {
    console.error('SEO list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: upsert
router.put('/:pageKey', ...adminOnly, async (req, res) => {
  try {
    const pageKey = req.params.pageKey.toLowerCase();
    const allowed = [
      'title', 'description', 'keywords', 'canonical',
      'ogTitle', 'ogDescription', 'ogImage', 'ogType',
      'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
      'schemaJson', 'noindex',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const doc = await SEOSettings.findOneAndUpdate(
      { pageKey },
      { $set: { pageKey, ...update } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(sanitize(doc));
  } catch (err) {
    console.error('SEO upsert error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
