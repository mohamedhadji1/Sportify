// This script checks the status of products in the database
// Run with: node check-products.js

const mongoose = require('mongoose');
const Product = require('../models/Product');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportify')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Function to check products
const checkProducts = async () => {
  try {
    // Check all products
    const products = await Product.find({});
    
    console.log(`Total products in database: ${products.length}`);
    
    // Count by status
    const pendingCount = products.filter(p => p.status === 'PENDING').length;
    const approvedCount = products.filter(p => p.status === 'APPROVED').length;
    const rejectedCount = products.filter(p => p.status === 'REJECTED').length;
    
    console.log(`Status counts:`);
    console.log(`- PENDING: ${pendingCount}`);
    console.log(`- APPROVED: ${approvedCount}`);
    console.log(`- REJECTED: ${rejectedCount}`);
    
    // Show approved products details
    if (approvedCount > 0) {
      console.log('\nApproved Products:');
      products
        .filter(p => p.status === 'APPROVED')
        .forEach(p => {
          console.log(`- ${p.title} ($${p.price} ${p.currency})`);
          console.log(`  Images: ${p.images.length > 0 ? p.images.join(', ') : 'None'}`);
          console.log(`  ID: ${p._id}`);
          console.log(`  Seller ID: ${p.sellerId}`);
          console.log('');
        });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking products:', err);
    process.exit(1);
  }
};

// Run the function
checkProducts();