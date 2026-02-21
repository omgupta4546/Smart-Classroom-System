const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subjectName: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    minAttendance: {
        type: Number,
        default: 75
    },
    announcements: [{
        text: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    assignments: [{
        title: String,
        dueDate: Date,
        createdAt: { type: Date, default: Date.now }
    }],
    notes: [{
        title: String,
        link: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Class', ClassSchema);
