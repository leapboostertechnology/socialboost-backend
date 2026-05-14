/**
 * One-shot CMS brand-rename script.
 *
 * Replaces every occurrence of legacy brand strings
 *   "SocialBoost", "Social Boost", "socialBoost"
 * with "SocialBoosts" inside PageContent, BlogPost and SEOSettings.
 *
 * SAFE: only updates ACTUAL substring occurrences.
 * Run from /app/backend or wherever .env is reachable:
 *   node scripts/renameBrandInCMS.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const PageContent = require('../models/PageContent');
const BlogPost = require('../models/BlogPost');
const SEOSettings = require('../models/SEOSettings');

const PATTERNS = [
  // Order matters: longest/most specific first.
  { from: /Social Boost(?!s)/g, to: 'SocialBoosts' },
  { from: /SocialBoost(?!s)/g, to: 'SocialBoosts' },
  { from: /socialBoost(?!s)/g, to: 'socialBoosts' },
];

function rename(value) {
  if (typeof value === 'string') {
    let out = value;
    for (const { from, to } of PATTERNS) out = out.replace(from, to);
    return out;
  }
  if (Array.isArray(value)) return value.map(rename);
  if (value && typeof value === 'object') {
    const next = {};
    for (const k of Object.keys(value)) next[k] = rename(value[k]);
    return next;
  }
  return value;
}

async function processCollection(Model, label) {
  const docs = await Model.find({}).lean();
  let updated = 0;
  for (const doc of docs) {
    const renamed = rename(doc);
    if (JSON.stringify(renamed) !== JSON.stringify(doc)) {
      const { _id, ...rest } = renamed;
      await Model.updateOne({ _id }, { $set: rest });
      updated += 1;
    }
  }
  console.log(`  ${label}: ${updated}/${docs.length} document(s) updated`);
}

(async () => {
  const uri = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URL/MONGO_URI not set — aborting.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Running brand rename…');

  await processCollection(PageContent, 'PageContent');
  await processCollection(BlogPost, 'BlogPost');
  await processCollection(SEOSettings, 'SEOSettings');

  await mongoose.disconnect();
  console.log('Done.');
})().catch((err) => {
  console.error('Brand rename failed:', err);
  process.exit(1);
});
