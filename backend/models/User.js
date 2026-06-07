const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobile: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  wishlist: { type: Array, default: [] },
  savedTrips: { type: Array, default: [] },
  itineraries: { type: Array, default: [] },
  preferences: {
    travel: { type: [String], default: [] },
    budget: { type: String, default: 'Medium' }
  },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
