import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import articlesRouter from './routes/articles.js';
import uploadRouter from './routes/upload.js';
import footballRouter from './routes/football.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/api/articles', articlesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/football', footballRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('No MONGODB_URI set. Add MONGODB_URI in Render Environment (or in .env locally).');
  } else {
    try {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB');
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
