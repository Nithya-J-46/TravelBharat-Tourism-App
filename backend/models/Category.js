const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  icon: { type: String, default: 'Compass' } // Lucide icon name
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
