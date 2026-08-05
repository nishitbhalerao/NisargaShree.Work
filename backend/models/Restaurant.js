import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  cuisine: [{
    type: String,
    required: true,
    enum: ['North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai', 'Multi-cuisine']
  }],
  image: {
    type: String,
    default: null
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 4.0,
    min: 1,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    type: Number,
    required: true,
    default: 30 // in minutes
  },
  location: {
    address: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true,
      default: 'Mumbai'
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String
    }
  },
  avgCost: {
    type: Number,
    required: true,
    default: 300 // for two people
  },
  offers: {
    type: String,
    default: null
  },
  operatingHours: {
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '23:00'
    }
  },
  features: [{
    type: String,
    enum: ['delivery', 'takeaway', 'dine-in', 'outdoor-seating', 'parking', 'wifi', 'ac', 'card-payment', 'upi-payment']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'temporarily-closed'],
    default: 'active'
  },
  deliveryRadius: {
    type: Number,
    default: 10 // in kilometers
  },
  minimumOrder: {
    type: Number,
    default: 100 // minimum order amount
  },
  deliveryFee: {
    type: Number,
    default: 30
  },
  tags: [{
    type: String
  }],
  popularDishes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Add indexes for search and filtering
restaurantSchema.index({ name: 'text', description: 'text' });
restaurantSchema.index({ 'location.area': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ deliveryTime: 1 });
restaurantSchema.index({ status: 1 });

export default mongoose.model('Restaurant', restaurantSchema);