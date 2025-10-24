const mongoose = require('mongoose')

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sportify_equipment'
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB Connected (equipment):', uri.includes('@') ? 'mongodb-service' : uri)
  } catch (err) {
    console.error('MongoDB connection error (equipment):', err.message)
    throw err
  }
}
