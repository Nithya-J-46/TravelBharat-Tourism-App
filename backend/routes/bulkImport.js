const express = require('express');
const router = express.Router();
const State = require('../models/State');
const City = require('../models/City');
const Category = require('../models/Category');
const Place = require('../models/Place');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST bulk import places (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'Input must be a JSON array of places.' });
  }

  let successCount = 0;
  let errorCount = 0;
  let errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      if (!item.name || !item.stateName || !item.cityName || !item.categoryName || !item.description) {
        throw new Error(`Missing required fields. Needs: name, stateName, cityName, categoryName, description.`);
      }

      // 1. Resolve or Create State
      let stateObj = await State.findOne({ name: { $regex: new RegExp(`^${item.stateName.trim()}$`, 'i') } });
      if (!stateObj) {
        const slug = item.stateName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        stateObj = new State({
          name: item.stateName.trim(),
          slug,
          capital: item.stateCapital || 'State Capital',
          description: item.stateDescription || `Discover the beauty and tourism highlights of ${item.stateName}.`,
          bannerImage: item.stateBannerImage || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1000',
          popularFor: item.statePopularFor || 'Tourism, Sightseeing',
          facts: item.stateFacts || [`Welcome to ${item.stateName}`]
        });
        await stateObj.save();
      }

      // 2. Resolve or Create Category
      let categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${item.categoryName.trim()}$`, 'i') } });
      if (!categoryObj) {
        const slug = item.categoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        categoryObj = new Category({
          name: item.categoryName.trim(),
          slug,
          description: `${item.categoryName} tourist places.`,
          icon: item.categoryIcon || 'Compass'
        });
        await categoryObj.save();
      }

      // 3. Resolve or Create City
      let cityObj = await City.findOne({
        name: { $regex: new RegExp(`^${item.cityName.trim()}$`, 'i') },
        state: stateObj._id
      });
      if (!cityObj) {
        const slug = item.cityName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        cityObj = new City({
          name: item.cityName.trim(),
          slug,
          state: stateObj._id,
          description: item.cityDescription || `Tourist city of ${item.cityName} in ${stateObj.name}.`
        });
        await cityObj.save();
      }

      // 4. Create Unique Place Slug
      let cleanSlug = item.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      // Check if place slug already exists
      const existingPlace = await Place.findOne({ slug: cleanSlug });
      if (existingPlace) {
        cleanSlug = `${cleanSlug}-${Math.round(Math.random() * 10000)}`;
      }

      // Create and Save Place
      const place = new Place({
        name: item.name.trim(),
        slug: cleanSlug,
        state: stateObj._id,
        city: cityObj._id,
        category: categoryObj._id,
        description: item.description.trim(),
        history: item.history || `Historically significant site located in ${item.cityName}, ${item.stateName}.`,
        bestTimeToVisit: item.bestTimeToVisit || 'October to March',
        weatherInfo: item.weatherInfo || 'Pleasant, moderate temperatures.',
        location: item.location || '',
        images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1000'],
        nearbyAttractions: item.nearbyAttractions || [],
        travelTips: item.travelTips || ['Follow local guidelines', 'Respect local cultures'],
        viewsCount: item.viewsCount || 0,
        isHiddenGem: item.isHiddenGem || false,
        isTrending: item.isTrending || false,
        isWeekendGetaway: item.isWeekendGetaway || false
      });

      await place.save();
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ index: i, name: item.name || 'Unnamed', error: err.message });
    }
  }

  res.json({
    success: true,
    message: `Imported ${successCount} places successfully. ${errorCount} failures.`,
    successCount,
    errorCount,
    errors
  });
});

module.exports = router;
