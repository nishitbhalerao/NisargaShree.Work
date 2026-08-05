import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedOption, setSelectedOption] = useState(null);
  const [cart, setCart] = useState({
    roti: { quantity: 0, price: 40 },
    puranPoli: { quantity: 0, price: 80 }
  });
  const [orderType, setOrderType] = useState('delivery'); // Set default to delivery
  const [orderDetails, setOrderDetails] = useState({
    takeawayTime: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    additionalNotes: ''
  });

  // Calculate total cart items and price
  const getTotalItems = () => {
    return cart.roti.quantity + cart.puranPoli.quantity;
  };

  const getTotalPrice = () => {
    return (cart.roti.quantity * cart.roti.price) + (cart.puranPoli.quantity * cart.puranPoli.price);
  };

  // Update cart quantity
  const updateQuantity = (item, change) => {
    setCart(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        quantity: Math.max(0, prev[item].quantity + change)
      }
    }));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart({
      roti: { quantity: 0, price: 40 },
      puranPoli: { quantity: 0, price: 80 }
    });
  };

  // Generate time slots (current time + 30 minutes to current time + 3 hours)
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
    const endTime = new Date(now.getTime() + 3 * 60 * 60000); // 3 hours from now
    
    for (let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + 15)) {
      const timeString = time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      slots.push(timeString);
    }
    return slots;
  };

  const handleOrderDetailsChange = (field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const LandingPage = () => (
    <div className="landing-page">
      {/* Header */}
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
            <button className="nav-btn">About Us</button>
            <button className="nav-btn">Contact</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Grace In Every Taste</h2>
          <p><b>Freshly made, authentic Maharastrian  cuisine delivered to your doorstep</b></p>
        </div>
      </section>

      {/* Main Options */}
      <section className="main-options">
        <div className="container">
          <h3>Choose Your Experience</h3>
          <div className="options-grid">
            
            {/* Option 1: Fresh Rotis */}
            <div className="option-card">
              <div className="card-image">
                <img 
                  src="/images/roti.jpeg" 
                  alt="Fresh Rotis"
                />
                <div className="card-overlay">
                  <span className="card-tag">Fresh Daily</span>
                </div>
              </div>
              <div className="card-content">
                <h4>Poli</h4>
                <p>Handmade chapatis, parathas, and traditional breads made fresh daily with premium ingredients</p>
                <div className="price-section">
                  <span className="price">₹40 per piece</span>
                </div>
                {cart.roti.quantity === 0 ? (
                  <button 
                    className="order-btn"
                    onClick={() => updateQuantity('roti', 1)}
                  >
                    Order Fresh Rotis
                  </button>
                ) : (
                  <div className="quantity-section">
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity('roti', -1)}
                      >
                        −
                      </button>
                      <span className="quantity">{cart.roti.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity('roti', 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      Total: ₹{cart.roti.quantity * cart.roti.price}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Puran Poli */}
            <div className="option-card">
              <div className="card-image">
                <img 
                  src="/images/puran-poli.jpeg" 
                  alt="Puran Poli"
                />
                <div className="card-overlay">
                  <span className="card-tag">Traditional</span>
                </div>
              </div>
              <div className="card-content">
                <h4>Puran Poli</h4>
                <p>Traditional Maharashtrian sweet flatbread stuffed with jaggery and lentil filling - a classic dessert</p>
                <div className="price-section">
                  <span className="price">₹80 per piece</span>
                </div>
                {cart.puranPoli.quantity === 0 ? (
                  <button 
                    className="order-btn"
                    onClick={() => updateQuantity('puranPoli', 1)}
                  >
                    Order Puran Poli
                  </button>
                ) : (
                  <div className="quantity-section">
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity('puranPoli', -1)}
                      >
                        −
                      </button>
                      <span className="quantity">{cart.puranPoli.quantity}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity('puranPoli', 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      Total: ₹{cart.puranPoli.quantity * cart.puranPoli.price}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Cart Summary - Show when items in cart */}
      {getTotalItems() > 0 && (
        <div className="cart-summary">
          <div className="cart-info">
            <span className="cart-count">{getTotalItems()} item{getTotalItems() > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{getTotalPrice()}</span>
          </div>
          <button className="checkout-btn" onClick={() => setSelectedOption('cart')}>
            View Cart & Checkout
          </button>
        </div>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">⏰</div>
              <h4>Fresh Daily</h4>
              <p>Made fresh every morning with traditional methods</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🚚</div>
              <h4>Quick Delivery</h4>
              <p>Hot and fresh delivery within 45 minutes</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🌿</div>
              <h4>Natural Ingredients</h4>
              <p>Only premium, natural ingredients used</p>
            </div>
            <div className="feature">
              <div className="feature-icon">👨‍🍳</div>
              <h4>Traditional Recipes</h4>
              <p>Time-tested family recipes passed down generations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Nisargashree</h4>
              <p>Authentic traditional food made with love</p>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>📞 +91 9876543210</p>
              <p>📧 connect at :-nisargashree@gmail.com</p>
            </div>
            <div className="footer-section">
              <h4>Delivery Areas</h4>
              <p> Pune , Pimpri Chinchwad  </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2022 Nisargashree. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );

  const CartPage = () => (
    <div className="cart-page">
      <header className="product-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => setSelectedOption(null)}>
            ← Back to Home
          </button>
          <h2>Your Cart</h2>
        </div>
        {getTotalItems() > 0 && (
          <button className="clear-cart-btn" onClick={clearCart}>
            🗑️ Clear Cart
          </button>
        )}
      </header>
      
      <div className="container">
        {getTotalItems() === 0 ? (
          <div className="empty-cart">
            <h3>Your cart is empty</h3>
            <p>Add some delicious items to get started!</p>
            <button className="order-btn" onClick={() => setSelectedOption(null)}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.roti.quantity > 0 && (
                <div className="cart-item">
                  <img src="/images/roti.jpeg" alt="Roti" />
                  <div className="item-details">
                    <h4>Fresh Rotis & Breads</h4>
                    <p>₹{cart.roti.price} per piece</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity('roti', -1)}
                    >
                      −
                    </button>
                    <span className="quantity">{cart.roti.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity('roti', 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ₹{cart.roti.quantity * cart.roti.price}
                  </div>
                </div>
              )}
              
              {cart.puranPoli.quantity > 0 && (
                <div className="cart-item">
                  <img src="/images/puran-poli.jpeg" alt="Puran Poli" />
                  <div className="item-details">
                    <h4>Puran Poli</h4>
                    <p>₹{cart.puranPoli.price} per piece</p>
                  </div>
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity('puranPoli', -1)}
                    >
                      −
                    </button>
                    <span className="quantity">{cart.puranPoli.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity('puranPoli', 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ₹{cart.puranPoli.quantity * cart.puranPoli.price}
                  </div>
                </div>
              )}
            </div>
            
            <div className="cart-summary-section">
              <div className="summary-row">
                <span>Subtotal ({getTotalItems()} items)</span>
                <span>₹{getTotalPrice()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>₹30</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>₹{getTotalPrice() + 30}</span>
              </div>
              
              <button className="proceed-btn" onClick={() => setSelectedOption('orderType')}>
                Proceed to Checkout - ₹{getTotalPrice() + 30}
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
          <button className="back-btn" onClick={() => setSelectedOption('cart')}>
            ← Back to Cart
          </button>
          <h2>Choose Your Order Type</h2>
        </div>
      </header>
      
      <div className="container">
        <p className="order-subtitle">Please select your preferred order method before proceeding with payment.</p>
        
        <div className="order-type-grid">
          {/* Takeaway Option */}
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
                <li>• You can schedule your pickup time during checkout</li>
                <li>• The latest pickup time available is up to 3 hours from the time you place your order</li>
                <li>• Example: If you place an order at 10:00 AM, you can select any pickup time up to 1:00 PM</li>
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
                required
                disabled={orderType !== 'takeaway'}
              >
                <option value="">Select pickup time</option>
                {generateTimeSlots().map((time, index) => (
                  <option key={index} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Home Delivery Option */}
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
              <h4>Please fill in the following details:</h4>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={orderType === 'delivery' ? orderDetails.customerName : ''}
                  onChange={(e) => handleOrderDetailsChange('customerName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={orderType !== 'delivery'}
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={orderType === 'delivery' ? orderDetails.phoneNumber : ''}
                  onChange={(e) => handleOrderDetailsChange('phoneNumber', e.target.value)}
                  placeholder="Enter your mobile number"
                  required
                  disabled={orderType !== 'delivery'}
                />
              </div>

              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea
                  value={orderType === 'delivery' ? orderDetails.address : ''}
                  onChange={(e) => handleOrderDetailsChange('address', e.target.value)}
                  placeholder="Enter your complete delivery address"
                  rows="3"
                  required
                  disabled={orderType !== 'delivery'}
                />
              </div>

              <div className="form-group">
                <label>Additional Notes (Optional)</label>
                <textarea
                  value={orderType === 'delivery' ? orderDetails.additionalNotes : ''}
                  onChange={(e) => handleOrderDetailsChange('additionalNotes', e.target.value)}
                  placeholder="Any special instructions for delivery"
                  rows="2"
                  disabled={orderType !== 'delivery'}
                />
              </div>

              <div className="delivery-note">
                <h4>Important Information:</h4>
                <ul>
                  <li>• The product amount will be paid through the website/app during checkout</li>
                  <li>• Delivery charges are not included in the product price</li>
                  <li>• The customer is responsible for paying the delivery charges, which will depend on the delivery distance and destination</li>
                  <li>• By selecting Home Delivery, you agree to pay the applicable delivery fee upon delivery (or as instructed by the store)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {orderType && (
          <div className="order-summary-final">
            <div className="final-summary">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.roti.quantity > 0 && (
                  <div className="summary-item">
                    <span>Fresh Rotis & Breads × {cart.roti.quantity}</span>
                    <span>₹{cart.roti.quantity * cart.roti.price}</span>
                  </div>
                )}
                {cart.puranPoli.quantity > 0 && (
                  <div className="summary-item">
                    <span>Puran Poli × {cart.puranPoli.quantity}</span>
                    <span>₹{cart.puranPoli.quantity * cart.puranPoli.price}</span>
                  </div>
                )}
                <div className="summary-item subtotal">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                {orderType === 'takeaway' && (
                  <div className="summary-item">
                    <span>Delivery Fee</span>
                    <span>₹0 (Takeaway)</span>
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="summary-item">
                    <span>Delivery Fee</span>
                    <span>Pay on Delivery</span>
                  </div>
                )}
                <div className="summary-item total">
                  <span>Total to Pay Now</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
              </div>
              
              <button 
                className="final-checkout-btn"
                disabled={
                  (orderType === 'takeaway' && !orderDetails.takeawayTime) ||
                  (orderType === 'delivery' && (!orderDetails.customerName || !orderDetails.phoneNumber || !orderDetails.address))
                }
              >
                Proceed to Payment - ₹{getTotalPrice()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      {selectedOption === null && <LandingPage />}
      {selectedOption === 'cart' && <CartPage />}
      {selectedOption === 'orderType' && <OrderTypePage />}
    </div>
  );
}

export default App;