import React, { useState } from 'react';
import './App.css';

function App() {
  // Admin state management
  const [adminView, setAdminView] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock orders data for admin panel
  const [orders] = useState([
    {
      id: 'ORD001',
      customerName: 'Amit Sharma',
      phoneNumber: '+91 9876543210',
      items: [
        { name: 'Fresh Rotis', quantity: 3, price: 40 },
        { name: 'Puran Poli', quantity: 2, price: 80 }
      ],
      totalAmount: 280,
      orderType: 'delivery',
      address: '123 MG Road, Pune, Maharashtra 411001',
      orderTime: '2026-08-07 10:30 AM',
      status: 'preparing',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD002',
      customerName: 'Priya Patel',
      phoneNumber: '+91 9876543211',
      items: [
        { name: 'Puran Poli', quantity: 4, price: 80 }
      ],
      totalAmount: 320,
      orderType: 'takeaway',
      pickupTime: '12:00 PM',
      orderTime: '2026-08-07 11:15 AM',
      status: 'ready',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD003',
      customerName: 'Rajesh Kumar',
      phoneNumber: '+91 9876543212',
      items: [
        { name: 'Fresh Rotis', quantity: 5, price: 40 }
      ],
      totalAmount: 200,
      orderType: 'delivery',
      address: '456 FC Road, Pune, Maharashtra 411005',
      orderTime: '2026-08-07 09:45 AM',
      status: 'delivered',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD004',
      customerName: 'Sunita Desai',
      phoneNumber: '+91 9876543213',
      items: [
        { name: 'Fresh Rotis', quantity: 2, price: 40 },
        { name: 'Puran Poli', quantity: 3, price: 80 }
      ],
      totalAmount: 320,
      orderType: 'takeaway',
      pickupTime: '2:30 PM',
      orderTime: '2026-08-07 12:45 PM',
      status: 'confirmed',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD005',
      customerName: 'Vikram Singh',
      phoneNumber: '+91 9876543214',
      items: [
        { name: 'Puran Poli', quantity: 6, price: 80 }
      ],
      totalAmount: 480,
      orderType: 'delivery',
      address: '789 Koregaon Park, Pune, Maharashtra 411001',
      orderTime: '2026-08-06 07:20 PM',
      status: 'delivered',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD006',
      customerName: 'Neha Kulkarni',
      phoneNumber: '+91 9876543215',
      items: [
        { name: 'Fresh Rotis', quantity: 4, price: 40 },
        { name: 'Puran Poli', quantity: 1, price: 80 }
      ],
      totalAmount: 240,
      orderType: 'delivery',
      address: '321 Shivaji Nagar, Pune, Maharashtra 411005',
      orderTime: '2026-08-07 01:15 PM',
      status: 'confirmed',
      paymentMethod: 'Online'
    },
    {
      id: 'ORD007',
      customerName: 'Ravi Joshi',
      phoneNumber: '+91 9876543216',
      items: [
        { name: 'Puran Poli', quantity: 8, price: 80 }
      ],
      totalAmount: 640,
      orderType: 'takeaway',
      pickupTime: '4:00 PM',
      orderTime: '2026-08-07 02:30 PM',
      status: 'preparing',
      paymentMethod: 'Online'
    }
  ]);

  // Admin utility functions
  const getTodaysOrders = () => {
    return orders.filter(order => order.orderTime.includes('2026-08-07'));
  };

  const getTotalRevenue = () => {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  };

  const getTodaysRevenue = () => {
    return getTodaysOrders().reduce((total, order) => total + order.totalAmount, 0);
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply type filter
    if (orderFilter === 'today') {
      filtered = getTodaysOrders();
    } else if (orderFilter === 'takeaway') {
      filtered = orders.filter(order => order.orderType === 'takeaway');
    } else if (orderFilter === 'delivery') {
      filtered = orders.filter(order => order.orderType === 'delivery');
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phoneNumber.includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#3498db';
      case 'preparing': return '#f39c12';
      case 'ready': return '#27ae60';
      case 'delivered': return '#2ecc71';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const AdminDashboard = () => (
    <div className="admin-dashboard">
      <header className="product-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-text">
              <h1>NisargaShreE Admin Panel</h1>
              <p>Order Management System</p>
            </div>
          </div>
        </div>
        <button 
          className="refresh-btn"
          onClick={() => window.location.reload()}
        >
          🔄 Refresh
        </button>
      </header>
      
      <div className="container">
        {/* Dashboard Navigation */}
        <div className="admin-nav">
          <button 
            className={`admin-nav-btn ${adminView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setAdminView('dashboard')}
          >
            📊 Dashboard Overview
          </button>
          <button 
            className={`admin-nav-btn ${adminView === 'orders' ? 'active' : ''}`}
            onClick={() => setAdminView('orders')}
          >
            📋 Order Management
          </button>
        </div>

        {adminView === 'dashboard' && (
          <div className="dashboard-overview">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>{orders.length}</h3>
                  <p>Total Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>{getTodaysOrders().length}</h3>
                  <p>Today's Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>₹{getTotalRevenue()}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>₹{getTodaysRevenue()}</h3>
                  <p>Today's Revenue</p>
                </div>
              </div>
            </div>

            {/* Live Order Status */}
            <div className="live-orders-section">
              <h3>Live Order Status</h3>
              <div className="status-grid">
                <div className="status-card">
                  <h4>{orders.filter(o => o.status === 'confirmed').length}</h4>
                  <p>Confirmed</p>
                  <div className="status-bar confirmed"></div>
                </div>
                <div className="status-card">
                  <h4>{orders.filter(o => o.status === 'preparing').length}</h4>
                  <p>Preparing</p>
                  <div className="status-bar preparing"></div>
                </div>
                <div className="status-card">
                  <h4>{orders.filter(o => o.status === 'ready').length}</h4>
                  <p>Ready</p>
                  <div className="status-bar ready"></div>
                </div>
                <div className="status-card">
                  <h4>{orders.filter(o => o.status === 'delivered').length}</h4>
                  <p>Delivered</p>
                  <div className="status-bar delivered"></div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-orders-section">
              <h3>Recent Orders</h3>
              <div className="recent-orders-list">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="recent-order-item">
                    <div className="order-info">
                      <div className="order-id">#{order.id}</div>
                      <div className="customer-name">{order.customerName}</div>
                      <div className="order-time">{order.orderTime}</div>
                    </div>
                    <div className="order-details">
                      <div className="order-type">
                        {order.orderType === 'delivery' ? '🚚 Delivery' : '🛍️ Takeaway'}
                      </div>
                      <div className="order-amount">₹{order.totalAmount}</div>
                    </div>
                    <div 
                      className="order-status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminView === 'orders' && (
          <div className="order-management">
            {/* Search and Filter Controls */}
            <div className="controls-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by customer name, order ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${orderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('all')}
                >
                  All Orders ({orders.length})
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'today' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('today')}
                >
                  Today's Orders ({getTodaysOrders().length})
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'takeaway' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('takeaway')}
                >
                  Takeaway ({orders.filter(o => o.orderType === 'takeaway').length})
                </button>
                <button 
                  className={`filter-btn ${orderFilter === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderFilter('delivery')}
                >
                  Home Delivery ({orders.filter(o => o.orderType === 'delivery').length})
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="orders-list">
              {getFilteredOrders().map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-main-info">
                      <h4>#{order.id}</h4>
                      <div 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                    </div>
                    <div className="order-meta">
                      <span className="order-time">{order.orderTime}</span>
                      <span className="order-type-badge">
                        {order.orderType === 'delivery' ? '🚚 Delivery' : '🛍️ Takeaway'}
                      </span>
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="customer-section">
                      <h5>Customer Details</h5>
                      <div className="customer-info">
                        <div><strong>Name:</strong> {order.customerName}</div>
                        <div><strong>Phone:</strong> {order.phoneNumber}</div>
                        {order.orderType === 'delivery' && (
                          <div><strong>Address:</strong> {order.address}</div>
                        )}
                        {order.orderType === 'takeaway' && order.pickupTime && (
                          <div><strong>Pickup Time:</strong> {order.pickupTime}</div>
                        )}
                      </div>
                    </div>

                    <div className="items-section">
                      <h5>Order Items</h5>
                      <div className="items-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="item-row">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                            <span className="item-price">₹{item.quantity * item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="payment-section">
                      <div className="payment-info">
                        <div><strong>Payment Method:</strong> {order.paymentMethod}</div>
                        <div className="total-amount"><strong>Total Amount: ₹{order.totalAmount}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getFilteredOrders().length === 0 && (
                <div className="no-orders">
                  <h3>No orders found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      <AdminDashboard />
    </div>
  );
}

export default App;