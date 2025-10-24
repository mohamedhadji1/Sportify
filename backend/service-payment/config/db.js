const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://mongodb-service:27017/sportify_payments';
    const conn = await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected (payments): ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error (payments):', err.message || err);
    process.exit(1);
  }
};

module.exports = connectDB;
