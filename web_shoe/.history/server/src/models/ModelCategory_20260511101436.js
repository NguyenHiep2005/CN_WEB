const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelCategory = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, default: '' },
        icon: { type: String, default: '' },
        categoryType: { type: Number, enum: [1, 2, 3], default: 1 }, // 1: Men, 2: Women, 3: Children
        brand: { type: String, enum: ['Nike', 'Adidas', 'Puma', 'Vans'], required: true },
        order: { type: Number, default: 0 }, // For ordering/priority
        isActive: { type: Boolean, default: true },
        // Promotion/Discount fields
        discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
        isDiscountActive: { type: Boolean, default: false },
        discountStartDate: { type: Date, default: null },
        discountEndDate: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('categories', modelCategory);
