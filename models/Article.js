import mongoose from 'mongoose';

const contentBlockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['paragraph', 'embed', 'divider'], required: true },
    text: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subheading: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    content: { type: [contentBlockSchema], default: [] },
    category: {
      type: String,
      required: true,
      enum: ['Race Report', 'Qualifying', 'Practice', 'Analysis', 'Tech', 'Drivers', 'Teams', 'News'],
    },
    imageUrl: { type: String, default: '' },
    photoCredit: { type: String, default: '' },
    articleCredit: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Article', articleSchema);
