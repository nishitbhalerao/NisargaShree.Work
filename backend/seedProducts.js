import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const products = [
  {
    name: 'Poli (Fresh Roti)',
    description: 'Fresh, homemade traditional Maharashtrian Poli (roti) made with quality ingredients',
    price: 12,
    originalPrice: null,
    image: '/images/roti.jpeg',
    category: 'main-course',
    type: 'veg',
    cuisine: ['North Indian'],
    rating: 4.5,
    reviews: 150,
    preparationTime: 15,
    spiceLevel: 'mild',
    available: true,
    featured: true,
    tags: ['homemade', 'traditional', 'fresh']
  },
  {
    name: 'Puran Poli',
    description: 'Traditional Maharashtrian sweet flatbread stuffed with jaggery and lentil filling',
    price: 40,
    originalPrice: null,
    image: '/images/puran-poli.jpeg',
    category: 'dessert',
    type: 'veg',
    cuisine: ['North Indian'],
    rating: 4.7,
    reviews: 200,
    preparationTime: 25,
    spiceLevel: 'mild',
    available: true,
    featured: true,
    tags: ['sweet', 'traditional', 'festival-special']
  },
  {
    name: 'Sahi Puran Poli',
    description: 'Premium quality Puran Poli with rich ghee and authentic Konkan-style preparation',
    price: 60,
    originalPrice: null,
    image: '/images/puran-poli.jpeg',
    category: 'dessert',
    type: 'veg',
    cuisine: ['North Indian'],
    rating: 4.8,
    reviews: 120,
    preparationTime: 30,
    spiceLevel: 'mild',
    available: true,
    featured: true,
    tags: ['premium', 'ghee-special', 'authentic']
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Inserted ${insertedProducts.length} products`);
    
    insertedProducts.forEach(product => {
      console.log(`- ${product.name}: ₹${product.price}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();