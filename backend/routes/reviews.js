const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Helper function to recalculate and cache place ratings
async function recalculatePlaceRatings(placeId) {
  try {
    const reviews = await Review.find({ place: placeId });
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

    await Place.findByIdAndUpdate(placeId, {
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount
    });
  } catch (error) {
    console.error('Error recalculating place ratings:', error);
  }
}

// GET all reviews for a place
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const reviews = await Review.find({ place: placeId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new review (or update existing one)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { place: placeId, rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!placeId || !rating || !reviewText) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Fetch user details for caching
    const userObj = await User.findById(userId);
    if (!userObj) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if place exists
    const placeObj = await Place.findById(placeId);
    if (!placeObj) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    // Check if review already exists for this place by this user
    let review = await Review.findOne({ place: placeId, user: userId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.reviewText = reviewText;
      review.userName = userObj.name;
      review.userAvatar = userObj.avatar || '';
      await review.save();
    } else {
      // Create new review
      review = new Review({
        place: placeId,
        user: userId,
        userName: userObj.name,
        userAvatar: userObj.avatar || '',
        rating,
        reviewText
      });
      await review.save();
    }

    // Recalculate Place rating metrics
    await recalculatePlaceRatings(placeId);

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a review
router.delete('/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership or admin role
    if (review.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const placeId = review.place;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate metrics
    await recalculatePlaceRatings(placeId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
