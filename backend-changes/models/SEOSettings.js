// /backend/models/SEOSettings.js
// Per-page SEO metadata managed via admin CMS
const mongoose = require('mongoose');

const seoSettingsSchema = new mongoose.Schema({
  pageKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    // home, pricing, about, contact, faq, how-it-works, reviews, blog, blog-post
  },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  keywords: { type: String, default: '' },
  canonical: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  ogType: { type: String, default: 'website' },
  twitterCard: { type: String, default: 'summary_large_image' },
  twitterTitle: { type: String, default: '' },
  twitterDescription: { type: String, default: '' },
  twitterImage: { type: String, default: '' },
  schemaJson: { type: String, default: '' }, // Custom JSON-LD (optional)
  noindex: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SEOSettings', seoSettingsSchema);
