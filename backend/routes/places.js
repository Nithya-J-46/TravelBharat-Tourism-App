const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Place = require('../models/Place');
const State = require('../models/State');
const City = require('../models/City');
const Category = require('../models/Category');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Levenshtein distance spelling corrector algorithm
const levenshtein = (a, b) => {
  const tmp = [];
  const alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (let i = 0; i <= alen; i++) tmp[i] = [i];
  for (let j = 0; j <= blen; j++) tmp[0][j] = j;
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
};

const getFuzzyMatches = async (term) => {
  const t = term.toLowerCase().trim();
  if (t.length < 2) return { stateIds: [], cityIds: [], categoryIds: [] };

  const [allStates, allCities, allCategories] = await Promise.all([
    State.find({}, '_id name'),
    City.find({}, '_id name'),
    Category.find({}, '_id name')
  ]);

  const stateIds = [];
  const cityIds = [];
  const categoryIds = [];

  const checkFuzzy = (name) => {
    const n = name.toLowerCase();
    if (n.includes(t) || t.includes(n)) return true;
    const distance = levenshtein(t, n);
    // Typo matching threshold
    const maxTypo = n.length > 6 ? 2 : 1;
    return distance <= maxTypo;
  };

  allStates.forEach(s => {
    if (checkFuzzy(s.name)) stateIds.push(s._id);
  });
  allCities.forEach(c => {
    if (checkFuzzy(c.name)) cityIds.push(c._id);
  });
  allCategories.forEach(cat => {
    if (checkFuzzy(cat.name)) categoryIds.push(cat._id);
  });

  return { stateIds, cityIds, categoryIds };
};

// GET search suggestions autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q, category } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const { stateIds, cityIds, categoryIds } = await getFuzzyMatches(q);
    const regexSearch = { $regex: q, $options: 'i' };

    let placeQuery = {
      $or: [
        { name: regexSearch }, 
        { category: { $in: categoryIds } }
      ]
    };

    let stateQuery = {
      $or: [
        { name: regexSearch }, 
        { _id: { $in: stateIds } }
      ]
    };

    let cityQuery = {
      $or: [
        { name: regexSearch }, 
        { _id: { $in: cityIds } }
      ]
    };

    // Apply category filters
    if (category) {
      const catLower = category.toLowerCase().trim();
      if (catLower === 'states') {
        const states = await State.find(stateQuery).limit(6).select('name slug bannerImage');
        const suggestions = states.map(s => ({
          text: s.name,
          type: 'State',
          slug: s.slug,
          path: `/state/${s.slug}`,
          thumbnail: s.bannerImage || null,
          stateName: 'State/UT',
          categoryName: 'Region',
          rating: 4.8
        }));
        return res.json(suggestions);
      } else if (catLower === 'cities') {
        const cities = await City.find(cityQuery).populate('state', 'name').limit(6).select('name state');
        const suggestions = cities.map(c => ({
          text: c.name,
          type: 'City',
          path: `/explore?search=${c.name}`,
          thumbnail: null,
          stateName: c.state?.name || '',
          categoryName: 'City',
          rating: 4.6
        }));
        return res.json(suggestions);
      } else {
        if (catLower === 'heritage sites' || catLower === 'heritage') {
          const heritageCat = await Category.findOne({ name: 'Heritage' });
          if (heritageCat) placeQuery = { name: regexSearch, category: heritageCat._id };
        } else if (catLower === 'beaches') {
          const natureCat = await Category.findOne({ name: 'Nature' });
          const catIds = natureCat ? [natureCat._id] : [];
          placeQuery = {
            name: regexSearch,
            $or: [
              { tags: { $regex: 'beach', $options: 'i' } },
              { category: { $in: catIds } }
            ]
          };
        } else if (catLower === 'hill stations') {
          placeQuery = {
            name: regexSearch,
            tags: { $regex: 'hill station', $options: 'i' }
          };
        } else if (catLower === 'temples') {
          const religiousCat = await Category.findOne({ name: 'Religious' });
          const catIds = religiousCat ? [religiousCat._id] : [];
          placeQuery = {
            name: regexSearch,
            $or: [
              { tags: { $regex: 'temple', $options: 'i' } },
              { category: { $in: catIds } }
            ]
          };
        } else if (catLower === 'wildlife') {
          const wildlifeCat = await Category.findOne({ name: 'Wildlife' });
          if (wildlifeCat) placeQuery = { name: regexSearch, category: wildlifeCat._id };
        }

        const places = await Place.find(placeQuery)
          .populate('state', 'name')
          .populate('category', 'name')
          .limit(6)
          .select('name slug images state category ratingScores');

        const suggestions = places.map(p => ({
          text: p.name,
          type: 'Destination',
          slug: p.slug,
          path: `/destination/${p.slug}`,
          thumbnail: p.images && p.images.length > 0 ? p.images[0] : null,
          stateName: p.state?.name || '',
          categoryName: p.category?.name || '',
          rating: p.ratingScores?.popularity || 4.5
        }));
        return res.json(suggestions);
      }
    }

    // Default Mix search
    const [places, states, cities] = await Promise.all([
      Place.find(placeQuery)
        .populate('state', 'name')
        .populate('category', 'name')
        .limit(4)
        .select('name slug images state category ratingScores'),
      State.find(stateQuery).limit(2).select('name slug bannerImage'),
      City.find(cityQuery).populate('state', 'name').limit(2).select('name state')
    ]);

    const suggestions = [];

    states.forEach(s => {
      suggestions.push({
        text: s.name,
        type: 'State',
        slug: s.slug,
        path: `/state/${s.slug}`,
        thumbnail: s.bannerImage || null,
        stateName: 'State/UT',
        categoryName: 'Region',
        rating: 4.8
      });
    });

    cities.forEach(c => {
      suggestions.push({
        text: c.name,
        type: 'City',
        path: `/explore?search=${c.name}`,
        thumbnail: null,
        stateName: c.state?.name || '',
        categoryName: 'City',
        rating: 4.6
      });
    });

    places.forEach(p => {
      suggestions.push({
        text: p.name,
        type: 'Destination',
        slug: p.slug,
        path: `/destination/${p.slug}`,
        thumbnail: p.images && p.images.length > 0 ? p.images[0] : null,
        stateName: p.state?.name || '',
        categoryName: p.category?.name || '',
        rating: p.ratingScores?.popularity || 4.5
      });
    });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all places (with optional query filters and recommendation types)
