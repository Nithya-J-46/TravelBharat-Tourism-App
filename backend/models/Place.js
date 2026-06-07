const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  
  // Real destination data extensions
  history: { type: String }, 
  culturalImportance: { type: String },
  whyVisit: { type: String },
  famousFor: [{ type: String }],
  travelTips: [{ type: String }],
  photographyTips: [{ type: String }],
  safetyTips: [{ type: String }],
  accessibilityInfo: { type: String },
  
  // How to Reach
  howToReach: {
    byAir: { nearest: String, distance: String },
    byTrain: { nearest: String, distance: String },
    byBus: { nearest: String, distance: String },
    byRoad: { routeSuggestions: String }
  },

  // Cost information
  entryFees: {
    adult: { type: Number, default: 0 },
    child: { type: Number, default: 0 },
    foreigner: { type: Number, default: 0 },
    student: { type: Number, default: 0 }
  },
  additionalCharges: [{
    name: String,
    amount: Number
  }],

  // Local recommendations
  hotels: [{
    name: String,
    category: { type: String, enum: ['Budget', 'Mid-range', 'Luxury'] },
    distance: String,
    priceRange: String,
    rating: Number
  }],
  foodSpots: [{
    restaurantName: String,
    specialty: String,
    popularDishes: [{ type: String }],
    costForTwo: String
  }],

  // Seasonal weather
  weather: {
    summer: { tempRange: String, crowdLevel: String },
    winter: { tempRange: String, crowdLevel: String },
    monsoon: { tempRange: String, crowdLevel: String }
  },
  suggestedDuration: { type: String }, // e.g. "Half Day", "1 Day", "Weekend Trip"
  bestTimeToVisit: { type: String, default: 'October to March' },
  timings: { type: String, default: '9:00 AM - 6:00 PM' },

  // Ratings system
  ratingScores: {
    popularity: { type: Number, default: 4.0 },
    familyFriendly: { type: Number, default: 4.0 },
    adventure: { type: Number, default: 3.5 },
    photography: { type: Number, default: 4.0 },
    budgetFriendly: { type: Number, default: 3.5 },
    accessibility: { type: Number, default: 3.0 }
  },

  // FAQs Accordion
  faqs: [{
    question: String,
    answer: String
  }],

  coordinates: {
    latitude: { type: Number, default: 20.5937 }, // Default center of India
    longitude: { type: Number, default: 78.9629 }
  },
  location: { type: String }, // Google Maps embed iframe or link
  images: [{ type: String }],
  nearbyAttractions: [{ type: String }],
  viewsCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  isHiddenGem: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isWeekendGetaway: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

placeSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Place', placeSchema);
