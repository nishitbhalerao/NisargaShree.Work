# NisargaShreE Food Ordering System

## Overview
A complete food ordering system with separate customer and admin applications built with React and Node.js.

## Architecture
- **Customer Frontend**: React application on `http://localhost:5174/`
- **Admin Panel**: Separate React application on `http://localhost:5175/`
- **Backend**: Node.js/Express server (can be run separately)

## Applications

### 🍽️ Customer Frontend (Port 5174)
**URL**: `http://localhost:5174/`

**Features**:
- Browse Roti (₹40) and Puran Poli (₹80) items
- Shopping cart with real-time calculations
- Order type selection (Takeaway/Home Delivery)
- Takeaway: 3-hour pickup window with time slots
- Home Delivery: Customer details form
- Mobile-responsive Zomato-inspired design

**To Run**:
```bash
cd frontend
npm run dev
```

### 👨‍💼 Admin Panel (Port 5175)
**URL**: `http://localhost:5175/`

**Features**:
- **📊 Dashboard Overview**:
  - Total Orders: {total_count}
  - Today's Orders: {today_count}
  - Total Revenue: ₹{total_revenue}
  - Today's Revenue: ₹{today_revenue}

- **📈 Live Order Status**:
  - Confirmed (Blue)
  - Preparing (Orange) 
  - Ready (Green)
  - Delivered (Dark Green)

- **📋 Order Management**:
  - Search by customer name, order ID, or phone
  - Filter: All Orders, Today's Orders, Takeaway, Home Delivery
  - Complete order details with customer info
  - Order items breakdown with pricing
  - Payment method and total amount
  - Real-time order status tracking

**To Run**:
```bash
cd admin
npm run dev
```

## Sample Data
The admin panel includes 7 sample orders demonstrating:
- Different order types (takeaway vs delivery)
- Various order statuses (confirmed, preparing, ready, delivered)
- Customer information and contact details
- Product combinations and quantities
- Revenue calculations

## Order Information Displayed
### Customer Details
- Full Name
- Phone Number
- Delivery Address (for delivery orders)
- Pickup Time (for takeaway orders)

### Order Details
- Order ID (e.g., #ORD001)
- Order Items with quantities and individual prices
- Order Type: 🚚 Delivery or 🛍️ Takeaway
- Payment Method
- Order Time/Date
- Order Status with color coding
- Total Amount

## Design Features
- **Consistent Styling**: Both applications use the same design language
- **Color Scheme**: Red (#e74c3c) and dark gray (#2c3e50) theme
- **Mobile Responsive**: Adapts to all screen sizes
- **Clean Interface**: Minimalist, professional layout
- **Card-based Design**: Information organized in scannable cards

## Development Commands

### Frontend (Customer App)
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server (port 5174)
npm run build       # Build for production
```

### Admin Panel
```bash
cd admin
npm install          # Install dependencies
npm run dev         # Start development server (port 5175)
npm run build       # Build for production
```

### Backend (Optional)
```bash
cd backend
npm install          # Install dependencies
npm start           # Start Node.js server
node seed.js        # Populate sample data
```

## Project Structure
```
NisargaShreE/
├── frontend/           # Customer-facing React app (Port 5174)
│   ├── src/
│   │   ├── App.jsx    # Main customer application
│   │   ├── App.css    # Customer app styles
│   │   └── main.jsx   # Entry point
│   ├── public/
│   │   └── images/    # Product and brand images
│   └── package.json
├── admin/             # Admin panel React app (Port 5175)
│   ├── src/
│   │   ├── App.jsx    # Admin dashboard application
│   │   ├── App.css    # Admin panel styles
│   │   └── main.jsx   # Entry point
│   └── package.json
├── backend/           # Node.js/Express API
│   ├── server.js      # Main server file
│   ├── models/        # Database models
│   └── package.json
└── README.md
```

## URLs
- **Customer App**: http://localhost:5174/
- **Admin Panel**: http://localhost:5175/
- **Backend API**: http://localhost:3000/ (when running)

## Future Enhancements
- Real backend API integration
- Order status update functionality
- Customer communication features
- Advanced analytics and reporting
- Export capabilities
- Push notification system
- Payment gateway integration