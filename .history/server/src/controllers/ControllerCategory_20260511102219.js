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

    // Apply discount to category and its products
    async ApplyDiscount(req, res, next) {
        try {
            const { id } = req.query;
            const { discountPercentage } = req.body;

            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            if (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100) {
                return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
            }

            // Get category details
            const category = await ModelCategory.findById(id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Update category with discount info
            const updatedCategory = await ModelCategory.findByIdAndUpdate(
                id,
                {
                    discountPercentage,
                    isDiscountActive: true,
                    discountStartDate: new Date(),
                    updatedAt: new Date(),
                },
                { new: true }
            );

            // Get all products in this category by categoryType and brand
            const ModelProducts = require('../models/ModelProducts');
            const productsToDiscount = await ModelProducts.find({
                type: category.categoryType,
                brand: category.brand,
            });

            // Apply discount to all products
            const updatePromises = productsToDiscount.map((product) => {
                // Use originalPrice if set, otherwise use current price as original
                const basePrice = product.originalPrice && product.originalPrice > 0 ? product.originalPrice : product.price;
                const newPrice = Math.round(basePrice * (1 - discountPercentage / 100));
                
                return ModelProducts.findByIdAndUpdate(product._id, {
                    originalPrice: basePrice, // Set original price if not already set
                    price: newPrice,
                    discountPercentage,
                    hasDiscount: true,
                });
            });

            await Promise.all(updatePromises);

            return res.status(200).json({
                message: `Khuyến mại ${discountPercentage}% đã được áp dụng cho ${updatePromises.length} sản phẩm`,
                data: updatedCategory,
                affectedProducts: updatePromises.length,
            });
        } catch (error) {
            console.error('Error applying discount:', error);
            return res.status(500).json({ message: 'Error applying discount', error: error.message });
        }
    }

    // Remove discount from category and restore original prices
    async RemoveDiscount(req, res, next) {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            // Get category details
            const category = await ModelCategory.findById(id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Update category to disable discount
            const updatedCategory = await ModelCategory.findByIdAndUpdate(
                id,
                {
                    discountPercentage: 0,
                    isDiscountActive: false,
                    discountEndDate: new Date(),
                    updatedAt: new Date(),
                },
                { new: true }
            );

            // Get all products in this category
            const ModelProducts = require('../models/ModelProducts');
            const productsToRestore = await ModelProducts.find({
                type: category.categoryType,
                brand: category.brand,
                hasDiscount: true,
            });

            // Restore original prices
            const updatePromises = productsToRestore.map((product) => {
                return ModelProducts.findByIdAndUpdate(product._id, {
                    price: product.originalPrice,
                    discountPercentage: 0,
                    hasDiscount: false,
                });
            });

            await Promise.all(updatePromises);

            return res.status(200).json({
                message: `Khuyến mại đã được dừng. ${updatePromises.length} sản phẩm đã được khôi phục giá gốc`,
                data: updatedCategory,
            });
        } catch (error) {
            console.error('Error removing discount:', error);
            return res.status(500).json({ message: 'Error removing discount', error });
        }
    }

    // Get discount status for a category
    async GetDiscountStatus(req, res, next) {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            const category = await ModelCategory.findById(id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            return res.status(200).json({
                isDiscountActive: category.isDiscountActive,
                discountPercentage: category.discountPercentage,
                discountStartDate: category.discountStartDate,
                discountEndDate: category.discountEndDate,
            });
        } catch (error) {
            console.error('Error getting discount status:', error);
            return res.status(500).json({ message: 'Error getting discount status', error });
        }
    }
}

module.exports = new ControllerCategory();
