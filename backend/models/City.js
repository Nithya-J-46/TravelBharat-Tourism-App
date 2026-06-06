const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, lowercase: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  description: { type: String }
}, { timestamps: true });

// Ensure unique city name and slug per state
citySchema.index({ name: 1, state: 1 }, { unique: true });
citySchema.index({ slug: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
