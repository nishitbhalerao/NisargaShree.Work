import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Restaurant from './models/Restaurant.js';

dotenv.config();

const enhancedProducts = [
  {
    name: "Special Thali",
    description: "Traditional Indian thali with dal, sabzi, rice, roti, pickle, and sweet. A complete wholesome meal with authentic flavors.",
    price: 150,
    originalPrice: 200,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "main-course",
    type: "veg",
    cuisine: ["South Indian", "North Indian"],
    rating: 4.5,
    reviews: 320,
    preparationTime: 25,
    spiceLevel: "medium",
    tags: ["popular", "complete-meal", "traditional"],
    available: true
  },
  {
    name: "Masala Dosa",
    description: "Crispy golden dosa filled with spiced potato curry, served with fresh coconut chutney and sambar. South Indian classic!",
    price: 120,
    originalPrice: 150,
    image: "https://images.unsplash.com/photo-1630851427749-f3a5d85be993?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "main-course",
    type: "veg",
    cuisine: ["South Indian"],
    rating: 4.7,
    reviews: 450,
    preparationTime: 15,
    spiceLevel: "mild",
    tags: ["south-indian", "crispy", "traditional"],
    available: true
  },
  {
    name: "Butter Chicken",
    description: "Tender chicken cooked in a rich, creamy tomato-based sauce with aromatic spices. A classic North Indian delicacy.",
    price: 280,
    originalPrice: 320,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300",
    category: "main-course",
    type: "non-veg",
    cuisine: ["North Indian"],
    rating: 4.6,
    reviews: 280,
    preparationTime: 30,
    spiceLevel: "medium",
    tags: ["creamy", "popular", "north-indian"],
    available: true
  },
  {
    name: "Paneer Tikka",
    description: "Marinated cottage cheese cubes grilled to perfection with bell peppers and onions. Served with mint chutney.",
    price: 220,
    image: "https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=300",
    category: "appetizer",
    type: "veg",
    cuisine: ["North Indian"],
    rating: 4.4,
    reviews: 190,
    preparationTime: 20,
    spiceLevel: "medium",
    tags: ["grilled", "starter", "vegetarian"],
    available: true
  },
  {
    name: "Chicken Biryani",
    description: "Fragrant basmati rice layered with marinated chicken and aromatic spices, slow-cooked to perfection.",
    price: 320,
    originalPrice: 380,
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300",
    category: "main-course",
    type: "non-veg",
    cuisine: ["North Indian"],
    rating: 4.8,
    reviews: 520,
    preparationTime: 45,
    spiceLevel: "spicy",
    tags: ["biryani", "aromatic", "premium"],
    available: true
  },
  {
    name: "Veg Hakka Noodles",
    description: "Stir-fried noodles with fresh vegetables and Indo-Chinese spices. A perfect fusion of flavors.",
    price: 180,
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=300",
    category: "main-course",
    type: "veg",
    cuisine: ["Chinese"],
    rating: 4.2,
    reviews: 150,
    preparationTime: 18,
    spiceLevel: "mild",
    tags: ["chinese", "stir-fried", "noodles"],
    available: true
  },
  {
    name: "Gulab Jamun",
    description: "Soft, spongy milk dumplings soaked in aromatic sugar syrup. A traditional Indian dessert.",
    price: 80,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300",
    category: "dessert",
    type: "veg",
    cuisine: ["North Indian"],
    rating: 4.3,
    reviews: 200,
    preparationTime: 10,
    spiceLevel: "mild",
    tags: ["sweet", "traditional", "dessert"],
    available: true
  },
  {
    name: "Fresh Lime Soda",
    description: "Refreshing lime drink with a perfect balance of sweet, sour, and tangy flavors.",
    price: 60,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300",
    category: "beverage",
    type: "veg",
    cuisine: ["Continental"],
    rating: 4.0,
    reviews: 80,
    preparationTime: 5,
    spiceLevel: "mild",
    tags: ["refreshing", "citrus", "cooling"],
    available: true
  }
];

async function seedEnhancedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert enhanced products
    const products = await Product.insertMany(enhancedProducts);
    console.log(`Seeded ${products.length} enhanced products:`);
    
    products.forEach(product => {
      console.log(`- ${product.name} (₹${product.price}) - ${product.type} - ${product.rating}⭐`);
    });

    console.log('\nEnhanced database seeded successfully!');
    console.log('New features added:');
    console.log('✅ Veg/Non-veg classification');
    console.log('✅ Ratings and reviews');
    console.log('✅ Cuisine types');
    console.log('✅ Preparation time');
    console.log('✅ Spice levels');
    console.log('✅ Original prices for discounts');
    console.log('✅ Tags for better filtering');
    
  } catch (error) {
    console.error('Error seeding enhanced database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedEnhancedData();