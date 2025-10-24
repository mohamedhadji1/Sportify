const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  provider: { type: String, default: 'mock' },
  providerChargeId: { type: String },
  status: { type: String, enum: ['PENDING','PAID','CANCELLED','REFUNDED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
