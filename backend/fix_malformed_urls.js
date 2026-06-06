require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to Database
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat';

async function fixDatabase() {
  try {
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Fix Places
    const Place = mongoose.model('Place', new mongoose.Schema({}, { strict: false }));
    const places = await Place.find({});
    console.log(`Found ${places.length} places. Inspecting images...`);
    
    let fixedPlacesCount = 0;
    for (let place of places) {
      let changed = false;
      const images = place.get('images');
      if (images && Array.isArray(images)) {
        const fixedImages = images.map(img => {
          if (typeof img === 'string' && img.includes('photo-photo-')) {
            changed = true;
            return img.replace(/photo-photo-/g, 'photo-');
          }
          return img;
        });
        if (changed) {
          place.set('images', fixedImages);
        }
      }
      
      const description = place.get('description');
      // Just in case description or other fields have it
      
      if (changed) {
        await place.save();
        fixedPlacesCount++;
      }
    }
    console.log(`Fixed ${fixedPlacesCount} places in MongoDB.`);

    // 2. Fix States
    const State = mongoose.model('State', new mongoose.Schema({}, { strict: false }));
    const states = await State.find({});
    console.log(`Found ${states.length} states. Inspecting banner images...`);
    
    let fixedStatesCount = 0;
    for (let state of states) {
      let changed = false;
      const bannerImage = state.get('bannerImage');
      if (typeof bannerImage === 'string' && bannerImage.includes('photo-photo-')) {
        state.set('bannerImage', bannerImage.replace(/photo-photo-/g, 'photo-'));
        changed = true;
      }
      
      if (changed) {
        await state.save();
        fixedStatesCount++;
      }
    }
    console.log(`Fixed ${fixedStatesCount} states in MongoDB.`);

  } catch (err) {
    console.error('Database fix failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

function fixJSONFiles() {
  const filesToFix = [
    'destinationImages.json',
    'curatedPlacesData.json',
    'statesData.json'
  ];

  filesToFix.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`Fixing file: ${fileName}...`);
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('photo-photo-')) {
          const fixedContent = content.replace(/photo-photo-/g, 'photo-');
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log(`Successfully fixed URLs in ${fileName}`);
        } else {
          console.log(`No malformed URLs found in ${fileName}`);
        }
      } catch (err) {
        console.error(`Failed to fix ${fileName}:`, err);
      }
    } else {
      console.log(`File not found: ${fileName}`);
    }
  });
}

async function run() {
  await fixDatabase();
  fixJSONFiles();
  console.log('Done fixing all malformed URLs!');
}

run();
