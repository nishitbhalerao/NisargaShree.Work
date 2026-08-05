import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: null
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'snacks', 'combo'],
    default: 'main-course'
  },
  type: {
    type: String,
    required: true,
    enum: ['veg', 'non-veg'],
    default: 'veg'
  },
  cuisine: [{
    type: String,
    enum: ['North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai'],
    default: ['North Indian']
  }],
  rating: {
    type: Number,
    default: 4.2,
    min: 1,
    max: 5
  },
  reviews: {
    type: Number,
    default: 100
  },
  preparationTime: {
    type: Number,
    default: 20 // in minutes
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'spicy'],
    default: 'medium'
  },
  tags: [{
    type: String
  }],
  available: {
    type: Boolean,
    default: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for search functionality
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, type: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ price: 1 });

export default mongoose.model('Product', productSchema);