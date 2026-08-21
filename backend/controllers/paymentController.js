import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import {
  calculateOrderTotal,
  convertToPaise,
  convertToRupees,
  verifyPaymentSignature,
  verifyWebhookSignature,
  generatePaymentId,
  getProductFromCartItem
} from '../utils/paymentUtils.js';

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

// Get checkout summary
export const getCheckoutSummary = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Get all products from database
    const products = await Product.find();
    
    // Validate items and calculate pricing
    const validatedItems = [];
    let hasError = false;
    
    for (const item of items) {
      const product = getProductFromCartItem(item, products);
      
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item._id}` });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
      }
      
      validatedItems.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image || ''
      });
    }
    
    // Calculate totals
    const pricing = calculateOrderTotal(validatedItems, products);
    
    res.json({
      success: true,
      data: {
        items: validatedItems,
        subtotal: pricing.subtotal,
        shippingCharge: pricing.shippingCharge,
        discount: pricing.discount,
        tax: pricing.tax,
        totalAmount: pricing.totalAmount,
        currency: 'INR'
      }
    });
    
  } catch (error) {
    console.error('Error calculating checkout summary:', error);
    res.status(500).json({ error: 'Failed to calculate checkout summary' });
  }
};

// Create Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, customerInfo, orderType, pickupTime } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    if (!customerInfo || !orderType) {
      return res.status(400).json({ error: 'Missing required order information' });
    }
    
    // Validate customer info based on order type
    if (orderType === 'delivery' && (!customerInfo.name || !customerInfo.phone || !customerInfo.address)) {
      return res.status(400).json({ error: 'Name, phone, and address are required for delivery orders' });
    }
    
    if (orderType === 'takeaway' && !pickupTime) {
      return res.status(400).json({ error: 'Pickup time is required for takeaway orders' });
    }
    
    // Get all products from database
    const products = await Product.find();
    
    // Validate items and get current prices
    const validatedItems = [];
    
    for (const item of items) {
      const product = getProductFromCartItem(item, products);
      
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item._id}` });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${product.name}` });
      }
      
      validatedItems.push({
        _id: product._id,
        name: product.name,
        price: product.price, // Always use database price
        quantity: item.quantity,
        image: product.image || ''
      });
    }
    
    // Calculate totals using backend logic
    const pricing = calculateOrderTotal(validatedItems, products);
    
    if (pricing.totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }
    
    // Generate internal order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create internal order (pending payment)
    const order = new Order({
      orderId,
      items: validatedItems,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address || '',
        deliveryInstructions: customerInfo.deliveryInstructions || ''
      },
      orderType,
      total: pricing.totalAmount,
      deliveryFee: pricing.shippingCharge,
      pickupTime: orderType === 'takeaway' ? pickupTime : null,
      paymentStatus: 'pending',
      orderStatus: 'placed'
    });
    
    await order.save();
    
    // Check if Razorpay is initialized
    if (!razorpay) {
      // Demo mode - return mock Razorpay order
      const mockRazorpayOrderId = `order_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // Create payment record
      const paymentId = generatePaymentId();
      const payment = new Payment({
        paymentId,
        orderId: orderId,
        razorpayOrderId: mockRazorpayOrderId,
        amount: pricing.totalAmount,
        subtotal: pricing.subtotal,
        shippingCharge: pricing.shippingCharge,
        discount: pricing.discount,
        tax: pricing.tax,
        status: 'created'
      });
      
      await payment.save();
      
      // Update order with mock Razorpay order ID
      await Order.findOneAndUpdate(
        { orderId },
        { razorpayOrderId: mockRazorpayOrderId }
      );
      
      return res.status(201).json({
        success: true,
        demo: true,
        message: 'Demo mode - using mock payment data',
        data: {
          orderId: orderId,
          razorpayOrderId: mockRazorpayOrderId,
          keyId: 'rzp_test_demo_key',
          amount: convertToPaise(pricing.totalAmount),
          currency: 'INR',
          subtotal: pricing.subtotal,
          shipping: pricing.shippingCharge,
          discount: pricing.discount,
          tax: pricing.tax,
          total: pricing.totalAmount
        }
      });
    }
    
    // Real Razorpay mode
    const razorpayOrderOptions = {
      amount: convertToPaise(pricing.totalAmount),
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId: orderId,
        customerName: customerInfo.name,
        orderType: orderType
      }
    };
    
    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    
    // Create payment record
    const paymentId = generatePaymentId();
    const payment = new Payment({
      paymentId,
      orderId: orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: pricing.totalAmount,
      subtotal: pricing.subtotal,
      shippingCharge: pricing.shippingCharge,
      discount: pricing.discount,
      tax: pricing.tax,
      status: 'created'
    });
    
    await payment.save();
    
    // Update order with Razorpay order ID
    await Order.findOneAndUpdate(
      { orderId },
      { razorpayOrderId: razorpayOrder.id }
    );
    
    res.status(201).json({
      success: true,
      data: {
        orderId: orderId,
        razorpayOrderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: convertToPaise(pricing.totalAmount),
        currency: 'INR',
        subtotal: pricing.subtotal,
        shipping: pricing.shippingCharge,
        discount: pricing.discount,
        tax: pricing.tax,
        total: pricing.totalAmount
      }
    });
    
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      orderId 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }
    
    // Find the payment record
    const payment = await Payment.findOne({ 
      orderId: orderId,
      razorpayOrderId: razorpay_order_id 
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }
    
    // Check if payment is already processed (idempotency)
    if (payment.status === 'paid' && payment.signatureVerified) {
      return res.json({
        success: true,
        message: 'Payment already verified',
        orderId: orderId,
        paymentId: razorpay_payment_id,
        amount: payment.amount
      });
    }
    
    // Check for demo payment
    const isDemoPayment = razorpay_payment_id.startsWith('pay_demo_') || 
                         razorpay_signature.startsWith('demo_signature_');
    
    let isValid = true;
    
    if (!isDemoPayment && razorpay) {
      // Verify real Razorpay signature
      isValid = verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    }
    
    if (!isValid && !isDemoPayment) {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { orderId: orderId },
        { 
          status: 'failed',
          failureReason: 'Invalid payment signature'
        }
      );
      
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
    
    // Payment verification successful - update records
    await Payment.findOneAndUpdate(
      { orderId: orderId },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        signatureVerified: true
      }
    );
    
    // Update order status
    await Order.findOneAndUpdate(
      { orderId: orderId },
      {
        paymentStatus: 'completed',
        orderStatus: 'preparing', // Move to next stage
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      }
    );
    
    // TODO: Reduce stock quantities here if stock management is implemented
    
    res.json({
      success: true,
      message: isDemoPayment ? 'Demo payment verified successfully' : 'Payment verified successfully',
      orderId: orderId,
      paymentId: razorpay_payment_id,
      amount: payment.amount,
      demo: isDemoPayment
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Retry payment for existing order
export const retryPayment = async (req, res) => {
  try {
    // Check if Razorpay is initialized
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service is not available. Please configure Razorpay keys.' });
    }
    
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if order is eligible for retry
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ error: 'Order is already paid' });
    }
    
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cannot retry payment for cancelled order' });
    }
    
    // Get products to recalculate current prices
    const products = await Product.find();
    
    // Validate items are still available
    for (const item of order.items) {
      const product = products.find(p => p._id.toString() === item._id);
      if (!product) {
        return res.status(400).json({ error: `Product no longer available: ${item.name}` });
      }
    }
    
    // Recalculate pricing with current prices
    const pricing = calculateOrderTotal(order.items, products);
    
    // Create new Razorpay order
    const razorpayOrderOptions = {
      amount: convertToPaise(pricing.totalAmount),
      currency: 'INR',
      receipt: `${orderId}_RETRY_${Date.now()}`,
      notes: {
        orderId: orderId,
        customerName: order.customerInfo.name,
        orderType: order.orderType,
        isRetry: true
      }
    };
    
    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    
    // Update existing payment record
    await Payment.findOneAndUpdate(
      { orderId: orderId },
      {
        razorpayOrderId: razorpayOrder.id,
        amount: pricing.totalAmount,
        subtotal: pricing.subtotal,
        shippingCharge: pricing.shippingCharge,
        status: 'created',
        retryCount: { $inc: 1 }
      }
    );
    
    // Update order
    await Order.findOneAndUpdate(
      { orderId },
      { 
        razorpayOrderId: razorpayOrder.id,
        total: pricing.totalAmount,
        deliveryFee: pricing.shippingCharge
      }
    );
    
    res.json({
      success: true,
      data: {
        orderId: orderId,
        razorpayOrderId: razorpayOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: convertToPaise(pricing.totalAmount),
        currency: 'INR',
        total: pricing.totalAmount
      }
    });
    
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({ error: 'Failed to retry payment' });
  }
};

// Webhook handler
export const handleWebhook = async (req, res) => {
  try {
    const webhookBody = JSON.stringify(req.body);
    const webhookSignature = req.headers['x-razorpay-signature'];
    
    if (!webhookSignature) {
      return res.status(400).json({ error: 'No webhook signature found' });
    }
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(webhookBody, webhookSignature);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    
    const event = req.body;
    
    // Handle payment events
    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      
      // Find payment record
      const payment = await Payment.findOne({ razorpayOrderId });
      
      if (payment && !payment.webhookProcessed) {
        // Update payment status
        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            razorpayPaymentId,
            status: 'paid',
            webhookProcessed: true,
            paymentMethod: paymentEntity.method || 'other'
          }
        );
        
        // Update order status
        await Order.findOneAndUpdate(
          { orderId: payment.orderId },
          {
            paymentStatus: 'completed',
            orderStatus: 'preparing'
          }
        );
      }
    }
    
    if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      // Update payment status
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        {
          status: 'failed',
          failureReason: paymentEntity.error_description || 'Payment failed',
          webhookProcessed: true
        }
      );
    }
    
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};