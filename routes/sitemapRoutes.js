// /backend/routes/sitemapRoutes.js
// Public dynamic /sitemap.xml and /robots.txt
const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

const SITE_URL = (process.env.SITE_URL || process.env.FRONTEND_URL || 'https://socialboosts.co').replace(/\/$/, '');

router.get('/robots.txt', (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /superadmin',
    'Disallow: /dashboard',
    'Disallow: /payment',
    'Disallow: /payment-success',
    'Disallow: /campaign-preferences',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
  res.type('text/plain').send(body);
});

router.get('/sitemap.xml', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const staticPages = [
      { loc: '/', priority: 1.0, changefreq: 'daily' },
      { loc: '/pricing', priority: 0.9, changefreq: 'weekly' },
      { loc: '/about', priority: 0.7, changefreq: 'monthly' },
      { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
      { loc: '/faq', priority: 0.7, changefreq: 'monthly' },
      { loc: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
      { loc: '/reviews', priority: 0.7, changefreq: 'weekly' },
      { loc: '/blog', priority: 0.8, changefreq: 'daily' },
    ];

    const posts = await BlogPost.find({ status: 'published' }).select('slug updatedAt publishedAt');

    const urlEntries = [
      ...staticPages.map(p => ({
        loc: `${SITE_URL}${p.loc}`,
        lastmod: today,
        changefreq: p.changefreq,
        priority: p.priority,
      })),
      ...posts.map(p => ({
        loc: `${SITE_URL}/blog/${p.slug}`,
        lastmod: (p.updatedAt || p.publishedAt || new Date()).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).type('text/plain').send('Sitemap generation error');
  }
});

module.exports = router;
