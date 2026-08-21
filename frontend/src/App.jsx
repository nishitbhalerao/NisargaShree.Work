import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const API = '/api';

function App() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [cart, setCart] = useState({
    roti: { quantity: 0, price: 12 },
    puranPoli: { quantity: 0, price: 40 },
    sahiPuranPoli: { quantity: 0, price: 60 }
  });
  const [orderType, setOrderType] = useState('delivery');
  const [orderDetails, setOrderDetails] = useState({
    takeawayTime: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    additionalNotes: ''
  });

  // Modal states
  const [showPuranPoliModal, setShowPuranPoliModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Subscription state
  const [subscription, setSubscription] = useState({
    quantity: 1,
    selectedDates: [],
    customerName: '',
    phoneNumber: '',
    address: '',
    deliveryInstructions: ''
  });
  const [placingSubscription, setPlacingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  // After order is placed
  const [placedOrder, setPlacedOrder] = useState(null); // { orderId, total, orderType }
  const [orderStatus, setOrderStatus] = useState(null); // live status from DB
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  // Notification banner
  const [notification, setNotification] = useState(null);
  const prevStatusRef = useRef(null);
  
  // Checkout summary with shipping
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load checkout summary when order type is selected
  useEffect(() => {
    if (selectedOption === 'orderType' && getTotalItems() > 0) {
      loadCheckoutSummary();
    }
  }, [selectedOption]);

  const loadCheckoutSummary = async () => {
    setLoadingSummary(true);
    try {
      const summary = await getCheckoutSummary();
      setCheckoutSummary(summary);
    } catch (error) {
      console.error('Failed to load checkout summary:', error);
      setPlaceError('Failed to load order summary. Please try again.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Poll order status every 8 seconds when an order is placed
  useEffect(() => {
    if (!placedOrder) return;

    const poll = async () => {
      try {
        const res = await axios.get(`${API}/orders/${placedOrder.orderId}`);
        const newStatus = res.data.orderStatus;

        // Show notification when status changes to ready
        if (
          prevStatusRef.current !== null &&
          prevStatusRef.current !== newStatus &&
          newStatus === 'ready'
        ) {
          setNotification('🎉 Your order is ready! Please collect it or our delivery partner is on the way.');
        }

        // Also notify for out_for_delivery
        if (
          prevStatusRef.current !== null &&
          prevStatusRef.current !== newStatus &&
          newStatus === 'out_for_delivery'
        ) {
          setNotification('🚚 Your order is out for delivery! It will reach you shortly.');
        }

        prevStatusRef.current = newStatus;
        setOrderStatus(newStatus);
      } catch (err) {
        // silent fail on poll
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [placedOrder]);

  // Helpers
  const getTotalItems = () => cart.roti.quantity + cart.puranPoli.quantity + cart.sahiPuranPoli.quantity;
  const getTotalPrice = () =>
    cart.roti.quantity * cart.roti.price + 
    cart.puranPoli.quantity * cart.puranPoli.price + 
    cart.sahiPuranPoli.quantity * cart.sahiPuranPoli.price;

  const updateQuantity = (item, change) => {
    setCart(prev => ({
      ...prev,
      [item]: { ...prev[item], quantity: Math.max(0, prev[item].quantity + change) }
    }));
  };

  const clearCart = () => {
    setCart({ roti: { quantity: 0, price: 12 }, puranPoli: { quantity: 0, price: 40 }, sahiPuranPoli: { quantity: 0, price: 60 } });
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000);
    const endTime = new Date(now.getTime() + 3 * 60 * 60000);
    for (let t = new Date(startTime); t <= endTime; t.setMinutes(t.getMinutes() + 15)) {
      slots.push(t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }
    return slots;
  };

  const handleOrderDetailsChange = (field, value) => {
    setOrderDetails(prev => ({ ...prev, [field]: value }));
  };

  // Build items array for API
  const buildItems = () => {
    const items = [];
    if (cart.roti.quantity > 0)
      items.push({ _id: 'roti', name: 'Poli (Fresh Roti)', price: cart.roti.price, quantity: cart.roti.quantity });
    if (cart.puranPoli.quantity > 0)
      items.push({ _id: 'puranPoli', name: 'Puran Poli', price: cart.puranPoli.price, quantity: cart.puranPoli.quantity });
    if (cart.sahiPuranPoli.quantity > 0)
      items.push({ _id: 'sahiPuranPoli', name: 'Sahi Puran Poli', price: cart.sahiPuranPoli.price, quantity: cart.sahiPuranPoli.quantity });
    return items;
  };

  // Get checkout summary with shipping
  const getCheckoutSummary = async () => {
    try {
      const items = buildItems();
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      const res = await axios.post(`${API}/payment/checkout-summary`, { items });
      return res.data.data;
    } catch (error) {
      console.error('Error getting checkout summary:', error);
      throw error;
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderData) => {
    return new Promise((resolve, reject) => {
      // Check if this is demo mode
      if (orderData.demo) {
        // Simulate payment success in demo mode
        setTimeout(() => {
          resolve({
            razorpay_payment_id: 'pay_demo_' + Date.now(),
            razorpay_order_id: orderData.razorpayOrderId,
            razorpay_signature: 'demo_signature_' + Date.now(),
            orderId: orderData.orderId
          });
        }, 1000);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NisargashreE',
        description: 'Fresh Authentic Food',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: orderType === 'delivery' ? orderDetails.customerName : 'Customer',
          contact: orderType === 'delivery' ? orderDetails.phoneNumber : '9999999999',
          email: 'customer@nisargashree.com'
        },
        theme: {
          color: '#8B4513'
        },
        handler: function (response) {
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderData.orderId
          });
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        reject(new Error(`Payment failed: ${response.error.description}`));
      });
      
      rzp.open();
    });
  };

  // Verify payment with backend
  const verifyPayment = async (paymentData) => {
    try {
      const res = await axios.post(`${API}/payment/verify`, paymentData);
      return res.data;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  };

  // Place order with Razorpay payment
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError('');
    
    try {
      const items = buildItems();
      
      if (items.length === 0) {
        setPlaceError('Your cart is empty. Please add items before placing order.');
        return;
      }
      
      // Validate customer info
      if (orderType === 'delivery') {
        if (!orderDetails.customerName || !orderDetails.phoneNumber || !orderDetails.address) {
          setPlaceError('Please fill all required delivery details.');
          return;
        }
      } else if (orderType === 'takeaway') {
        if (!orderDetails.takeawayTime) {
          setPlaceError('Please select pickup time for takeaway order.');
          return;
        }
      }

      const customerInfo = {
        name: orderType === 'delivery' ? orderDetails.customerName : 'Takeaway Customer',
        phone: orderType === 'delivery' ? orderDetails.phoneNumber : '0000000000',
        address: orderType === 'delivery' ? orderDetails.address : '',
        deliveryInstructions: orderDetails.additionalNotes || ''
      };

      // Create Razorpay order
      const createOrderRes = await axios.post(`${API}/payment/create-order`, {
        items,
        customerInfo,
        orderType,
        pickupTime: orderType === 'takeaway' ? orderDetails.takeawayTime : null
      });

      const orderData = createOrderRes.data.data;
      
      // Open Razorpay checkout
      const paymentResponse = await handleRazorpayPayment(orderData);
      
      // Verify payment
      const verificationResult = await verifyPayment(paymentResponse);
      
      if (verificationResult.success) {
        // Payment successful
        const placed = { 
          orderId: verificationResult.orderId, 
          total: verificationResult.amount, 
          orderType,
          paymentId: verificationResult.paymentId
        };
        setPlacedOrder(placed);
        setOrderStatus('preparing'); // Order moves to preparing after payment
        prevStatusRef.current = 'preparing';
        clearCart();
        setSelectedOption('confirmation');
      } else {
        setPlaceError('Payment verification failed. Please contact support.');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      
      if (error.message.includes('Payment cancelled')) {
        setPlaceError('Payment was cancelled. Your cart has been saved.');
      } else if (error.message.includes('Payment failed')) {
        setPlaceError(error.message);
      } else {
        setPlaceError(error.response?.data?.error || 'Failed to place order. Please try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  // Legacy order placement (COD) - keeping for backward compatibility
  const handlePlaceOrderCOD = async () => {
    setPlacing(true);
    setPlaceError('');
    try {
      const items = buildItems();
      const customerInfo = {
        name: orderType === 'delivery' ? orderDetails.customerName : 'Takeaway Customer',
        phone: orderType === 'delivery' ? orderDetails.phoneNumber : '0000000000',
        address: orderType === 'delivery' ? orderDetails.address : '',
        deliveryInstructions: orderDetails.additionalNotes || ''
      };

      const body = {
        items,
        customerInfo,
        orderType,
        total: getTotalPrice(),
        pickupTime: orderType === 'takeaway' ? orderDetails.takeawayTime : null
      };

      const res = await axios.post(`${API}/orders`, body);
      const placed = { orderId: res.data.orderId, total: res.data.total, orderType };
      setPlacedOrder(placed);
      setOrderStatus('placed');
      prevStatusRef.current = 'placed';
      clearCart();
      setSelectedOption('confirmation');
    } catch (err) {
      setPlaceError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // Place subscription
  const handlePlaceSubscription = async () => {
    if (!subscription.customerName || !subscription.phoneNumber || !subscription.address || subscription.selectedDates.length === 0) {
      setSubscriptionError('Please fill all required fields and select at least one date.');
      return;
    }

    setPlacingSubscription(true);
    setSubscriptionError('');
    try {
      const customerInfo = {
        name: subscription.customerName,
        phone: subscription.phoneNumber,
        address: subscription.address,
        deliveryInstructions: subscription.deliveryInstructions
      };

      const item = {
        name: 'Poli (Fresh Roti)',
        price: 12,
        quantity: subscription.quantity
      };

      const totalAmount = subscription.selectedDates.length * subscription.quantity * 12;

      const body = {
        customerInfo,
        item,
        selectedDates: subscription.selectedDates,
        totalAmount
      };

      await axios.post(`${API}/subscriptions`, body);
      
      setShowSubscriptionModal(false);
      setSubscription({ quantity: 1, selectedDates: [], customerName: '', phoneNumber: '', address: '', deliveryInstructions: '' });
      alert(`Subscription created successfully! Total: ₹${totalAmount} for ${subscription.selectedDates.length} days`);
    } catch (err) {
      setSubscriptionError(err.response?.data?.error || 'Failed to create subscription. Please try again.');
    } finally {
      setPlacingSubscription(false);
    }
  };

  const toggleDateSelection = (dateStr) => {
    setSubscription(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(dateStr)
        ? prev.selectedDates.filter(d => d !== dateStr)
        : [...prev.selectedDates, dateStr].sort()
    }));
  };

  const generateCalendarDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const statusLabel = {
    placed: '✅ Order Placed',
    preparing: '👨‍🍳 Being Prepared',
    ready: '🎉 Ready!',
    out_for_delivery: '🚚 Out for Delivery',
    delivered: '✔️ Delivered',
    cancelled: '❌ Cancelled'
  };

  const statusColor = {
    placed: '#3498db',
    preparing: '#f39c12',
    ready: '#27ae60',
    out_for_delivery: '#8e44ad',
    delivered: '#2ecc71',
    cancelled: '#e74c3c'
  };

  /* ─── Pages ─── */

  const LandingPage = () => (
    <div className="landing-page">
      <header className="header">
        <div className="container">
          <div className="logo">
            <img src="/images/logo.png" alt="Nisargashree Logo" className="logo-img" />
            <div className="logo-text">
              <h1>NisargashreE</h1>
              <p>Experience the Taste of Tradition</p>
            </div>
          </div>
          <nav className="nav">
            <button className="nav-btn cart-nav" onClick={() => setSelectedOption('cart')}>
              🛒 Cart ({getTotalItems()})
            </button>
            {placedOrder && (
              <button className="nav-btn track-nav" onClick={() => setSelectedOption('confirmation')}>
                📦 Track Order
              </button>
            )}
            <button className="nav-btn" onClick={() => setSelectedOption('about')}>About Us</button>
            <button className="nav-btn">Contact</button>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Grace In Every Taste</h2>
          <p><b>Freshly made, authentic Maharastrian cuisine delivered to your doorstep</b></p>
        </div>
      </section>

      <section className="main-options">
        <div className="container">
          <h3>Choose Your Experience</h3>
          <div className="options-grid">
            <div className="option-card">
              <div className="card-image">
                <img src="/images/roti.jpeg" alt="Fresh Rotis" />
                <div className="card-overlay">
                  <span className="card-tag">Fresh Daily</span>
                </div>
              </div>
              <div className="card-content">
                <div className="card-header-section">
                  <h4>Poli</h4>
                  <button className="subscription-btn" onClick={() => setShowSubscriptionModal(true)}>
                    📅 Subscription
                  </button>
                </div>
                <p>Handmade chapatis, parathas, and traditional breads made fresh daily with premium ingredients</p>
                <div className="price-section"><span className="price">₹12 per piece</span></div>
                {cart.roti.quantity === 0 ? (
                  <button className="order-btn" onClick={() => updateQuantity('roti', 1)}>Order Fresh Rotis</button>
                ) : (
                  <div className="quantity-section">
                    <div className="quantity-controls">
                      <button className="qty-btn" onClick={() => updateQuantity('roti', -1)}>−</button>
                      <span className="quantity">{cart.roti.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity('roti', 1)}>+</button>
                    </div>
                    <div className="item-total">Total: ₹{cart.roti.quantity * cart.roti.price}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="option-card">
              <div className="card-image">
                <img src="/images/puran-poli.jpeg" alt="Puran Poli" />
                <div className="card-overlay"><span className="card-tag">Traditional</span></div>
              </div>
              <div className="card-content">
                <h4>Puran Poli Varieties</h4>
                <p>Traditional Maharashtrian sweet flatbread stuffed with jaggery and lentil filling - choose your favorite!</p>
                <div className="price-section"><span className="price">Starting from ₹40</span></div>
                <button className="order-btn" onClick={() => setShowPuranPoliModal(true)}>
                  Choose Puran Poli
                </button>
                {(cart.puranPoli.quantity > 0 || cart.sahiPuranPoli.quantity > 0) && (
                  <div className="selected-variants">
                    {cart.puranPoli.quantity > 0 && (
                      <div className="variant-item">
                        <span>Puran Poli × {cart.puranPoli.quantity}</span>
                        <span>₹{cart.puranPoli.quantity * cart.puranPoli.price}</span>
                      </div>
                    )}
                    {cart.sahiPuranPoli.quantity > 0 && (
                      <div className="variant-item">
                        <span>Sahi Puran Poli × {cart.sahiPuranPoli.quantity}</span>
                        <span>₹{cart.sahiPuranPoli.quantity * cart.sahiPuranPoli.price}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {getTotalItems() > 0 && (
        <div className="cart-summary">
          <div className="cart-info">
            <span className="cart-count">{getTotalItems()} item{getTotalItems() > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{getTotalPrice()}</span>
          </div>
          <button className="checkout-btn" onClick={() => setSelectedOption('cart')}>View Cart & Checkout</button>
        </div>
      )}

      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature"><div className="feature-icon">⏰</div><h4>Fresh Daily</h4><p>Made fresh every morning with traditional methods</p></div>
            <div className="feature"><div className="feature-icon">🚚</div><h4>Quick Delivery</h4><p>Hot and fresh delivery within 45 minutes</p></div>
            <div className="feature"><div className="feature-icon">🌿</div><h4>Natural Ingredients</h4><p>Only premium, natural ingredients used</p></div>
            <div className="feature"><div className="feature-icon">👨‍🍳</div><h4>Traditional Recipes</h4><p>Time-tested family recipes passed down generations</p></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section"><h4>Nisargashree</h4><p>Authentic traditional food made with love</p></div>
            <div className="footer-section"><h4>Contact</h4><p>📞 +91 9876543210</p><p>📧 nisargashree@gmail.com</p></div>
            <div className="footer-section"><h4>Delivery Areas</h4><p>Pune, Pimpri Chinchwad</p></div>
          </div>
          <div className="footer-bottom"><p>&copy; 2022 Nisargashree. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  );

  const CartPage = () => (
    <div className="cart-page">
      <header className="product-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setSelectedOption(null)}>← Back to Home</button>
          <h2>Your Cart</h2>
        </div>
        {getTotalItems() > 0 && (
          <button className="clear-cart-btn" onClick={clearCart}>🗑️ Clear Cart</button>
        )}
      </header>
      <div className="container">
        {getTotalItems() === 0 ? (
          <div className="empty-cart">
            <h3>Your cart is empty</h3>
            <p>Add some delicious items to get started!</p>
            <button className="order-btn" onClick={() => setSelectedOption(null)}>Continue Shopping</button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.roti.quantity > 0 && (
                <div className="cart-item">
                  <img src="/images/roti.jpeg" alt="Roti" />
                  <div className="item-details"><h4>Poli (Fresh Roti)</h4><p>₹{cart.roti.price} per piece</p></div>
                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => updateQuantity('roti', -1)}>−</button>
                    <span className="quantity">{cart.roti.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity('roti', 1)}>+</button>
                  </div>
                  <div className="item-total">₹{cart.roti.quantity * cart.roti.price}</div>
                </div>
              )}
              {cart.puranPoli.quantity > 0 && (
                <div className="cart-item">
                  <img src="/images/puran-poli.jpeg" alt="Puran Poli" />
                  <div className="item-details"><h4>Puran Poli</h4><p>₹{cart.puranPoli.price} per piece</p></div>
                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => updateQuantity('puranPoli', -1)}>−</button>
                    <span className="quantity">{cart.puranPoli.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity('puranPoli', 1)}>+</button>
                  </div>
                  <div className="item-total">₹{cart.puranPoli.quantity * cart.puranPoli.price}</div>
                </div>
              )}
              {cart.sahiPuranPoli.quantity > 0 && (
                <div className="cart-item">
                  <img src="/images/puran-poli.jpeg" alt="Sahi Puran Poli" />
                  <div className="item-details"><h4>Sahi Puran Poli</h4><p>₹{cart.sahiPuranPoli.price} per piece</p></div>
                  <div className="quantity-controls">
                    <button className="qty-btn" onClick={() => updateQuantity('sahiPuranPoli', -1)}>−</button>
                    <span className="quantity">{cart.sahiPuranPoli.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity('sahiPuranPoli', 1)}>+</button>
                  </div>
                  <div className="item-total">₹{cart.sahiPuranPoli.quantity * cart.sahiPuranPoli.price}</div>
                </div>
              )}
            </div>
            <div className="cart-summary-section">
              <div className="summary-row"><span>Subtotal ({getTotalItems()} items)</span><span>₹{getTotalPrice()}</span></div>
              <div className="summary-row total-row"><span>Total</span><span>₹{getTotalPrice()}</span></div>
              <button className="proceed-btn" onClick={() => setSelectedOption('orderType')}>
                Proceed to Checkout - ₹{getTotalPrice()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const OrderTypePage = () => (
    <div className="order-type-page">
      <header className="product-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setSelectedOption('cart')}>← Back to Cart</button>
          <h2>Choose Your Order Type</h2>
        </div>
      </header>
      <div className="container">
        <p className="order-subtitle">Please select your preferred order method before proceeding.</p>
        <div className="order-type-grid">
          {/* Takeaway */}
          <div
            className={`order-type-card ${orderType === 'takeaway' ? 'selected' : ''}`}
            onClick={() => setOrderType('takeaway')}
          >
            <div className="order-type-header">
              <span className="order-type-icon">🛍️</span>
              <h3>Option 1: Takeaway</h3>
            </div>
            <p className="order-type-desc">Collect your order directly from our store.</p>
            <div className="instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>• Pickup is available only from our store location</li>
                <li>• Please collect your order at your selected pickup time</li>
                <li>• Latest pickup time is up to 3 hours from order placement</li>
              </ul>
              <div className="pickup-address">
                <strong>Pickup Address:</strong> Shop No. 15, Ground Floor, Nisargashree Complex, MG Road, Mumbai - 400001
              </div>
            </div>
            <div className="takeaway-form">
              <h4>Select Pickup Time:</h4>
              <select
                value={orderType === 'takeaway' ? orderDetails.takeawayTime : ''}
                onChange={(e) => handleOrderDetailsChange('takeawayTime', e.target.value)}
                className="time-select"
                disabled={orderType !== 'takeaway'}
              >
                <option value="">Select pickup time</option>
                {generateTimeSlots().map((time, i) => <option key={i} value={time}>{time}</option>)}
              </select>
            </div>
          </div>

          {/* Home Delivery */}
          <div
            className={`order-type-card ${orderType === 'delivery' ? 'selected' : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            <div className="order-type-header">
              <span className="order-type-icon">🚚</span>
              <h3>Option 2: Home Delivery</h3>
            </div>
            <p className="order-type-desc">Get your order delivered to your doorstep.</p>
            <div className="delivery-form">
              <h4>Fill in your details:</h4>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" value={orderType === 'delivery' ? orderDetails.customerName : ''} onChange={(e) => handleOrderDetailsChange('customerName', e.target.value)} placeholder="Enter your full name" disabled={orderType !== 'delivery'} />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="tel" value={orderType === 'delivery' ? orderDetails.phoneNumber : ''} onChange={(e) => handleOrderDetailsChange('phoneNumber', e.target.value)} placeholder="Enter your mobile number" disabled={orderType !== 'delivery'} />
              </div>
              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea value={orderType === 'delivery' ? orderDetails.address : ''} onChange={(e) => handleOrderDetailsChange('address', e.target.value)} placeholder="Enter your complete delivery address" rows="3" disabled={orderType !== 'delivery'} />
              </div>
              <div className="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea value={orderType === 'delivery' ? orderDetails.additionalNotes : ''} onChange={(e) => handleOrderDetailsChange('additionalNotes', e.target.value)} placeholder="Any special instructions" rows="2" disabled={orderType !== 'delivery'} />
              </div>
              <div className="delivery-note">
                <h4>Important:</h4>
                <ul>
                  <li>• Delivery charges are paid separately on delivery</li>
                  <li>• By selecting Home Delivery you agree to pay applicable delivery fee</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {orderType && (
          <div className="order-summary-final">
            <div className="final-summary">
              <h3>Order Summary</h3>
              
              {loadingSummary ? (
                <div className="loading-summary">Loading order summary...</div>
              ) : checkoutSummary ? (
                <div className="summary-items">
                  {checkoutSummary.items.map((item, index) => (
                    <div key={index} className="summary-item">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="summary-item subtotal">
                    <span>Subtotal</span>
                    <span>₹{checkoutSummary.subtotal}</span>
                  </div>
                  {checkoutSummary.shippingCharge > 0 && (
                    <div className="summary-item shipping">
                      <span>
                        {orderType === 'delivery' ? 'Delivery Charge' : 'Packaging Charge'}
                        {checkoutSummary.shippingCharge === 0 && <small> (FREE)</small>}
                      </span>
                      <span>₹{checkoutSummary.shippingCharge}</span>
                    </div>
                  )}
                  {checkoutSummary.discount > 0 && (
                    <div className="summary-item discount">
                      <span>Discount</span>
                      <span>-₹{checkoutSummary.discount}</span>
                    </div>
                  )}
                  {checkoutSummary.tax > 0 && (
                    <div className="summary-item tax">
                      <span>Tax</span>
                      <span>₹{checkoutSummary.tax}</span>
                    </div>
                  )}
                  <div className="summary-item total">
                    <span>Total to Pay</span>
                    <span>₹{checkoutSummary.totalAmount}</span>
                  </div>
                </div>
              ) : (
                <div className="summary-items">
                  {cart.roti.quantity > 0 && (
                    <div className="summary-item"><span>Poli × {cart.roti.quantity}</span><span>₹{cart.roti.quantity * cart.roti.price}</span></div>
                  )}
                  {cart.puranPoli.quantity > 0 && (
                    <div className="summary-item"><span>Puran Poli × {cart.puranPoli.quantity}</span><span>₹{cart.puranPoli.quantity * cart.puranPoli.price}</span></div>
                  )}
                  {cart.sahiPuranPoli.quantity > 0 && (
                    <div className="summary-item"><span>Sahi Puran Poli × {cart.sahiPuranPoli.quantity}</span><span>₹{cart.sahiPuranPoli.quantity * cart.sahiPuranPoli.price}</span></div>
                  )}
                  <div className="summary-item subtotal"><span>Subtotal</span><span>₹{getTotalPrice()}</span></div>
                  <div className="summary-item total"><span>Total to Pay Now</span><span>₹{getTotalPrice()}</span></div>
                </div>
              )}

              {placeError && <div className="error-msg">⚠️ {placeError}</div>}

              <button
                className="final-checkout-btn"
                disabled={
                  placing ||
                  loadingSummary ||
                  (orderType === 'takeaway' && !orderDetails.takeawayTime) ||
                  (orderType === 'delivery' && (!orderDetails.customerName || !orderDetails.phoneNumber || !orderDetails.address))
                }
                onClick={handlePlaceOrder}
              >
                {placing ? 'Placing Order...' : loadingSummary ? 'Loading...' : 
                  `Pay Now - ₹${checkoutSummary?.totalAmount || getTotalPrice()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ConfirmationPage = () => (
    <div className="confirmation-page">
      <header className="product-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setSelectedOption(null)}>← Back to Home</button>
          <h2>Order Confirmation</h2>
        </div>
      </header>
      <div className="container">
        <div className="confirmation-card">
          <div className="confirmation-icon">🎊</div>
          <h2>Order Placed Successfully!</h2>
          <p className="order-id-display">Order ID: <strong>{placedOrder?.orderId}</strong></p>
          <p className="order-total-display">Total: <strong>₹{placedOrder?.total}</strong></p>
          <p className="order-type-display">
            {placedOrder?.orderType === 'takeaway' ? '🛍️ Takeaway' : '🚚 Home Delivery'}
          </p>

          <div className="status-tracker">
            <h3>Live Order Status</h3>
            <div
              className="live-status-badge"
              style={{ backgroundColor: statusColor[orderStatus] || '#95a5a6' }}
            >
              {statusLabel[orderStatus] || orderStatus}
            </div>
            <p className="status-note">This page refreshes automatically every 8 seconds.</p>

            {/* Progress steps */}
            <div className="progress-steps">
              {['placed', 'preparing', 'ready', orderType === 'takeaway' ? null : 'out_for_delivery', 'delivered']
                .filter(Boolean)
                .map((step, i) => {
                  const steps = ['placed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].filter(
                    s => placedOrder?.orderType === 'takeaway' ? s !== 'out_for_delivery' : true
                  );
                  const currentIdx = steps.indexOf(orderStatus);
                  const stepIdx = steps.indexOf(step);
                  return (
                    <div key={step} className={`step ${stepIdx <= currentIdx ? 'done' : ''} ${stepIdx === currentIdx ? 'active' : ''}`}>
                      <div className="step-dot"></div>
                      <div className="step-label">{statusLabel[step]}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // About Us Page Component
  const AboutUsPage = () => (
    <div className="about-page">
      <header className="product-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setSelectedOption(null)}>
            ← Back to Home
          </button>
          <h2>About NisargShree</h2>
        </div>
      </header>
      
      <div className="container">
        <div className="about-content">
          <div className="about-section">
            <h1>About NisargShree</h1>
            
            <div className="about-text">
              <p>
                NisargShree was born out of a deep connection to the Konkan region — a bond that has shaped our family for years. Long before it became a brand, it was simply a way of life: my father has been involved in Konkan products for a long time, and growing up around that world meant quality, authenticity, and honest trade weren't things I had to learn — they were things I had already lived.
              </p>

              <p>
                Formally established in 2022, NisargShree carries that same spirit forward. We believe good products don't need to shout — they simply need to be genuine. What we bring to you isn't just a product line; it's a piece of Konkan itself, offered the way it has always been known within our family — real, rooted, and without pretence.
              </p>

              <h3>Founder's Vision:</h3>
              <p>
                What began as a smaller, part-time idea, soon grew into something far more meaningful. Somewhere through this journey, the vision shifted entirely. A modest ambition turned into a genuine commitment to build NisargShree into a proper, lasting brand.
              </p>

              <p>
                Looking ahead, the plan is to grow thoughtfully into the food and hospitality space, opening multiple branches over time. Each one may take its own shape, but every branch will carry forward the same NisargShree identity — the same values, the same roots, the same promise we started with. We're still early in this journey, but it's one we believe leads somewhere bright.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      {/* Global notification banner */}
      {notification && (
        <div className="notification-banner">
          <span>{notification}</span>
          <button className="notif-close" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Puran Poli Selection Modal */}
      {showPuranPoliModal && (
        <div className="modal-overlay" onClick={() => setShowPuranPoliModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Your Puran Poli</h3>
              <button className="modal-close" onClick={() => setShowPuranPoliModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="variant-options">
                <div className="variant-card">
                  <img src="/images/puran-poli.jpeg" alt="Puran Poli" />
                  <h4>Puran Poli</h4>
                  <p>Traditional sweet flatbread with jaggery and lentil filling</p>
                  <div className="variant-price">₹40 per piece</div>
                  {cart.puranPoli.quantity === 0 ? (
                    <button className="variant-btn" onClick={() => { updateQuantity('puranPoli', 1); setShowPuranPoliModal(false); }}>
                      Add to Cart
                    </button>
                  ) : (
                    <div className="quantity-controls">
                      <button className="qty-btn" onClick={() => updateQuantity('puranPoli', -1)}>−</button>
                      <span className="quantity">{cart.puranPoli.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity('puranPoli', 1)}>+</button>
                    </div>
                  )}
                </div>
                
                <div className="variant-card">
                  <img src="/images/puran-poli.jpeg" alt="Sahi Puran Poli" />
                  <h4>Sahi Puran Poli</h4>
                  <p>Premium version with extra ghee, nuts and premium ingredients</p>
                  <div className="variant-price">₹60 per piece</div>
                  {cart.sahiPuranPoli.quantity === 0 ? (
                    <button className="variant-btn" onClick={() => { updateQuantity('sahiPuranPoli', 1); setShowPuranPoliModal(false); }}>
                      Add to Cart
                    </button>
                  ) : (
                    <div className="quantity-controls">
                      <button className="qty-btn" onClick={() => updateQuantity('sahiPuranPoli', -1)}>−</button>
                      <span className="quantity">{cart.sahiPuranPoli.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity('sahiPuranPoli', 1)}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
          <div className="modal-content subscription-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Poli Subscription Plan</h3>
              <button className="modal-close" onClick={() => setShowSubscriptionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="subscription-form">
                <div className="form-section">
                  <h4>Subscription Details</h4>
                  <div className="form-group">
                    <label>Daily Quantity</label>
                    <div className="quantity-controls">
                      <button className="qty-btn" onClick={() => setSubscription(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}>−</button>
                      <span className="quantity">{subscription.quantity} pieces daily</span>
                      <button className="qty-btn" onClick={() => setSubscription(p => ({ ...p, quantity: p.quantity + 1 }))}>+</button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Select Delivery Dates (₹{12 * subscription.quantity} per day)</label>
                    <div className="calendar-grid">
                      {generateCalendarDates().map(dateStr => {
                        const date = new Date(dateStr);
                        const isSelected = subscription.selectedDates.includes(dateStr);
                        return (
                          <button
                            key={dateStr}
                            className={`calendar-date ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleDateSelection(dateStr)}
                          >
                            <div className="date-day">{date.getDate()}</div>
                            <div className="date-month">{date.toLocaleDateString('en', { month: 'short' })}</div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="selection-summary">
                      Selected: {subscription.selectedDates.length} days | 
                      Total: ₹{subscription.selectedDates.length * subscription.quantity * 12}
                    </p>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Delivery Details</h4>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" value={subscription.customerName} onChange={(e) => setSubscription(p => ({ ...p, customerName: e.target.value }))} placeholder="Enter your full name" />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" value={subscription.phoneNumber} onChange={(e) => setSubscription(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="Enter your mobile number" />
                  </div>
                  <div className="form-group">
                    <label>Delivery Address *</label>
                    <textarea value={subscription.address} onChange={(e) => setSubscription(p => ({ ...p, address: e.target.value }))} placeholder="Enter your complete delivery address" rows="3" />
                  </div>
                  <div className="form-group">
                    <label>Delivery Instructions (Optional)</label>
                    <textarea value={subscription.deliveryInstructions} onChange={(e) => setSubscription(p => ({ ...p, deliveryInstructions: e.target.value }))} placeholder="Any special instructions" rows="2" />
                  </div>
                </div>

                {subscriptionError && <div className="error-msg">⚠️ {subscriptionError}</div>}

                <div className="subscription-actions">
                  <button className="cancel-btn" onClick={() => setShowSubscriptionModal(false)}>Cancel</button>
                  <button 
                    className="subscribe-btn" 
                    disabled={placingSubscription || subscription.selectedDates.length === 0}
                    onClick={handlePlaceSubscription}
                  >
                    {placingSubscription ? 'Creating...' : `Subscribe - ₹${subscription.selectedDates.length * subscription.quantity * 12}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOption === null && <LandingPage />}
      {selectedOption === 'cart' && <CartPage />}
      {selectedOption === 'orderType' && <OrderTypePage />}
      {selectedOption === 'confirmation' && placedOrder && <ConfirmationPage />}
      {selectedOption === 'about' && <AboutUsPage />}
    </div>
  );
}

export default App;
