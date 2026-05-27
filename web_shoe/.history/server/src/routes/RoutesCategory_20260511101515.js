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

// Apply discount to category
router.post('/api/category/apply-discount', (req, res) => {
    ControllerCategory.ApplyDiscount(req, res);
});

// Remove discount from category
router.post('/api/category/remove-discount', (req, res) => {
    ControllerCategory.RemoveDiscount(req, res);
});

// Get discount status
router.get('/api/category/discount-status', (req, res) => {
    ControllerCategory.GetDiscountStatus(req, res);
});

module.exports = router;
