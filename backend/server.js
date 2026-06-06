require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes imports
const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/states');
const cityRoutes = require('./routes/cities');
const categoryRoutes = require('./routes/categories');
const placeRoutes = require('./routes/places');
const bulkImportRoutes = require('./routes/bulkImport');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
app.use('/api/states', stateRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/places/bulk-import', bulkImportRoutes);
app.use('/api/places', placeRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('TravelBharat API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
