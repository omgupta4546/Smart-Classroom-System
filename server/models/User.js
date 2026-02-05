const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'professor'],
        default: 'student'
    },
    rollNo: {
        type: String,
        default: ''
    },
    faceDescriptor: {
        type: [Number], // Array of 128 floats
        default: null
    },
    googleId: {
        type: String,
        default: null
    },
    isFaceRegistered: {
        type: Boolean,
        default: false
    },
    profilePic: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
