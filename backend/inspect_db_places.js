require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('./models/Place');
const State = require('./models/State');
const City = require('./models/City');

async function inspect() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat';
  await mongoose.connect(mongoUri);
  
  const places = await Place.find({}).populate('state').populate('city');
  console.log(`Total seeded places in DB: ${places.length}`);
  
  // 1. Timings statistics
  const timingsMap = {};
  // 2. Best time to visit statistics
  const bestTimeMap = {};
  // 3. Entry fees statistics
  const entryFeesMap = {};
  // 4. Travel tips statistics
  const travelTipsMap = {};
  // 5. Nearby attractions statistics
  const attractionsMap = {};
  
  places.forEach(p => {
    timingsMap[p.timings] = (timingsMap[p.timings] || 0) + 1;
    bestTimeMap[p.bestTimeToVisit] = (bestTimeMap[p.bestTimeToVisit] || 0) + 1;
    
    const feeStr = JSON.stringify(p.entryFees);
    entryFeesMap[feeStr] = (entryFeesMap[feeStr] || 0) + 1;
    
    const tipsStr = JSON.stringify(p.travelTips);
    travelTipsMap[tipsStr] = (travelTipsMap[tipsStr] || 0) + 1;
    
    const attrStr = JSON.stringify(p.nearbyAttractions);
    attractionsMap[attrStr] = (attractionsMap[attrStr] || 0) + 1;
  });
  
  console.log('\n--- TIMINGS IN DB ---');
  console.log(JSON.stringify(timingsMap, null, 2));
  
  console.log('\n--- BEST TIME TO VISIT IN DB ---');
  console.log(JSON.stringify(bestTimeMap, null, 2));
  
  console.log('\n--- ENTRY FEES IN DB ---');
  console.log(JSON.stringify(entryFeesMap, null, 2));
  
  console.log('\n--- TRAVEL TIPS IN DB (top duplicates) ---');
  const sortedTips = Object.entries(travelTipsMap).sort((a,b) => b[1] - a[1]);
  console.log(JSON.stringify(sortedTips.slice(0, 5), null, 2));
  
  console.log('\n--- NEARBY ATTRACTIONS IN DB (top duplicates) ---');
  const sortedAttrs = Object.entries(attractionsMap).sort((a,b) => b[1] - a[1]);
  console.log(JSON.stringify(sortedAttrs.slice(0, 5), null, 2));
  
  // Let's print the specific data for Munnar, Meenakshi Temple, Ooty Lake, Hundru Falls
  const targets = ["Munnar", "Meenakshi", "Ooty Lake", "Hundru Falls"];
  console.log('\n--- SPECIFIC PLACES ---');
  places.forEach(p => {
    if (targets.some(t => p.name.includes(t))) {
      console.log(`\nPlace Name: ${p.name}`);
      console.log(`Best Time: ${p.bestTimeToVisit}`);
      console.log(`Timings: ${p.timings}`);
      console.log(`Entry Fees: ${JSON.stringify(p.entryFees)}`);
      console.log(`Travel Tips: ${JSON.stringify(p.travelTips)}`);
      console.log(`Nearby Attractions: ${JSON.stringify(p.nearbyAttractions)}`);
    }
  });

  mongoose.connection.close();
}

inspect();
