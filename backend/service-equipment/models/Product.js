const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  images: { type: [String], default: [] },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
})

module.exports = mongoose.model('Product', ProductSchema)
