const express = require('express');
const router = express.Router();
const Class = require('../models/Class.js');
const User = require('../models/User.js');
const Attendance = require('../models/Attendance.js');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/logger.js');
const nodemailer = require('nodemailer');

// Email Transporter (Configure with your SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    }
});

// Middleware to check token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token invalid' });
    }
};

// Create Class (Prof)
router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Access denied' });

    const { name, code } = req.body;
    try {
        let newClass = new Class({
            name,
            code,
            professor: req.user.id,
            institutionId: req.user.institutionId
        });
        await newClass.save();
        await logAction('CREATE_CLASS', req.user, newClass.name, { code });
        res.json(newClass);
    } catch (err) {
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Join Class (Student)
router.post('/join', auth, async (req, res) => {
    const { code } = req.body;
    try {
        const classroom = await Class.findOne({ code });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        // Prevent duplicates
        if (classroom.students.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Already joined' });
        }

        classroom.students.push(req.user.id);
        await classroom.save();
        await logAction('JOIN_CLASS', req.user, classroom.name, { code });
        res.json({ msg: 'Class joined' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get My Classes
router.get('/my', auth, async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'professor') {
            classes = await Class.find({ professor: req.user.id });
        } else {
            classes = await Class.find({ students: req.user.id });
        }
        res.json(classes);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Save Face Descriptor
router.post('/face/register', auth, async (req, res) => {
    const { descriptor } = req.body; // Array of numbers
    try {
        const user = await User.findById(req.user.id);
        user.faceDescriptor = descriptor;
        user.isFaceRegistered = true;
        await user.save();
        res.json({ msg: 'Face registered' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get Class Students (For Attendance)
router.get('/:classCode/students', auth, async (req, res) => {
    try {
        const classroom = await Class.findOne({ code: req.params.classCode }).populate('students', 'name faceDescriptor isFaceRegistered');
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        res.json(classroom.students);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


// Mark Attendance
router.post('/mark', auth, async (req, res) => {
    const { classCode, studentsPresent } = req.body; // studentsPresent = [studentId1, studentId2]

    try {
        const classroom = await Class.findOne({ code: classCode });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        // Record for today? Or just append
        let attendance = new Attendance({
            classId: classroom.id,
            records: studentsPresent.map(id => ({
                student: id,
                status: 'present'
            }))
        });

        // 1. Geo-Fencing Check
        if (req.body.location && classroom.location && classroom.location.lat) {
            const { lat, long } = req.body.location;
            const classLat = classroom.location.lat;
            const classLong = classroom.location.long;

            // Simple Distance Calc (Haversine Formula approximation for short distances)
            const R = 6371e3; // metres
            const φ1 = lat * Math.PI / 180; // φ, λ in radians
            const φ2 = classLat * Math.PI / 180;
            const Δφ = (classLat - lat) * Math.PI / 180;
            const Δλ = (classLong - long) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // in metres

            if (d > classroom.location.radius) {
                return res.status(400).json({ msg: `You are ${Math.round(d)}m away. Must be within ${classroom.location.radius}m.` });
            }
        }

        await attendance.save();
        await logAction('MARK_ATTENDANCE', req.user, classroom.name, { count: studentsPresent.length });

        // 2. Low Attendance Alerts
        // Note: In real app, calculate actual percentage. Here we simulate alert for demo.
        studentsPresent.forEach(async studentId => {
            // Mock check: 50% chance to trigger alert for demo purposes
            if (Math.random() < 0.1) {
                const student = await User.findById(studentId);
                if (student && student.email) {
                    transporter.sendMail({
                        from: 'admin@smartclass.com',
                        to: student.email,
                        subject: `Low Attendance Warning: ${classroom.name}`,
                        text: `Your attendance in ${classroom.name} has dropped below ${classroom.minAttendance}%. Please attend upcoming classes.`
                    }).catch(err => console.error("Email failed", err));
                }
            }
        });

        res.json({ msg: 'Attendance marked' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get Attendance History
router.get('/:classCode/attendance', auth, async (req, res) => {
    try {
        const classroom = await Class.findOne({ code: req.params.classCode });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        const history = await Attendance.find({ classId: classroom._id })
            .populate('records.student', 'name email rollNo')
            .sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
