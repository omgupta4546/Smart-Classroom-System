const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String, // e.g., "IITD", "MIT"
        required: true,
        unique: true,
        uppercase: true
    },
    address: {
        type: String,
        default: ''
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Institution', InstitutionSchema);
