const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// Ensure a user can only have one review per place
reviewSchema.index({ place: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
