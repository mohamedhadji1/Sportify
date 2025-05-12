const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() { return this.role !== 'Manager'; },
    minlength: 6,
    select: false // Do not return password by default
  },
  role: {
    type: String,
    enum: ['Player', 'Manager', 'Admin'],
    default: 'Player'
  },
  fullName: {
    type: String,
    required: false // Optional, can be made required based on role or signup form
  },
  // Manager specific fields (conditionally required based on role)
  cin: {
    type: String,
    required: function() { return this.role === 'Manager'; }
  },
  phoneNumber: {
    type: String,
    required: function() { return this.role === 'Manager' || this.role === 'Player'; }
  },
  attachment: {
    type: String, // Store path or URL to the attachment
    required: function() { return this.role === 'Manager'; }
  },
  // Player specific fields (conditionally required based on role)
  preferredSport: {
    type: String,
    required: function() { return this.role === 'Player'; }
  },
  position: {
    type: String, // e.g., for football
    required: function() { return this.role === 'Player' && this.preferredSport === 'football'; } 
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d' // Default to 30 days
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);