import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// Import models
import Product from './models/Product.js';
import Order from './models/Order.js';
import Subscription from './models/Subscription.js';
import Payment from './models/Payment.js';

// Import controllers
import {
  getCheckoutSummary,
  createRazorpayOrder,
  verifyPayment,
  retryPayment,
  handleWebhook
} from './controllers/paymentController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error.message);
  }
} else {
  console.warn('Razorpay keys not found. Payment features will be disabled.');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' })); // For webhooks

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes

// Payment routes
app.post('/api/payment/checkout-summary', getCheckoutSummary);
app.post('/api/payment/create-order', createRazorpayOrder);
app.post('/api/payment/verify', verifyPayment);
app.post('/api/payment/retry/:orderId', retryPayment);
app.post('/api/payment/webhook', handleWebhook);

// Get Razorpay public key for frontend
app.get('/api/payment/config', (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID,
    currency: 'INR'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Place order directly (legacy support - COD flow)
app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerInfo, orderType, total, pickupTime } = req.body;

    if (!items || !customerInfo || !orderType || !total) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderId,
      items,
      customerInfo,
      orderType,
      total,
      pickupTime: pickupTime || null,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      createdAt: new Date()
    });

    await order.save();

    res.status(201).json({
      orderId: order.orderId,
      total: order.total,
      orderStatus: order.orderStatus,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get all orders (for admin panel)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by orderId (for user status check)
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin marks as preparing / ready / delivered)
app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = ['placed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { orderStatus, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ orderId: order.orderId, orderStatus: order.orderStatus });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Create subscription
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { customerInfo, item, selectedDates, totalAmount } = req.body;

    if (!customerInfo || !item || !selectedDates || !totalAmount) {
      return res.status(400).json({ error: 'Missing required subscription fields' });
    }

    const subscriptionId = `SUB${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const subscription = new Subscription({
      subscriptionId,
      customerInfo,
      item,
      selectedDates: selectedDates.map(d => new Date(d)),
      totalDays: selectedDates.length,
      totalAmount,
      status: 'active',
      paymentStatus: 'pending',
      createdAt: new Date()
    });

    await subscription.save();

    res.status(201).json({
      subscriptionId: subscription.subscriptionId,
      totalDays: subscription.totalDays,
      totalAmount: subscription.totalAmount,
      status: subscription.status,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get all subscriptions (for admin panel)
app.get('/api/subscriptions', async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Update subscription status (admin)
app.patch('/api/subscriptions/:subscriptionId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid subscription status' });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { subscriptionId: req.params.subscriptionId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscriptionId: subscription.subscriptionId, status: subscription.status });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    res.status(500).json({ error: 'Failed to update subscription status' });
  }
});

// Mark subscription delivery for a specific date
app.post('/api/subscriptions/:subscriptionId/delivery', async (req, res) => {
  try {
    const { date, status = 'delivered' } = req.body;
    const validStatuses = ['delivered', 'missed', 'skipped'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { subscriptionId: req.params.subscriptionId },
      { 
        $push: { deliveredDates: { date: new Date(date), status } },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Delivery status updated', subscriptionId: subscription.subscriptionId });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// Create Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    
    const options = {
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment and create order
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = new Order({
      orderId,
      items: orderDetails.items,
      customerInfo: orderDetails.customerInfo,
      orderType: orderDetails.orderType,
      total: orderDetails.total,
      pickupTime: orderDetails.pickupTime,
      paymentStatus: 'completed',
      orderStatus: 'placed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      createdAt: new Date()
    });

    await order.save();

    res.json({
      orderId: order.orderId,
      paymentId: razorpay_payment_id,
      total: order.total,
      pickupTime: order.pickupTime,
      message: 'Payment verified and order created successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Nisargashree API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});