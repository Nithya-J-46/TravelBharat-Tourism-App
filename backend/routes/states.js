const express = require('express');
const router = express.Router();
const State = require('../models/State');
const City = require('../models/City');
const Place = require('../models/Place');
const { verifyToken } = require('../middleware/auth');

// GET all states
router.get('/', async (req, res) => {
  try {
    const states = await State.find().sort({ name: 1 });
    res.json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single state by slug (SEO URL)
router.get('/slug/:slug', async (req, res) => {
  try {
    const state = await State.findOne({ slug: req.params.slug.toLowerCase() });
    if (!state) return res.status(404).json({ message: 'State not found' });
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single state by ID
router.get('/:id', async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    if (!state) return res.status(404).json({ message: 'State not found' });
    res.json(state);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new state (Admin)
router.post('/', verifyToken, async (req, res) => {
  const { name, slug, capital, description, bannerImage, popularFor, facts } = req.body;
  if (!name || !slug || !capital || !description || !bannerImage) {
    return res.status(400).json({ message: 'Name, slug, capital, description, and bannerImage are required' });
  }

  try {
    const state = new State({ 
      name, 
      slug: slug.toLowerCase(), 
      capital,
      description, 
      bannerImage, 
      popularFor, 
      facts: facts || []
    });
    const newState = await state.save();
    res.status(201).json(newState);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update state (Admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.body.slug) req.body.slug = req.body.slug.toLowerCase();
    const updatedState = await State.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedState) return res.status(404).json({ message: 'State not found' });
    res.json(updatedState);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE state (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const stateId = req.params.id;
    
    // Check if there are associated cities or places
    const citiesCount = await City.countDocuments({ state: stateId });
    const placesCount = await Place.countDocuments({ state: stateId });
    
    if (citiesCount > 0 || placesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete state. There are ${citiesCount} cities and ${placesCount} places associated with it. Please delete them first.` 
      });
    }

    const deletedState = await State.findByIdAndDelete(stateId);
    if (!deletedState) return res.status(404).json({ message: 'State not found' });
    
    res.json({ message: 'State deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
