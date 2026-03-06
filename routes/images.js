import express from 'express';
import Image from '../models/Image.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found.' });
    res.set('Content-Type', image.mimetype);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(image.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
