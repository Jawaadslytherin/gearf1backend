import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import articlesRouter from './routes/articles.js';
import uploadRouter from './routes/upload.js';
import imagesRouter from './routes/images.js';
import footballRouter from './routes/football.js';
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
