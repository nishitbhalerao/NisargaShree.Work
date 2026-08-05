# Nisargashree - Food Ordering Website

A clean, single-page food ordering website built with React and Node.js, featuring Razorpay UPI payment integration.

## 🚀 Features

- **Single-page application** with clean, minimal design
- **Two order types**: Take Away and Home Delivery  
- **Smart cart system** with Zomato-style quantity steppers
- **Real payment integration** with Razorpay UPI
- **Mobile-responsive** design
- **Order management** with unique order IDs
- **MongoDB persistence** for products and orders

## 🛠 Tech Stack

**Frontend:**
- React 18 with Vite
- Single JSX file architecture (App.jsx)
- Pure CSS styling (App.css)
- Axios for API calls

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- Razorpay payment gateway
- RESTful API design

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Razorpay account for payment processing

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend and backend dependencies
npm run setup
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/nisargashree
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
PORT=5000
```

### 3. Frontend Environment (Optional)

Create `frontend/.env` file for custom Razorpay key:

```env
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### 4. Database Setup

Make sure MongoDB is running, then seed the database with initial products:

```bash
cd backend
npm run seed
```

This will create two sample products:
- Special Thali (₹150)
- Masala Dosa (₹120)

### 5. Run the Application

```bash
# Start both frontend and backend concurrently
npm run dev

# Or run individually:
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:5000
```

## 🏗 Project Structure

```
nisargashree-food-ordering/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.css          # All styles
│   │   └── main.jsx         # React entry point
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/
│   │   ├── Product.js       # Product schema
│   │   └── Order.js         # Order schema
│   ├── server.js            # Express server
│   ├── seed.js              # Database seeding
│   └── package.json
└── README.md
```

## 🔑 Razorpay Setup

1. **Sign up** for a Razorpay account at [razorpay.com](https://razorpay.com)
2. **Get test credentials** from your dashboard
3. **Update environment variables** with your keys
4. **Test payments** using Razorpay's test UPI IDs

### Test UPI IDs for Development:
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

## 📱 How It Works

### Order Flow:
1. **Browse products** on the landing page
2. **Add items** to cart using quantity steppers
3. **Choose order type**: Take Away or Home Delivery
4. **Fill details** (delivery address if needed)
5. **Pay via UPI** using Razorpay checkout
6. **Get confirmation** with unique order ID

### Take Away:
- Auto-calculates pickup time (current time + 3 hours)
- No address required
- Simple checkout flow

### Home Delivery:
- Customer details form (name, phone, address)
- Delivery instructions (optional)
- Delivery fee placeholder for future implementation

## 🚧 Future Enhancements

The codebase includes structured placeholders for:

- **Delivery fee calculation** (distance-based or flat rate)
- **Order status tracking** (preparing, ready, out for delivery)
- **Additional products** and categories
- **Customer authentication** and order history
- **Admin panel** for order management

## 🔧 API Endpoints

```
GET    /api/products              # Get all products
POST   /api/payment/create-order  # Create Razorpay order
POST   /api/payment/verify        # Verify payment & save order
GET    /api/orders/:orderId       # Get order details
GET    /api/health                # Health check
```

## 📱 Mobile Responsive

The application is fully responsive and optimized for mobile devices, which is essential for food ordering platforms.

## 🛡 Security Features

- **Payment signature verification** on backend
- **Input validation** for phone numbers and required fields
- **Environment variables** for sensitive data
- **CORS protection** enabled

## 📄 License

This project is created for demonstration purposes. Modify and use as needed for your requirements.

---

**Built with ❤️ for Nisargashree**