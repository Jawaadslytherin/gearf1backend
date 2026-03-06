import express from 'express';
import multer from 'multer';
import Image from '../models/Image.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Only images (jpeg, png, gif, webp) are allowed.'));
  },
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const image = await Image.create({
      filename: req.file.originalname || `image-${Date.now()}`,
      mimetype: req.file.mimetype,
      data: req.file.buffer,
      size: req.file.size,
    });
    const url = '/api/images/' + image._id.toString();
    res.json({ url, filename: image.filename });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});

router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image is too large. Max size is 5MB.' });
  }
  res.status(400).json({ error: err.message || 'Upload failed.' });
});

export default router;
