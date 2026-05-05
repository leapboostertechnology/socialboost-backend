// /backend/models/PageContent.js
// Dynamic content blocks per page — flexible schema using Mixed type
const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageKey: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // Free-form content object — admin sets keys as needed
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('PageContent', pageContentSchema);
