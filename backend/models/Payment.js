import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    ref: 'Order'
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  razorpaySignature: {
    type: String,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCharge: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'upi', 'wallet', 'emi', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
    default: 'created'
  },
  signatureVerified: {
    type: Boolean,
    default: false
  },
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  webhookProcessed: {
    type: Boolean,
    default: false
  },
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
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for better query performance
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;