const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpg, jpeg, png, webp)!'));
    }
  }
});

// GET profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and is already taken
    const emailLower = email.toLowerCase();
    if (emailLower !== user.email) {
      const emailExists = await User.findOne({ email: emailLower });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already taken by another account' });
      }
      user.email = emailLower;
    }

    user.name = name;
    user.mobile = mobile || '';
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT change password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST upload avatar
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar file if it exists locally
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../public', user.avatar);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error('Failed to delete old avatar:', e); }
      }
    }

    const relativePath = `/uploads/${req.file.filename}`;
    user.avatar = relativePath;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: relativePath
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET user-specific data
router.get('/data', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      wishlist: user.wishlist,
      savedTrips: user.savedTrips,
      itineraries: user.itineraries,
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST toggle wishlist
router.post('/wishlist', verifyToken, async (req, res) => {
  try {
    const { place } = req.body;
    if (!place || !place._id) {
      return res.status(400).json({ message: 'Invalid place data' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.findIndex(item => item._id.toString() === place._id.toString());
    let added = false;
    
    if (index !== -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(place);
      added = true;
    }

    await user.save();
    res.json({ 
      wishlist: user.wishlist, 
      message: added ? 'Added to Wishlist' : 'Removed from Wishlist' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST save trip
router.post('/trips', verifyToken, async (req, res) => {
  try {
    const { trip } = req.body;
    if (!trip || !trip.id) {
      return res.status(400).json({ message: 'Invalid trip data' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if it already exists to avoid duplication
    const index = user.savedTrips.findIndex(t => t.id === trip.id);
    if (index !== -1) {
      user.savedTrips[index] = trip;
    } else {
      user.savedTrips.unshift(trip);
    }

    await user.save();
    res.json({ savedTrips: user.savedTrips, message: 'Trip saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update trip
router.put('/trips/:id', verifyToken, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id) || req.params.id;
    const { trip } = req.body;
    if (!trip) {
      return res.status(400).json({ message: 'Trip data is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.savedTrips.findIndex(t => t.id === tripId);
    if (index === -1) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    user.savedTrips[index] = { ...user.savedTrips[index], ...trip };
    user.markModified('savedTrips');
    await user.save();

    res.json({ savedTrips: user.savedTrips, message: 'Trip updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE trip
router.delete('/trips/:id', verifyToken, async (req, res) => {
  try {
    const tripId = parseInt(req.params.id) || req.params.id;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.savedTrips = user.savedTrips.filter(t => t.id !== tripId);
    await user.save();

    res.json({ savedTrips: user.savedTrips, message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST save itinerary
router.post('/itineraries', verifyToken, async (req, res) => {
  try {
    const { itinerary } = req.body;
    if (!itinerary || !itinerary.id) {
      return res.status(400).json({ message: 'Invalid itinerary data' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.itineraries.findIndex(i => i.id === itinerary.id);
    if (index !== -1) {
      user.itineraries[index] = itinerary;
    } else {
      user.itineraries.unshift(itinerary);
    }

    await user.save();
    res.json({ itineraries: user.itineraries, message: 'Itinerary saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ message: 'Preferences data is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences = {
      travel: preferences.travel || [],
      budget: preferences.budget || 'Medium'
    };
    await user.save();

    res.json({ preferences: user.preferences, message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
