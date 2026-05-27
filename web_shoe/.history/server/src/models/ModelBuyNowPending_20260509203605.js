const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const modelBuyNowPending = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    products: [
        {
            nameProduct: { type: String, default: '' },
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
            size: { type: Number, default: 0 },
            img: { type: String, default: '' },
            type: { type: Number, default: 0 },
        },
    ],
    sumprice: { type: Number, default: 0 },
    user: { type: String, required: true },
    typePayments: { type: String, default: 'VNPAY' },
    createdAt: { 
        type: Date, 
        default: Date.now,
        expires: 3600 // Auto-delete after 1 hour
    },
});

module.exports = mongoose.model('buynowpending', modelBuyNowPending);
