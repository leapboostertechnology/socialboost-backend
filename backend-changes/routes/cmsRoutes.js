// /backend/routes/cmsRoutes.js
const express = require('express');
const router = express.Router();
const PageContent = require('../models/PageContent');
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

// Default content for each page (fallback before admin sets it)
const DEFAULT_CONTENT = {
  about: {
    heroTitle: 'About SocialBoost',
    heroSubtitle: 'AI-driven Instagram growth that connects creators with the audiences who matter.',
    missionTitle: 'Our Mission',
    missionText: 'We believe every creator deserves an audience that genuinely cares. SocialBoost combines smart targeting, content intelligence and authentic engagement so growth feels organic — because it is.',
    storyTitle: 'Our Story',
    storyText: 'SocialBoost was founded in 2024 by a small team of growth marketers and ML engineers who were tired of vanity metrics. We set out to build the only Instagram growth platform that focuses on real, retained followers.',
    valuesTitle: 'What we believe',
    values: [
      { title: 'Real Growth', text: 'No bots, no fake followers. Every interaction is a real human matched to your niche.' },
      { title: 'Transparency', text: 'You see exactly what we do, how, and the results — every single week.' },
      { title: 'Creator-first', text: 'Pricing, support and product decisions all start with one question: does it help the creator win?' },
    ],
  },
  contact: {
    heading: 'Talk to a growth strategist',
    subheading: 'Tell us about your account and goals — we typically reply within 24 hours.',
    email: 'support@socialboosts.co',
    phone: '+1 (800) 555-1234',
    address: 'SocialBoost HQ',
    formTitle: 'Send us a message',
  },
  faq: {
    heading: 'Frequently asked questions',
    subheading: 'Everything you wanted to know about SocialBoost.',
    items: [
      { q: 'How fast will I see results?', a: 'Most clients see meaningful follower and engagement growth within the first 7–14 days.' },
      { q: 'Are the followers real?', a: 'Yes. We never use bots. Every follower is a real human matched to your audience criteria.' },
      { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription with one click from your dashboard.' },
      { q: 'Is my Instagram password required?', a: 'No. We never ask for your password. Our growth methods are 100% Instagram-policy safe.' },
      { q: 'Do you support business and creator accounts?', a: 'Yes — both account types are fully supported.' },
      { q: 'What payment methods are accepted?', a: 'All major credit and debit cards via Stripe (secure, PCI-compliant).' },
    ],
  },
  'how-it-works': {
    heading: 'How SocialBoost works',
    subheading: 'A 4-step process designed for real, retained Instagram growth.',
    steps: [
      { title: 'Tell us your audience', text: 'Pick the demographics, interests and locations of your ideal followers.' },
      { title: 'AI matches creators & accounts', text: 'Our targeting engine finds the exact users most likely to love your content.' },
      { title: 'We engage authentically', text: 'Smart, human-style engagement gets your profile in front of those targeted users.' },
      { title: 'Watch the dashboard', text: 'Track followers, engagement and reach in real time. Adjust anytime.' },
    ],
  },
  reviews: {
    heading: 'Real creators. Real results.',
    subheading: 'See how brands and creators are scaling with SocialBoost.',
  },
  home: {},
  pricing: {},
};

// Public read
router.get('/pages/:pageKey', async (req, res) => {
  try {
    const pageKey = req.params.pageKey.toLowerCase();
    const doc = await PageContent.findOne({ pageKey });
    const fallback = DEFAULT_CONTENT[pageKey] || {};
    const stored = doc ? doc.content : {};
    res.json({ pageKey, content: { ...fallback, ...(stored || {}) } });
  } catch (err) {
    console.error('CMS get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list all pages
router.get('/pages', ...adminOnly, async (req, res) => {
  try {
    const docs = await PageContent.find().sort({ pageKey: 1 });
    const knownKeys = Object.keys(DEFAULT_CONTENT);
    const map = new Map(docs.map(d => [d.pageKey, sanitize(d)]));
    const merged = knownKeys.map(k => map.get(k) || { pageKey: k, content: DEFAULT_CONTENT[k] || {} });
    res.json(merged);
  } catch (err) {
    console.error('CMS list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: upsert
router.put('/pages/:pageKey', ...adminOnly, async (req, res) => {
  try {
    const pageKey = req.params.pageKey.toLowerCase();
    const content = req.body.content || {};
    const doc = await PageContent.findOneAndUpdate(
      { pageKey },
      { $set: { pageKey, content } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(sanitize(doc));
  } catch (err) {
    console.error('CMS upsert error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
