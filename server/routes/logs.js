const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

// Middleware to check for Admin/Super Admin
const isAdmin = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin' && decoded.user.role !== 'super_admin' && decoded.user.role !== 'college_admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token invalid' });
    }
};

// @route   GET /api/logs
// @desc    Get Audit Logs
// @access  Admin/Super Admin/College Admin
router.get('/', isAdmin, async (req, res) => {
    try {
        let query = {};

        // precise filtering based on role
        if (req.user.role === 'college_admin') {
            query.institutionId = req.user.institutionId;
        }

        const logs = await AuditLog.find(query)
            .populate('performedBy', 'name email role')
            .sort({ timestamp: -1 })
            .limit(100);

        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
