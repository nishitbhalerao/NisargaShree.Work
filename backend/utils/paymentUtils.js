import crypto from 'crypto';

// Calculate order total with shipping and other charges
export const calculateOrderTotal = (cartItems, products) => {
  const FLAT_SHIPPING_CHARGE = parseFloat(process.env.FLAT_SHIPPING_CHARGE) || 0;
  const FREE_SHIPPING_THRESHOLD = parseFloat(process.env.FREE_SHIPPING_THRESHOLD) || 0;
  
  let subtotal = 0;
  
  // Calculate subtotal based on database prices, not frontend prices
  cartItems.forEach(item => {
    const product = products.find(p => p._id.toString() === item._id || 
                                     p.name === item.name ||
                                     (item._id === 'roti' && p.name === 'Poli (Fresh Roti)') ||
                                     (item._id === 'puranPoli' && p.name === 'Puran Poli') ||
                                     (item._id === 'sahiPuranPoli' && p.name === 'Sahi Puran Poli'));
    
    if (product) {
      subtotal += product.price * item.quantity;
    }
  });
  
  // Calculate shipping
  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_CHARGE;
  
  // Calculate other charges (can be extended)
  const discount = 0; // Can be implemented later
  const tax = 0; // Can be implemented later
  
  const totalAmount = subtotal + shippingCharge + tax - discount;
  
  return {
    subtotal,
    shippingCharge,
    discount,
    tax,
    totalAmount
  };
};

// Convert rupees to paise for Razorpay
export const convertToPaise = (amount) => {
  return Math.round(amount * 100);
};

// Convert paise to rupees
export const convertToRupees = (paise) => {
  return paise / 100;
};

// Verify Razorpay payment signature
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keySecret) {
    throw new Error('Razorpay key secret not configured');
  }
  
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === signature;
};

// Verify webhook signature
export const verifyWebhookSignature = (body, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Razorpay webhook secret not configured');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
    
  return expectedSignature === signature;
};

// Generate unique payment ID
export const generatePaymentId = () => {
  return `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

// Get product mapping for cart items (handles legacy item IDs)
export const getProductFromCartItem = (cartItem, products) => {
  // Handle legacy mapping from frontend cart structure
  const productMap = {
    'roti': 'Poli (Fresh Roti)',
    'puranPoli': 'Puran Poli', 
    'sahiPuranPoli': 'Sahi Puran Poli'
  };
  
  // Try direct ID match first
  let product = products.find(p => p._id.toString() === cartItem._id);
  
  // Try name match
  if (!product) {
    product = products.find(p => p.name === cartItem.name);
  }
  
  // Try legacy ID mapping
  if (!product && productMap[cartItem._id]) {
    product = products.find(p => p.name === productMap[cartItem._id]);
  }
  
  return product;
};