const express = require('express');
const router = express.Router();
const Class = require('../models/Class.cjs');
const User = require('../models/User.cjs');
const Attendance = require('../models/Attendance.cjs');
const jwt = require('jsonwebtoken');

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
            professor: req.user.id
        });
        await newClass.save();
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

        await attendance.save();
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
