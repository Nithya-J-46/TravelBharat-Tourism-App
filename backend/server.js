require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const stateRoutes = require('./routes/states');
const cityRoutes = require('./routes/cities');
const categoryRoutes = require('./routes/categories');
const placeRoutes = require('./routes/places');
const bulkImportRoutes = require('./routes/bulkImport');

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configure CORS for production and local environments
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
};
app.use(cors(corsOptions));

// Set payload limits high enough for bulk imports
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes Configuration
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/places/bulk-import', bulkImportRoutes);
app.use('/api/places', placeRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('TravelBharat API is running...');
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
