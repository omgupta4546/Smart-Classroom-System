const express = require('express');
const router = express.Router();
const User = require('../models/User.cjs');
const Class = require('../models/Class.cjs');
const Attendance = require('../models/Attendance.cjs');
const jwt = require('jsonwebtoken');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Admin access denied' });
        }
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get system-wide stats
// @access  Admin
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalClasses = await Class.countDocuments();
        const totalAttendanceLogs = await Attendance.countDocuments();

        const professors = await User.countDocuments({ role: 'professor' });
        const students = await User.countDocuments({ role: 'student' });

        res.json({
            users: { total: totalUsers, professors, students },
            classes: totalClasses,
            attendanceLogs: totalAttendanceLogs
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/user/:id
// @desc    Delete a user
// @access  Admin
router.delete('/user/:id', isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/classes
// @desc    Get all classes
// @access  Admin
router.get('/classes', isAdmin, async (req, res) => {
    try {
        const classes = await Class.find().populate('professor', 'name email').sort({ createdAt: -1 });
        res.json(classes);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
