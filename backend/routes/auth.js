const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { sendWelcomeEmail, sendLoginAlertEmail, sendPasswordResetEmail } = require('../services/emailService');

// Rate limiter for authentication routes: max 15 requests per 15 minutes
const authLimiter = rateLimiter(15, 15 * 60 * 1000);

// POST Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const emailLower = email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      name,
      email: emailLower,
      password: hashedPassword,
      mobile: mobile || '',
      role: 'user',
      wishlist: [],
      savedTrips: [],
      itineraries: [],
      preferences: {
        travel: [],
        budget: 'Medium'
      }
    });

    await newUser.save();

    // Send welcome email asynchronously
    sendWelcomeEmail(newUser.email, newUser.name).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'email') {
        return res.status(400).json({ message: 'Email already registered' });
      }
      return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already taken` });
    }
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// POST Login (Handles Email and legacy Username)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    let user;
    // Check if identifier is email or admin username
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else if (identifier === 'admin') {
      user = await User.findOne({ email: 'admin@travelbharat.com' });
    } else {
      user = await User.findOne({ email: identifier.toLowerCase() });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    // Send login notification email asynchronously
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    sendLoginAlertEmail(user.email, user.name || 'Administrator', userAgent, ipAddress).catch(err => {
      console.error('Failed to send login notification email:', err);
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name || 'Administrator',
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST Forgot Password (OTP Generation)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiry
    await user.save();

    // Send password reset email asynchronously
    sendPasswordResetEmail(user.email, user.name || 'User', otp).catch(err => {
      console.error('Failed to send password reset email:', err);
    });

    console.log(`\n========================================\n[PASSWORD RESET OTP] \nUser: ${email}\nOTP: ${otp}\n========================================\n`);

    // In local development, we return the OTP in the response for convenience
    res.json({ 
      message: 'A verification OTP has been sent (see console/API response for the code).',
      otp: otp // Included for testing and seamless workflow
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      otp: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP verification code' });
    }

    // OTP verified, generate temp reset token
    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.type !== 'reset') {
        return res.status(400).json({ message: 'Invalid reset token type' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Expired or invalid password reset link' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET Verify Token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      verified: true,
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

module.exports = router;
