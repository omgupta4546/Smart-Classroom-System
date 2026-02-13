const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Class = require('../models/Class.js');
const Attendance = require('../models/Attendance.js');
const jwt = require('jsonwebtoken');

// Middleware to check if user is admin
// Middleware to check if user is admin (Super or College)
const isAdmin = (req, res, next) => {
    const token = req.header('x-auth-token');
    console.log("Admin Middleware Reached. Token:", token ? "Present" : "Missing");
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin' && decoded.user.role !== 'super_admin' && decoded.user.role !== 'college_admin') {
            return res.status(403).json({ msg: 'Admin access denied' });
        }
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   GET /api/admin/stats
// @desc    Get system-wide stats (Filtered for College Admins)
// @access  Admin
router.get('/stats', isAdmin, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'college_admin') {
            query.institutionId = req.user.institutionId;
        }

        const totalUsers = await User.countDocuments(query);
        const totalClasses = await Class.countDocuments(query);
        // Note: Attendance logs don't directly have institutionId, filtering them is complex.
        // For now, we'll show total logs (or would need to aggregate via Class lookup)
        const totalAttendanceLogs = await Attendance.countDocuments();

        const professors = await User.countDocuments({ ...query, role: 'professor' });
        const students = await User.countDocuments({ ...query, role: 'student' });

        res.json({
            users: { total: totalUsers, professors, students },
            classes: totalClasses,
            attendanceLogs: totalAttendanceLogs
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (Filtered)
// @access  Admin
router.get('/users', isAdmin, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'college_admin') {
            query.institutionId = req.user.institutionId;
        } else if (req.user.role === 'super_admin') {
            // Super admin sees all, or can filter? For now sees all.
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
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
