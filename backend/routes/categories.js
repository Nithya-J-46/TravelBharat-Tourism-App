const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Place = require('../models/Place');
const { verifyToken } = require('../middleware/auth');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug.toLowerCase() });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new category (Admin)
router.post('/', verifyToken, async (req, res) => {
  const { name, slug, description, icon } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ message: 'Category name and slug are required' });
  }

  try {
    const category = new Category({ name, slug: slug.toLowerCase(), description, icon });
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update category (Admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.body.slug) req.body.slug = req.body.slug.toLowerCase();
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE category (Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if there are associated places
    const placesCount = await Place.countDocuments({ category: categoryId });
    if (placesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. There are ${placesCount} tourist places associated with it. Please delete them first.` 
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
