import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const seedProducts = [
  {
    name: "Special Thali",
    description: "Traditional Indian thali with dal, sabzi, rice, roti, pickle, and sweet. A complete wholesome meal with authentic flavors.",
    price: 150,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "thali",
    available: true
  },
  {
    name: "Masala Dosa",
    description: "Crispy golden dosa filled with spiced potato curry, served with fresh coconut chutney and sambar. South Indian classic!",
    price: 120,
    image: "https://images.unsplash.com/photo-1630851427749-f3a5d85be993?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "dosa",
    available: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert seed products
    const products = await Product.insertMany(seedProducts);
    console.log(`Seeded ${products.length} products:`);
    
    products.forEach(product => {
      console.log(`- ${product.name} (₹${product.price})`);
    });

    console.log('\nDatabase seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedDatabase();