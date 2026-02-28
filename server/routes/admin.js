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

        const users = await User.find(query).select('-password').populate('institutionId', 'name').sort({ createdAt: -1 });
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
        let query = {};
        if (req.user.role === 'college_admin') {
            query.institutionId = req.user.institutionId;
        }

        const classes = await Class.find(query).populate('professor', 'name email').sort({ createdAt: -1 });
        res.json(classes);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/analytics/users
// @desc    Get new users per day for last 7 days
// @access  Admin
router.get('/analytics/users', isAdmin, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const analytics = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        const data = labels.map(label => {
            const found = analytics.find(a => a._id === label);
            return { name: label.split('-').slice(1).join('/'), value: found ? found.count : 0 };
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/admin/analytics/attendance
// @desc    Get global attendance percentage per day for last 7 days
// @access  Admin
router.get('/analytics/attendance', isAdmin, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let matchStage = { date: { $gte: sevenDaysAgo } };

        if (req.user.role === 'college_admin') {
            const classes = await Class.find({ institutionId: req.user.institutionId }).select('_id');
            const classIds = classes.map(c => c._id);
            matchStage.classId = { $in: classIds };
        }

        const analytics = await Attendance.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalPresent: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: "$records",
                                    as: "record",
                                    cond: { $eq: ["$$record.status", "present"] }
                                }
                            }
                        }
                    },
                    sessionCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Note: For real percentage, we'd need total students in those classes.
        // For a simple demo/v1, we'll show average "present students per session" or a normalized value.
        // Let's just show total present students across all sessions that day for simplicity in this demo environment.

        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        const data = labels.map(label => {
            const found = analytics.find(a => a._id === label);
            return { name: label.split('-').slice(1).join('/'), value: found ? found.totalPresent : 0 };
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
