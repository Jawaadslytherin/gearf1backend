import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['Race Report', 'Qualifying', 'Practice', 'Analysis', 'Tech', 'Drivers', 'Teams', 'News'],
    },
    imageUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Article', articleSchema);
