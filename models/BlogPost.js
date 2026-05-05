// /backend/models/BlogPost.js
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' }, // HTML from rich-text editor
  coverImage: { type: String, default: '' },
  author: { type: String, default: 'SocialBoost Team' },
  tags: [{ type: String, trim: true }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  publishedAt: { type: Date },

  // SEO fields
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' },
  canonical: { type: String, default: '' },
  ogImage: { type: String, default: '' },

  views: { type: Number, default: 0 },
}, { timestamps: true });

blogPostSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
