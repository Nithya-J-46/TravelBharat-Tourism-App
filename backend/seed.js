require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const State = require('./models/State');
const City = require('./models/City');
const Category = require('./models/Category');
const Place = require('./models/Place');
const User = require('./models/User');

const statesData = require('./statesData.json');
const curatedPlacesData = require('./curatedPlacesData.json');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Starting database seeding (1080 destinations)...');

    // Clear existing data
    await Place.deleteMany({});
    await City.deleteMany({});
    await State.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared database collections.');

    // Seed Categories
    const categoriesData = [
      { name: 'Heritage', description: 'UNESCO heritage sites, ancient forts, historic palaces, and ruins.', icon: 'Castle' },
      { name: 'Nature', description: 'Beaches, hill stations, scenic valleys, water lagoons, and backwaters.', icon: 'Trees' },
      { name: 'Adventure', description: 'Trekking, white river rafting, mountaineering, and skiing.', icon: 'Zap' },
      { name: 'Religious', description: 'Sacred temples, shrines, mosques, churches, and monasteries.', icon: 'Sun' },
      { name: 'Cultural', description: 'Vibrant local festivals, traditional dance centers, and craft villages.', icon: 'Palette' },
      { name: 'Wildlife', description: 'National parks, tiger reserves, bird sanctuaries, and safaris.', icon: 'Bird' }
    ];
    const categoriesToInsert = categoriesData.map(c => ({ ...c, slug: slugify(c.name) }));
    const insertedCategories = await Category.insertMany(categoriesToInsert);
    const getCatId = (name) => {
      const found = insertedCategories.find(c => c.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(c.name.toLowerCase()));
      return found ? found._id : insertedCategories[0]._id;
    };

    let totalPlacesCount = 0;
    let lockPointer = 1000;

    // Outer Loop: 36 States/UTs
    for (let i = 0; i < statesData.length; i++) {
      const sData = statesData[i];
      const stateSlug = slugify(sData.name);
      
      const stateObj = new State({
        name: sData.name,
        slug: stateSlug,
        capital: sData.capital,
        description: sData.description || sData.famousFor,
        bannerImage: sData.bannerImage,
        popularFor: sData.popularFor,
        facts: sData.facts,
        bestTimeToVisit: sData.bestTimeToVisit,
        famousFor: sData.famousFor,
        topCategories: sData.topCategories,
        mustVisitDestinations: sData.mustVisitDestinations,
        estimatedBudget: sData.estimatedBudget,
        travelStyleTags: sData.travelStyleTags,
        weatherOverview: sData.weatherOverview,
        bestTravelSeason: sData.bestTravelSeason,
        whyVisit: sData.whyVisit,
        topExperiences: sData.topExperiences,
        foodSpecialties: sData.foodSpecialties,
        travelTips: sData.travelTips,
        suggestedItineraries: sData.suggestedItineraries
      });
      const savedState = await stateObj.save();

      // Inner Loop: 3 Cities per State
      for (let j = 0; j < sData.cities.length; j++) {
        const cData = sData.cities[j];
        const citySlug = slugify(cData.name);
        
        const cityObj = new City({
          name: cData.name,
          slug: citySlug,
          state: savedState._id,
          description: `${cData.name} is a primary tourist and cultural center in ${sData.name}. It welcomes thousands of visitors annually looking to experience traditional Indian hospitality.`
        });
        const savedCity = await cityObj.save();

        // Seed Curated Places from JSON
        const cityPlacesList = curatedPlacesData[cData.name] || [];
        for (let k = 0; k < cityPlacesList.length; k++) {
          const cur = cityPlacesList[k];
          const placeSlug = `${stateSlug}-${citySlug}-${slugify(cur.name)}`;

          const place = new Place({
            name: cur.name,
            slug: placeSlug,
            state: savedState._id,
            city: savedCity._id,
            category: getCatId(cur.category),
            description: cur.description,
            history: cur.history,
            culturalImportance: cur.culturalImportance,
            whyVisit: cur.whyVisit,
            famousFor: cur.famousFor,
            travelTips: cur.travelTips,
            photographyTips: [
              "Capture the morning sunrise from the eastern viewpoint for soft lighting.",
              "The glowing facade looks stunning during the twilight hour."
            ],
            safetyTips: cur.safetyTips,
            accessibilityInfo: cur.accessibilityInfo,
            
            howToReach: {
              byAir: { nearest: `${sData.capital} Airport`, distance: `${Math.floor(Math.random() * 80) + 15} km` },
              byTrain: { nearest: `${cData.name} Railway Junction`, distance: `${Math.floor(Math.random() * 10) + 2} km` },
              byBus: { nearest: `${cData.name} Central Bus Terminal`, distance: `${Math.floor(Math.random() * 5) + 1} km` },
              byRoad: { routeSuggestions: `Connected via National Highways. Direct taxi services and state tourist buses run regularly from ${sData.capital}.` }
            },

            entryFees: cur.entryFees,
            additionalCharges: [
              { name: "Camera Fee", amount: 20 },
              { name: "Parking Fee", amount: 50 }
            ],

            hotels: cur.hotels,
            foodSpots: cur.foodSpots,

            weather: cur.weather || {
              summer: { tempRange: "26°C - 38°C", crowdLevel: "Medium" },
              winter: { tempRange: "10°C - 22°C", crowdLevel: "High" },
              monsoon: { tempRange: "22°C - 30°C", crowdLevel: "Low" }
            },
            suggestedDuration: cur.suggestedDuration || "1 Day",
            bestTimeToVisit: cur.bestTimeToVisit || "October to March",
            timings: cur.timings,

            ratingScores: {
              popularity: 4.0 + (Math.random() * 1.0),
              familyFriendly: 4.0 + (Math.random() * 1.0),
              adventure: 3.0 + (Math.random() * 2.0),
              photography: 4.0 + (Math.random() * 1.0),
              budgetFriendly: 3.0 + (Math.random() * 2.0),
              accessibility: 3.0 + (Math.random() * 1.5)
            },

            faqs: cur.faqs || [
              { 
                question: `What is the best month to visit ${cur.name}?`, 
                answer: `The best months to visit ${cur.name} are ${cur.bestTimeToVisit || "October to March"} when the weather is most comfortable.` 
              }
            ],

            coordinates: cur.coordinates,
            location: `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3549.9443574163996!2d78.0395672761899!3d27.17514954930364!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39747121d5c561b3%3A0xc3cc68e762b32996!2sTaj%20Mahal!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin`,
            nearbyAttractions: cur.nearbyAttractions,
            viewsCount: Math.floor(Math.random() * 8000) + 100,
            tags: cur.tags || [],
            isHiddenGem: Math.random() > 0.85,
            isTrending: Math.random() > 0.85,
            isWeekendGetaway: Math.random() > 0.85,
            images: cur.images
          });

          await place.save();
          totalPlacesCount++;
        }
      }
      console.log(`Seeded State (${i + 1}/36): ${sData.name} with ${sData.cities.length} cities.`);
    }

    // Seed Default Admin
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword
    });
    await adminUser.save();
    console.log('Seeded default admin user.');

    console.log(`Seeding completed successfully! Total States/UTs: ${statesData.length}, Total Places: ${totalPlacesCount}.`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.connection.close();
  }
};

seed();
