const ModelCategory = require('../models/ModelCategory');
const slugify = require('slugify');

class ControllerCategory {
    // Get all categories with optional filtering
    async GetAllCategories(req, res, next) {
        try {
            const { categoryType, brand, sort = 'order' } = req.query;
            let filter = { isActive: true };

            if (categoryType) {
                filter.categoryType = Number(categoryType);
            }
            if (brand) {
                filter.brand = brand;
            }

            const categories = await ModelCategory.find(filter).sort({ [sort]: 1 });
            return res.status(200).json(categories);
        } catch (error) {
            console.error('Error getting categories:', error);
            return res.status(500).json({ message: 'Error getting categories', error });
        }
    }

    // Get category by ID
    async GetCategoryById(req, res, next) {
        try {
            const { id } = req.query;
            const category = await ModelCategory.findById(id);

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            return res.status(200).json(category);
        } catch (error) {
            console.error('Error getting category:', error);
            return res.status(500).json({ message: 'Error getting category', error });
        }
    }

    // Create new category
    async CreateCategory(req, res, next) {
        try {
            const { name, description, icon, categoryType, brand, order } = req.body;

            // Validation
            if (!name || !brand) {
                return res.status(400).json({ message: 'Name and brand are required' });
            }

            // Check if category already exists
            const existingCategory = await ModelCategory.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category already exists' });
            }

            const newCategory = new ModelCategory({
                name,
                description: description || '',
                icon: icon || '',
                categoryType: categoryType || 1,
                brand,
                order: order || 0,
            });

            await newCategory.save();
            return res.status(201).json({ message: 'Category created successfully', data: newCategory });
        } catch (error) {
            console.error('Error creating category:', error);
            return res.status(500).json({ message: 'Error creating category', error });
        }
    }

    // Update category
    async UpdateCategory(req, res, next) {
        try {
            const { id } = req.query;
            const { name, description, icon, categoryType, brand, order, isActive } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            // Check if new name already exists (for other categories)
            if (name) {
                const existingCategory = await ModelCategory.findOne({
                    name,
                    _id: { $ne: id },
                });
                if (existingCategory) {
                    return res.status(400).json({ message: 'Category name already exists' });
                }
            }

            const updateData = {
                updatedAt: new Date(),
            };

            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (icon !== undefined) updateData.icon = icon;
            if (categoryType !== undefined) updateData.categoryType = categoryType;
            if (brand !== undefined) updateData.brand = brand;
            if (order !== undefined) updateData.order = order;
            if (isActive !== undefined) updateData.isActive = isActive;

            const updatedCategory = await ModelCategory.findByIdAndUpdate(id, updateData, { new: true });

            if (!updatedCategory) {
                return res.status(404).json({ message: 'Category not found' });
            }

            return res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
        } catch (error) {
            console.error('Error updating category:', error);
            return res.status(500).json({ message: 'Error updating category', error });
        }
    }

    // Delete category
    async DeleteCategory(req, res, next) {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            const deletedCategory = await ModelCategory.findByIdAndUpdate(
                id,
                { isActive: false, updatedAt: new Date() },
                { new: true }
            );

            if (!deletedCategory) {
                return res.status(404).json({ message: 'Category not found' });
            }

            return res.status(200).json({ message: 'Category deleted successfully', data: deletedCategory });
        } catch (error) {
            console.error('Error deleting category:', error);
            return res.status(500).json({ message: 'Error deleting category', error });
        }
    }

    // Update category order (for ordering/priority)
    async UpdateCategoryOrder(req, res, next) {
        try {
            const { categories } = req.body; // Array of {id, order}

            if (!categories || !Array.isArray(categories)) {
                return res.status(400).json({ message: 'Categories array is required' });
            }

            const updatePromises = categories.map((cat) =>
                ModelCategory.findByIdAndUpdate(cat.id, { order: cat.order, updatedAt: new Date() })
            );

            await Promise.all(updatePromises);

            return res.status(200).json({ message: 'Categories order updated successfully' });
        } catch (error) {
            console.error('Error updating category order:', error);
            return res.status(500).json({ message: 'Error updating category order', error });
        }
    }
}

module.exports = new ControllerCategory();
