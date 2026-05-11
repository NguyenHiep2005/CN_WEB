const express = require('express');
const ControllerCategory = require('../controllers/ControllerCategory');

const router = express.Router();

// Get all categories
router.get('/api/categories', (req, res) => {
    ControllerCategory.GetAllCategories(req, res);
});

// Get category by ID
router.get('/api/category', (req, res) => {
    ControllerCategory.GetCategoryById(req, res);
});

// Create new category
router.post('/api/category/create', (req, res) => {
    ControllerCategory.CreateCategory(req, res);
});

// Update category
router.post('/api/category/update', (req, res) => {
    ControllerCategory.UpdateCategory(req, res);
});

// Delete category
router.delete('/api/category/delete', (req, res) => {
    ControllerCategory.DeleteCategory(req, res);
});

// Update category order
router.post('/api/category/update-order', (req, res) => {
    ControllerCategory.UpdateCategoryOrder(req, res);
});

module.exports = router;
