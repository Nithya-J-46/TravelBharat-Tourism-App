const express = require('express');
const router = express.Router();
const City = require('../models/City');
const Place = require('../models/Place');
const { verifyToken } = require('../middleware/auth');

// GET all cities (with optional state filter or state slug filter)
router.get('/', async (req, res) => {
  try {
    const { state } = req.query;
    let query = {};
    if (state) {
      query.state = state;
    }
    const cities = await City.find(query).populate('state', 'name slug').sort({ name: 1 });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single city by ID
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id).populate('state', 'name slug');
    if (!city) return res.status(404).json({ message: 'City not found' });
    res.json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new city (Admin)
router.post('/', verifyToken, async (req, res) => {
  const { name, slug, state, description } = req.body;
  if (!name || !slug || !state) {
    return res.status(400).json({ message: 'Name, slug, and state ID are required' });
  }

  try {
    const city = new City({ name, slug: slug.toLowerCase(), state, description });
    const newCity = await city.save();
    res.status(201).json(newCity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update city (Admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.body.slug) req.body.slug = req.body.slug.toLowerCase();
    const updatedCity = await City.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCity) return res.status(404).json({ message: 'City not found' });
    res.json(updatedCity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE city (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const cityId = req.params.id;

    // Check if there are associated places
    const placesCount = await Place.countDocuments({ city: cityId });
    if (placesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete city. There are ${placesCount} tourist places associated with it. Please delete them first.` 
      });
    }

    const deletedCity = await City.findByIdAndDelete(cityId);
    if (!deletedCity) return res.status(404).json({ message: 'City not found' });
    
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
