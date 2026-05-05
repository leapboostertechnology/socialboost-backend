// /backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { auth, authorize } = require('../middleware/auth');
const { UserRole } = require('../models/User');

const adminOnly = [auth, authorize(UserRole.ADMIN, UserRole.SUPERADMIN)];

const sanitize = (doc) => {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
};

const slugify = (s) =>
  s.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// PUBLIC: list published posts
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;
    const filter = { status: 'published' };
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

    const [posts, total] = await Promise.all([
      BlogPost.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit),
      BlogPost.countDocuments(filter),
    ]);

    res.json({
      posts: posts.map(sanitize),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Blog list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUBLIC: single post by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug.toLowerCase(), status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(sanitize(post));
  } catch (err) {
    console.error('Blog slug error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: list (all statuses)
router.get('/admin/all', ...adminOnly, async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.json({ posts: posts.map(sanitize) });
  } catch (err) {
    console.error('Blog admin list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: get single by id
router.get('/admin/:id', ...adminOnly, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(sanitize(post));
  } catch (err) {
    console.error('Blog admin get error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: create
router.post('/admin', ...adminOnly, async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.title) return res.status(400).json({ message: 'Title is required' });
    if (!body.slug) body.slug = slugify(body.title);
    body.slug = slugify(body.slug);

    // Ensure unique slug
    const existing = await BlogPost.findOne({ slug: body.slug });
    if (existing) {
      body.slug = `${body.slug}-${Date.now().toString(36)}`;
    }

    const post = new BlogPost(body);
    await post.save();
    res.status(201).json(sanitize(post));
  } catch (err) {
    console.error('Blog create error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ADMIN: update
router.put('/admin/:id', ...adminOnly, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.slug) update.slug = slugify(update.slug);
    delete update.id;
    delete update._id;
    const post = await BlogPost.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(sanitize(post));
  } catch (err) {
    console.error('Blog update error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ADMIN: delete
router.delete('/admin/:id', ...adminOnly, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Blog delete error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
