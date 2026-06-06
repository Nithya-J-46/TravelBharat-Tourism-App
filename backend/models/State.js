const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  capital: { type: String, required: true },
  description: { type: String, required: true },
  bannerImage: { type: String, required: true },
  popularFor: { type: String },
  facts: [{ type: String }],
  
  // New traveler decision fields
  bestTimeToVisit: { type: String },
  famousFor: { type: String },
  topCategories: [{ type: String }],
  mustVisitDestinations: [{ type: String }],
  estimatedBudget: {
    budget: { type: String },
    midRange: { type: String },
    luxury: { type: String }
  },
  travelStyleTags: [{ type: String }],
  weatherOverview: { type: String },
  bestTravelSeason: { type: String },
  whyVisit: { type: String },
  topExperiences: [{ type: String }],
  foodSpecialties: [{ type: String }],
  travelTips: [{ type: String }],
  suggestedItineraries: [{
    duration: { type: String },
    title: { type: String },
    dayByDay: [{ type: String }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('State', stateSchema);

