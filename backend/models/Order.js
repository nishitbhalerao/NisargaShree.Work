import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  _id: String,
  name: String,
  price: Number,
  quantity: Number,
  image: String
});

const customerInfoSchema = new mongoose.Schema({
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
    required: function() {
      return this.orderType === 'delivery';
    }
  },
  deliveryInstructions: String
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  customerInfo: customerInfoSchema,
  orderType: {
    type: String,
    enum: ['takeaway', 'delivery'],
    required: true
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  pickupTime: {
    type: String,
    required: function() {
      return this.orderType === 'takeaway';
    }
  },
  deliveryFee: {
    type: Number,
    default: 0
    // TODO: Implement delivery fee calculation logic
    // This field is structured for easy integration of delivery charges
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Order', orderSchema);