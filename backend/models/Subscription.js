import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Phone number must be 10 digits'
      }
    },
    address: {
      type: String,
      required: true
    },
    deliveryInstructions: String
  },
  item: {
    name: { type: String, default: 'Poli (Fresh Roti)' },
    price: { type: Number, default: 12 },
    quantity: { type: Number, required: true, min: 1 }
  },
  selectedDates: [{
    type: Date,
    required: true
  }],
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveredDates: [{
    date: Date,
    status: {
      type: String,
      enum: ['delivered', 'missed', 'skipped'],
      default: 'delivered'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Subscription', subscriptionSchema);