router.get('/', async (req, res) => {
  try {
    const { state, category, city, search, recommendationType, tag } = req.query;
    let query = {};
    
    // Resolve State Slug if passed instead of ObjectId
    if (state) {
      if (state.match(/^[0-9a-fA-F]{24}$/)) {
        query.state = state;
      } else {
        const foundState = await State.findOne({ slug: state.toLowerCase() });
        if (foundState) query.state = foundState._id;
      }
    }

    // Resolve City Slug if passed
    if (city) {
      if (city.match(/^[0-9a-fA-F]{24}$/)) {
        query.city = city;
      } else {
        const foundCity = await City.findOne({ slug: city.toLowerCase() });
        if (foundCity) query.city = foundCity._id;
      }
    }

    // Resolve Category Slug if passed
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({ slug: category.toLowerCase() });
        if (foundCategory) query.category = foundCategory._id;
      }
    }
    
    // Recommendation filters
    if (recommendationType === 'trending') {
      query.isTrending = true;
    } else if (recommendationType === 'hidden-gems') {
      query.isHiddenGem = true;
    } else if (recommendationType === 'weekend') {
      query.isWeekendGetaway = true;
    }

    // Tag filtering
    if (tag) {
      query.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    }

    // Smart search logic with fuzzy spelling corrections (Resolves J&K / Kashmir bug)
    if (search) {
      const { stateIds, cityIds, categoryIds } = await getFuzzyMatches(search);
      const regexSearch = { $regex: search, $options: 'i' };

      query.$or = [
        { name: regexSearch },
        { description: regexSearch },
        { history: regexSearch },
        { state: { $in: stateIds } },
        { city: { $in: cityIds } },
        { category: { $in: categoryIds } }
      ];
    }

    // Execute query with sorting
    let sortOption = { createdAt: -1 };
    if (recommendationType === 'trending') {
      sortOption = { viewsCount: -1 };
    }

    const places = await Place.find(query)
      .populate('state', 'name slug')
      .populate('city', 'name slug')
      .populate('category', 'name icon slug')
      .sort(sortOption);
      
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET featured places
router.get('/featured', async (req, res) => {
  try {
    const places = await Place.find()
      .populate('state', 'name slug')
      .populate('city', 'name slug')
      .populate('category', 'name icon slug')
      .limit(6);
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single place by slug (SEO URL) + Increment Views
router.get('/slug/:slug', async (req, res) => {
  try {
    const place = await Place.findOneAndUpdate(
      { slug: req.params.slug.toLowerCase() },
      { $inc: { viewsCount: 1 } },
      { new: true }
    )
    .populate('state', 'name slug bannerImage description capital facts')
    .populate('city', 'name slug description')
    .populate('category', 'name icon slug');
      
    if (!place) return res.status(404).json({ message: 'Destination not found' });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single place by ID
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('state', 'name slug bannerImage description')
      .populate('city', 'name slug description')
      .populate('category', 'name icon slug');
      
    if (!place) return res.status(404).json({ message: 'Destination not found' });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new place (Admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { 
      name, slug, state, city, category, description, history,
      bestTimeToVisit, weatherInfo, location, images, nearbyAttractions, 
      travelTips, entryFee, timings, isHiddenGem, isTrending, isWeekendGetaway
    } = req.body;

    if (!name || !slug || !state || !city || !category || !description || !bestTimeToVisit) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const place = new Place({
      name, 
      slug: slug.toLowerCase(), 
      state, 
      city, 
      category, 
      description,
      history,
      bestTimeToVisit, 
      weatherInfo,
      location, 
      images, 
      nearbyAttractions: nearbyAttractions || [],
      travelTips: travelTips || [],
      entryFee, 
      timings,
      isHiddenGem: isHiddenGem || false,
      isTrending: isTrending || false,
      isWeekendGetaway: isWeekendGetaway || false
    });

    const newPlace = await place.save();
    res.status(201).json(newPlace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update place (Admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    if (req.body.slug) req.body.slug = req.body.slug.toLowerCase();
    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedPlace) return res.status(404).json({ message: 'Place not found' });
    res.json(updatedPlace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE place (Admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedPlace = await Place.findByIdAndDelete(req.params.id);
    if (!deletedPlace) return res.status(404).json({ message: 'Place not found' });
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST upload image (Admin)
router.post('/upload', verifyToken, isAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl: fileUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
