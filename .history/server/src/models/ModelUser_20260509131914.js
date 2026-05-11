const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ModelUser = new Schema({
    fullname: { type: String, require },
    email: { type: String, require },
    password: { type: String, require },
    isAdmin: { type: Boolean, default: false },
    phone: { type: Number, default: 0 },
    otpCode: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
});

module.exports = mongoose.model('user', ModelUser);
