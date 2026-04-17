import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import articlesRouter from './routes/articles.js';
import uploadRouter from './routes/upload.js';
import imagesRouter from './routes/images.js';
import footballRouter from './routes/football.js';
import f1Router from './routes/f1.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/images', imagesRouter);
app.use('/api/football', footballRouter);
app.use('/api/f1', f1Router);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.get('/api/sitemap', async (req, res) => {
  try {
    const SITE_URL = (process.env.VITE_SITE_URL || 'https://gearupf1.com').replace(/\/$/, '');
    const Article = (await import('./models/Article.js')).default;
    const articles = await Article.find({}, 'slug updatedAt').sort({ createdAt: -1 }).lean();

    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/drivers', priority: '0.7', changefreq: 'weekly' },
      { path: '/calendar', priority: '0.7', changefreq: 'weekly' },
      { path: '/about', priority: '0.5', changefreq: 'monthly' },
      { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    ];

    const staticEntries = staticPages.map(({ path, priority, changefreq }) => `
  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');

    const articleEntries = articles.map((a) => `
  <url>
    <loc>${SITE_URL}/article/${a.slug}</loc>
    <lastmod>${new Date(a.updatedAt || a.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${articleEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Could not generate sitemap.');
  }
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('No MONGODB_URI set. Add MONGODB_URI in Render Environment (or in .env locally).');
  } else {
    try {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB');
      const adminUser = process.env.ADMIN_USERNAME;
      const adminPass = process.env.ADMIN_PASSWORD;
      if (adminUser && adminPass) {
        const count = await User.countDocuments();
        if (count === 0) {
          const hash = await bcrypt.hash(adminPass, 10);
          await User.create({ username: adminUser, passwordHash: hash });
          console.log('Created initial admin user');
        }
      }
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    }
  }

  // Bind to 0.0.0.0 so Render (and other hosts) can detect the open port
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start();
