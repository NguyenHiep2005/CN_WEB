const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelProduct = new Schema({
    img: [{ type: String, default: '' }],
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: Number, default: 0 },
    brand: { type: String, default: '' },
    categoryId: { type: String, default: '' },
    sizes: [
        {
            size: { type: String, default: '' },
            quantity: { type: Number, default: 0 },
        },
    ],
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    hasDiscount: { type: Boolean, default: false },
});

module.exports = mongoose.model('products', modelProduct);
