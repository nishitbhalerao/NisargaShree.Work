import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5001/api';

const STATUS_COLOR = {
  placed:           '#3498db',
  preparing:        '#f39c12',
  ready:            '#27ae60',
  out_for_delivery: '#8e44ad',
  delivered:        '#2ecc71',
  cancelled:        '#e74c3c',
};

const STATUS_LABEL = {
  placed:           'Placed',
  preparing:        'Preparing',
  ready:            'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

// Next possible statuses for each current status
const NEXT_ACTIONS = {
  placed:           [{ status: 'preparing',        label: '👨‍🍳 Start Preparing' }],
  preparing:        [{ status: 'ready',             label: '✅ Mark Ready' }],
  ready:            [{ status: 'out_for_delivery',  label: '🚚 Out for Delivery' },
                     { status: 'delivered',         label: '✔️ Mark Delivered' }],
  out_for_delivery: [{ status: 'delivered',         label: '✔️ Mark Delivered' }],
  delivered:        [],
  cancelled:        [],
};

function App() {
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminView, setAdminView] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const [ordersRes, subscriptionsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/subscriptions`)
      ]);
      setOrders(ordersRes.data);
      setSubscriptions(subscriptionsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders(prev =>
        prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o)
      );
    } catch (err) {
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
    setUpdatingId(subscriptionId);
    try {
      await axios.patch(`${API}/subscriptions/${subscriptionId}/status`, { status: newStatus });
      setSubscriptions(prev =>
        prev.map(s => s.subscriptionId === subscriptionId ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      alert('Failed to update subscription status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const markDelivery = async (subscriptionId, date, status = 'delivered') => {
    try {
      await axios.post(`${API}/subscriptions/${subscriptionId}/delivery`, { date, status });
      // Refresh data
      fetchOrders();
      alert(`Delivery marked as ${status} for ${new Date(date).toDateString()}`);
    } catch (err) {
      alert('Failed to mark delivery. Please try again.');
    }
  };

  // Computed stats
  const today = new Date().toDateString();
  const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const todaysRevenue = todaysOrders.reduce((s, o) => s + o.total, 0);
  const subscriptionRevenue = subscriptions.reduce((s, sub) => s + sub.totalAmount, 0);

  const getFilteredOrders = () => {
    let list = orders;
    if (orderFilter === 'today')     list = todaysOrders;
    else if (orderFilter === 'takeaway')  list = orders.filter(o => o.orderType === 'takeaway');
    else if (orderFilter === 'delivery')  list = orders.filter(o => o.orderType === 'delivery');
    else if (orderFilter === 'active')    list = orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus));

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(o =>
        o.orderId?.toLowerCase().includes(q) ||
        o.customerInfo?.name?.toLowerCase().includes(q) ||
        o.customerInfo?.phone?.includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const getFilteredSubscriptions = () => {
    let list = subscriptions;
    if (subscriptionFilter === 'active') list = subscriptions.filter(s => s.status === 'active');
    else if (subscriptionFilter === 'completed') list = subscriptions.filter(s => s.status === 'completed');
    else if (subscriptionFilter === 'paused') list = subscriptions.filter(s => s.status === 'paused');

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s =>
        s.subscriptionId?.toLowerCase().includes(q) ||
        s.customerInfo?.name?.toLowerCase().includes(q) ||
        s.customerInfo?.phone?.includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const formatTime = (dt) =>
    dt ? new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  /* ─── Dashboard view ─── */
  const Dashboard = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-content"><h3>{orders.length}</h3><p>Total Orders</p></div></div>
        <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-content"><h3>{todaysOrders.length}</h3><p>Today's Orders</p></div></div>
        <div className="stat-card"><div className="stat-icon">🔄</div><div className="stat-content"><h3>{activeSubscriptions.length}</h3><p>Active Subscriptions</p></div></div>
        <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-content"><h3>₹{totalRevenue + subscriptionRevenue}</h3><p>Total Revenue</p></div></div>
      </div>

      <div className="live-orders-section">
        <h3>Live Order Status</h3>
        <div className="status-grid">
          {['placed','preparing','ready','out_for_delivery','delivered'].map(s => (
            <div className="status-card" key={s}>
              <h4>{orders.filter(o => o.orderStatus === s).length}</h4>
              <p>{STATUS_LABEL[s]}</p>
              <div className="status-bar" style={{ background: STATUS_COLOR[s] }}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-orders-section">
        <h3>Recent Orders</h3>
        <div className="recent-orders-list">
          {orders.slice(0, 6).map(order => (
            <div key={order.orderId} className="recent-order-item">
              <div className="order-info">
                <div className="order-id">#{order.orderId}</div>
                <div className="customer-name">{order.customerInfo?.name || 'Takeaway'}</div>
                <div className="order-time">{formatTime(order.createdAt)}</div>
              </div>
              <div className="order-details">
                <div className="order-type">{order.orderType === 'delivery' ? '🚚 Delivery' : '🛍️ Takeaway'}</div>
                <div className="order-amount">₹{order.total}</div>
              </div>
              <div className="order-status-badge" style={{ backgroundColor: STATUS_COLOR[order.orderStatus] }}>
                {STATUS_LABEL[order.orderStatus] || order.orderStatus}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="no-data">No orders yet. Waiting for customers…</p>}
        </div>
      </div>
    </div>
  );

  /* ─── Orders Management view ─── */
  const OrderManagement = () => {
    const filtered = getFilteredOrders();
    return (
      <div className="order-management">
        <div className="controls-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, order ID, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-buttons">
            {[
              { key: 'all',      label: `All (${orders.length})` },
              { key: 'active',   label: `Active (${orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus)).length})` },
              { key: 'today',    label: `Today (${todaysOrders.length})` },
              { key: 'takeaway', label: `Takeaway (${orders.filter(o => o.orderType==='takeaway').length})` },
              { key: 'delivery', label: `Delivery (${orders.filter(o => o.orderType==='delivery').length})` },
            ].map(f => (
              <button key={f.key} className={`filter-btn ${orderFilter === f.key ? 'active' : ''}`} onClick={() => setOrderFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-list">
          {filtered.length === 0 && (
            <div className="no-orders"><h3>No orders found</h3><p>Try adjusting your filters.</p></div>
          )}

          {filtered.map(order => (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div className="order-main-info">
                  <h4>#{order.orderId}</h4>
                  <div className="status-badge" style={{ backgroundColor: STATUS_COLOR[order.orderStatus] }}>
                    {STATUS_LABEL[order.orderStatus] || order.orderStatus}
                  </div>
                </div>
                <div className="order-meta">
                  <span className="order-time">{formatTime(order.createdAt)}</span>
                  <span className="order-type-badge">{order.orderType === 'delivery' ? '🚚 Delivery' : '🛍️ Takeaway'}</span>
                </div>
              </div>

              <div className="order-body">
                <div className="customer-section">
                  <h5>Customer Details</h5>
                  <div className="customer-info">
                    <div><strong>Name:</strong> {order.customerInfo?.name || '—'}</div>
                    <div><strong>Phone:</strong> {order.customerInfo?.phone || '—'}</div>
                    {order.orderType === 'delivery' && order.customerInfo?.address && (
                      <div><strong>Address:</strong> {order.customerInfo.address}</div>
                    )}
                    {order.orderType === 'takeaway' && order.pickupTime && (
                      <div><strong>Pickup Time:</strong> {order.pickupTime}</div>
                    )}
                    {order.customerInfo?.deliveryInstructions && (
                      <div><strong>Notes:</strong> {order.customerInfo.deliveryInstructions}</div>
                    )}
                  </div>
                </div>

                <div className="items-section">
                  <h5>Order Items</h5>
                  <div className="items-list">
                    {order.items?.map((item, i) => (
                      <div key={i} className="item-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">×{item.quantity}</span>
                        <span className="item-price">₹{item.quantity * item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="payment-section">
                  <div className="payment-info">
                    <div className="total-amount"><strong>Total: ₹{order.total}</strong></div>
                  </div>
                </div>
              </div>

              {/* Admin action buttons */}
              {NEXT_ACTIONS[order.orderStatus]?.length > 0 && (
                <div className="admin-actions">
                  {NEXT_ACTIONS[order.orderStatus].map(action => (
                    <button
                      key={action.status}
                      className={`action-btn ${action.status === 'ready' ? 'ready-btn' : ''}`}
                      disabled={updatingId === order.orderId}
                      onClick={() => updateStatus(order.orderId, action.status)}
                    >
                      {updatingId === order.orderId ? 'Updating…' : action.label}
                    </button>
                  ))}
                  <button
                    className="action-btn cancel-btn"
                    disabled={updatingId === order.orderId}
                    onClick={() => { if (window.confirm('Cancel this order?')) updateStatus(order.orderId, 'cancelled'); }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Subscription Management view ─── */
  const SubscriptionManagement = () => {
    const filtered = getFilteredSubscriptions();
    return (
      <div className="subscription-management">
        <div className="controls-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, subscription ID, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-buttons">
            {[
              { key: 'all', label: `All (${subscriptions.length})` },
              { key: 'active', label: `Active (${subscriptions.filter(s => s.status === 'active').length})` },
              { key: 'completed', label: `Completed (${subscriptions.filter(s => s.status === 'completed').length})` },
              { key: 'paused', label: `Paused (${subscriptions.filter(s => s.status === 'paused').length})` },
            ].map(f => (
              <button key={f.key} className={`filter-btn ${subscriptionFilter === f.key ? 'active' : ''}`} onClick={() => setSubscriptionFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="subscriptions-list">
          {filtered.length === 0 && (
            <div className="no-orders"><h3>No subscriptions found</h3><p>No subscription plans yet.</p></div>
          )}

          {filtered.map(sub => (
            <div key={sub.subscriptionId} className="subscription-card">
              <div className="subscription-header">
                <div className="subscription-main-info">
                  <h4>#{sub.subscriptionId}</h4>
                  <div className="status-badge" style={{ backgroundColor: sub.status === 'active' ? '#27ae60' : sub.status === 'paused' ? '#f39c12' : '#6c757d' }}>
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </div>
                </div>
                <div className="subscription-meta">
                  <span className="subscription-time">{formatTime(sub.createdAt)}</span>
                  <span className="subscription-duration">{sub.totalDays} days</span>
                </div>
              </div>

              <div className="subscription-body">
                <div className="customer-section">
                  <h5>Customer Details</h5>
                  <div className="customer-info">
                    <div><strong>Name:</strong> {sub.customerInfo?.name}</div>
                    <div><strong>Phone:</strong> {sub.customerInfo?.phone}</div>
                    <div><strong>Address:</strong> {sub.customerInfo?.address}</div>
                    {sub.customerInfo?.deliveryInstructions && (
                      <div><strong>Instructions:</strong> {sub.customerInfo.deliveryInstructions}</div>
                    )}
                  </div>
                </div>

                <div className="subscription-details">
                  <h5>Subscription Details</h5>
                  <div className="subscription-info">
                    <div><strong>Item:</strong> {sub.item?.name} × {sub.item?.quantity} daily</div>
                    <div><strong>Per Day Cost:</strong> ₹{(sub.item?.price || 12) * (sub.item?.quantity || 1)}</div>
                    <div><strong>Total Amount:</strong> ₹{sub.totalAmount}</div>
                    <div><strong>Delivered:</strong> {sub.deliveredDates?.length || 0} / {sub.totalDays} days</div>
                  </div>
                </div>

                <div className="delivery-dates">
                  <h5>Delivery Schedule</h5>
                  <div className="dates-grid">
                    {sub.selectedDates?.slice(0, 10).map((date, i) => {
                      const dateObj = new Date(date);
                      const isDelivered = sub.deliveredDates?.some(d => new Date(d.date).toDateString() === dateObj.toDateString());
                      const isPast = dateObj < new Date();
                      return (
                        <div key={i} className={`date-item ${isDelivered ? 'delivered' : isPast ? 'missed' : 'pending'}`}>
                          <div className="date-day">{dateObj.getDate()}</div>
                          <div className="date-month">{dateObj.toLocaleDateString('en', { month: 'short' })}</div>
                          {sub.status === 'active' && !isDelivered && isPast && (
                            <button 
                              className="mark-delivered-btn"
                              onClick={() => markDelivery(sub.subscriptionId, date)}
                              title="Mark as delivered"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {sub.selectedDates?.length > 10 && (
                      <div className="more-dates">+{sub.selectedDates.length - 10} more</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Actions */}
              {sub.status === 'active' && (
                <div className="admin-actions">
                  <button
                    className="action-btn"
                    disabled={updatingId === sub.subscriptionId}
                    onClick={() => updateSubscriptionStatus(sub.subscriptionId, 'paused')}
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    className="action-btn"
                    disabled={updatingId === sub.subscriptionId}
                    onClick={() => updateSubscriptionStatus(sub.subscriptionId, 'completed')}
                  >
                    ✅ Complete
                  </button>
                  <button
                    className="action-btn cancel-btn"
                    disabled={updatingId === sub.subscriptionId}
                    onClick={() => { if (window.confirm('Cancel this subscription?')) updateSubscriptionStatus(sub.subscriptionId, 'cancelled'); }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
              {sub.status === 'paused' && (
                <div className="admin-actions">
                  <button
                    className="action-btn ready-btn"
                    disabled={updatingId === sub.subscriptionId}
                    onClick={() => updateSubscriptionStatus(sub.subscriptionId, 'active')}
                  >
                    ▶️ Resume
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
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
          <button className="refresh-btn" onClick={fetchOrders}>🔄 Refresh</button>
        </header>

        <div className="container">
          <div className="admin-nav">
            <button className={`admin-nav-btn ${adminView === 'dashboard' ? 'active' : ''}`} onClick={() => setAdminView('dashboard')}>
              📊 Dashboard
            </button>
            <button className={`admin-nav-btn ${adminView === 'orders' ? 'active' : ''}`} onClick={() => setAdminView('orders')}>
              📋 Orders {orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus)).length > 0 && (
                <span className="badge">{orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus)).length}</span>
              )}
            </button>
            <button className={`admin-nav-btn ${adminView === 'subscriptions' ? 'active' : ''}`} onClick={() => setAdminView('subscriptions')}>
              🔄 Subscriptions {activeSubscriptions.length > 0 && (
                <span className="badge">{activeSubscriptions.length}</span>
              )}
            </button>
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}
          {loading ? (
            <div className="loading">Loading data…</div>
          ) : (
            <>
              {adminView === 'dashboard' && <Dashboard />}
              {adminView === 'orders'    && <OrderManagement />}
              {adminView === 'subscriptions' && <SubscriptionManagement />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
