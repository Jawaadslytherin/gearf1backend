import express from 'express';
import Article from '../models/Article.js';

const router = express.Router();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

router.get('/', async (req, res) => {
  try {
    const { category, featured, limit = 50 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    const articles = await Article.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-slug/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).lean();
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).lean();
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, excerpt, body, category, imageUrl, featured } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' });
    }
    let slug = slugify(title);
    const existing = await Article.findOne({ slug });
    if (existing) slug = slug + '-' + Date.now();
    const article = await Article.create({
      title,
      slug,
      excerpt: excerpt || '',
      body: body || '',
      category,
      imageUrl: imageUrl || '',
      featured: !!featured,
    });
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, excerpt, body, category, imageUrl, featured } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    if (title !== undefined) article.title = title;
    if (excerpt !== undefined) article.excerpt = excerpt;
    if (body !== undefined) article.body = body;
    if (category !== undefined) article.category = category;
    if (imageUrl !== undefined) article.imageUrl = imageUrl;
    if (featured !== undefined) article.featured = !!featured;
    if (title) article.slug = slugify(article.title);
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
