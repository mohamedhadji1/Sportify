// This script can be run to create test products for the marketplace
// It bypasses the normal approval flow to create pre-approved products

const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportify')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Sample products
const sampleProducts = [
  {
    title: 'Tennis Racket - Professional',
    description: 'High-quality tennis racket for professional players. Excellent condition with minimal use.',
    price: 129.99,
    currency: 'USD',
    category: 'Tennis',
    images: ['/uploads/tennis-racket-1.jpg'],
    status: 'APPROVED',
    approvedAt: new Date()
  },
  {
    title: 'Basketball - Official Size',
    description: 'Official size basketball, perfect for indoor or outdoor play. Good grip and bounce.',
    price: 49.99,
    currency: 'USD',
    category: 'Basketball',
    images: ['/uploads/basketball-1.jpg'],
    status: 'APPROVED',
    approvedAt: new Date()
  },
  {
    title: 'Soccer Ball - World Cup Edition',
    description: 'Limited edition soccer ball from the World Cup. Collector\'s item in excellent condition.',
    price: 89.99,
    currency: 'USD',
    category: 'Football',
    images: ['/uploads/soccer-ball-1.jpg'],
    status: 'APPROVED',
    approvedAt: new Date()
  },
  {
    title: 'Fitness Dumbbells Set (10kg)',
    description: 'Set of two 10kg dumbbells. Perfect for home workouts and strength training.',
    price: 69.99,
    currency: 'USD',
    category: 'Fitness',
    images: ['/uploads/dumbbells-1.jpg'],
    status: 'APPROVED',
    approvedAt: new Date()
  }
];

// Create an admin user ID (this would normally be a valid MongoDB ObjectID)
const adminId = mongoose.Types.ObjectId();

// Function to create products
const createProducts = async () => {
  try {
    // Delete any existing products (optional)
    await Product.deleteMany({});
    
    // Create products with seller ID
    for (const product of sampleProducts) {
      const sellerId = mongoose.Types.ObjectId(); // Each product gets a different seller
      const newProduct = new Product({
        ...product,
        sellerId,
        approvedBy: adminId
      });
      await newProduct.save();
      console.log(`Created product: ${product.title}`);
    }
    
    console.log('Sample products created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating products:', err);
    process.exit(1);
  }
};

// Run the function
createProducts();