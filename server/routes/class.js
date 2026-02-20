const express = require('express');
const router = express.Router();
const Class = require('../models/Class.js');
const User = require('../models/User.js');
const Attendance = require('../models/Attendance.js');
const Notification = require('../models/Notification.js');
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

        // Notification for Student
        const studentNotification = new Notification({
            recipient: req.user.id,
            title: 'Class Joined',
            message: `You have successfully joined ${classroom.name}.`,
            type: 'class',
            link: `/classroom/${classroom.code}`
        });
        await studentNotification.save();

        // Notification for Professor
        const professorNotification = new Notification({
            recipient: classroom.professor,
            title: 'New Student Joined',
            message: `${req.user.name} has joined your class: ${classroom.name}.`,
            type: 'class',
            link: `/classroom/${classroom.code}`
        });
        await professorNotification.save();

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
        const classroom = await Class.findOne({ code: req.params.classCode }).populate('students', 'name faceDescriptor isFaceRegistered universityRollNo classRollNo profilePic');
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

        // Notifications for Students
        const attendancePromises = classroom.students.map(async studentId => {
            const isPresent = studentsPresent.includes(studentId.toString());
            const notification = new Notification({
                recipient: studentId,
                title: isPresent ? 'Attendance Marked: Present' : 'Attendance Marked: Absent',
                message: isPresent
                    ? `You were marked Present in ${classroom.name} today.`
                    : `You were marked Absent in ${classroom.name} today.`,
                type: isPresent ? 'attendance' : 'absence',
                link: `/classroom/${classroom.code}`
            });
            return notification.save();
        });
        await Promise.all(attendancePromises);

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

// @route   GET /api/classes/analytics/attendance
// @desc    Get attendance analytics for last 7 days
// @access  Private
router.get('/analytics/attendance', auth, async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let analytics;
        if (req.user.role === 'professor') {
            // Get all classes for this professor
            const classes = await Class.find({ professor: req.user.id });
            const classIds = classes.map(c => c._id);

            analytics = await Attendance.aggregate([
                { $match: { classId: { $in: classIds }, date: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalPresent: { $sum: { $size: "$records" } },
                        totalPossible: { $sum: classes.reduce((acc, c) => acc + c.students.length, 0) / classes.length } // Simplified avg total for agg
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        } else {
            // Student: Get sessions where they were present
            analytics = await Attendance.aggregate([
                { $match: { date: { $gte: sevenDaysAgo } } },
                { $unwind: "$records" },
                { $match: { "records.student": new mongoose.Types.ObjectId(req.user.id), "records.status": "present" } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        }

        // Fill in missing days
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        const data = labels.map(label => {
            const found = analytics.find(a => a._id === label);
            let value = 0;
            if (req.user.role === 'professor') {
                const totalPossible = classes.reduce((acc, c) => acc + c.students.length, 0);
                value = found ? Math.round((found.totalPresent / totalPossible) * 100) : 0;
            } else {
                value = found ? found.count : 0; // Keeping count for student trend, or can switch to % if total sessions known
            }
            return { name: label.split('-').slice(1).join('/'), value: value };
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classes/analytics/participation
// @desc    Get participation rate per class
// @access  Private
router.get('/analytics/participation', auth, async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'professor') {
            classes = await Class.find({ professor: req.user.id });
        } else {
            classes = await Class.find({ students: req.user.id });
        }

        const participationData = await Promise.all(classes.map(async (cls) => {
            const totalSessions = await Attendance.countDocuments({ classId: cls._id });
            if (totalSessions === 0) return { name: cls.name, value: 0 };

            if (req.user.role === 'professor') {
                const allAttendance = await Attendance.find({ classId: cls._id });
                const totalPossible = allAttendance.length * cls.students.length;
                const totalPresent = allAttendance.reduce((acc, curr) => acc + curr.records.length, 0);
                const rate = Math.round((totalPresent / totalPossible) * 100);
                return { name: cls.name, value: rate };
            } else {
                const myAttendance = await Attendance.countDocuments({
                    classId: cls._id,
                    "records.student": req.user.id,
                    "records.status": "present"
                });
                const rate = Math.round((myAttendance / totalSessions) * 100);
                return { name: cls.name, value: rate };
            }
        }));

        res.json(participationData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classes/summary
// @desc    Get dashboard summary stats
// @access  Private
router.get('/summary', auth, async (req, res) => {
    try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const prev7Days = new Date();
        prev7Days.setDate(prev7Days.getDate() - 14);

        if (req.user.role === 'professor') {
            const classes = await Class.find({ professor: req.user.id });
            const classIds = classes.map(c => c._id);

            // Total Unique Students
            const allStudents = classes.reduce((acc, curr) => acc.concat(curr.students), []);
            const uniqueStudentsCount = new Set(allStudents.map(s => s.toString())).size;

            // Attendance Stats
            const attendanceCurrent = await Attendance.find({ classId: { $in: classIds }, date: { $gte: last7Days } });
            const attendancePrev = await Attendance.find({ classId: { $in: classIds }, date: { $gte: prev7Days, $lt: last7Days } });

            const calcAvg = (records) => {
                if (records.length === 0) return 0;
                let totalPresent = 0;
                let totalPossible = 0;
                records.forEach(r => {
                    totalPresent += r.records.filter(rec => rec.status === 'present').length;
                    totalPossible += r.records.length;
                });
                return totalPossible === 0 ? 0 : (totalPresent / totalPossible) * 100;
            };

            const currentAvg = calcAvg(attendanceCurrent);
            const prevAvg = calcAvg(attendancePrev);
            const trend = prevAvg === 0 ? 0 : ((currentAvg - prevAvg) / prevAvg) * 100;

            res.json({
                primaryStat: uniqueStudentsCount,
                avgAttendance: currentAvg.toFixed(1),
                trend: trend.toFixed(1)
            });
        } else {
            // Student
            const classes = await Class.find({ students: req.user.id });
            const classIds = classes.map(c => c._id);

            const attendanceCurrent = await Attendance.find({ classId: { $in: classIds }, date: { $gte: last7Days } });
            const attendancePrev = await Attendance.find({ classId: { $in: classIds }, date: { $gte: prev7Days, $lt: last7Days } });

            const calcStudentAvg = (records) => {
                const myRecords = records.filter(r => r.records.some(rec => rec.student.toString() === req.user.id));
                if (myRecords.length === 0) return 0;
                const presentCount = myRecords.filter(r => r.records.find(rec => rec.student.toString() === req.user.id && rec.status === 'present')).length;
                return (presentCount / myRecords.length) * 100;
            };

            const currentAvg = calcStudentAvg(attendanceCurrent);
            const prevAvg = calcStudentAvg(attendancePrev);
            const trend = prevAvg === 0 ? 0 : ((currentAvg - prevAvg) / prevAvg) * 100;

            res.json({
                primaryStat: currentAvg.toFixed(1) + '%',
                avgAttendance: currentAvg.toFixed(1),
                trend: trend.toFixed(1)
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/classes/:classCode/announcements
// @desc    Add announcement to class
// @access  Private (Professor)
router.post('/:classCode/announcements', auth, async (req, res) => {
    const { text } = req.body;
    try {
        const classroom = await Class.findOne({ code: req.params.classCode });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });
        if (classroom.professor.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

        classroom.announcements.unshift({ text, author: req.user.id });
        await classroom.save();

        // Notify Students
        const notificationPromises = classroom.students.map(studentId => {
            const notification = new Notification({
                recipient: studentId,
                title: 'New Announcement',
                message: `Prof. ${req.user.name} posted an update in ${classroom.name}.`,
                type: 'update',
                link: `/classroom/${classroom.code}`
            });
            return notification.save();
        });
        await Promise.all(notificationPromises);

        res.json(classroom.announcements[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/classes/:classCode/assignments
// @desc    Add assignment to class
// @access  Private (Professor)
router.post('/:classCode/assignments', auth, async (req, res) => {
    const { title, dueDate } = req.body;
    try {
        const classroom = await Class.findOne({ code: req.params.classCode });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });
        if (classroom.professor.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

        classroom.assignments.unshift({ title, dueDate });
        await classroom.save();

        // Notify Students
        const notificationPromises = classroom.students.map(studentId => {
            const notification = new Notification({
                recipient: studentId,
                title: 'New Assignment',
                message: `New assignment: ${title} in ${classroom.name}. Due: ${new Date(dueDate).toLocaleDateString()}`,
                type: 'assignment',
                link: `/classroom/${classroom.code}`
            });
            return notification.save();
        });
        await Promise.all(notificationPromises);

        res.json(classroom.assignments[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/classes/:classCode/notes
// @desc    Add notes to class
// @access  Private (Professor)
router.post('/:classCode/notes', auth, async (req, res) => {
    const { title, link } = req.body;
    try {
        const classroom = await Class.findOne({ code: req.params.classCode });
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });
        if (classroom.professor.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

        classroom.notes.unshift({ title, link });
        await classroom.save();

        // Notify Students
        const notificationPromises = classroom.students.map(studentId => {
            const notification = new Notification({
                recipient: studentId,
                title: 'New Study Material',
                message: `New notes: ${title} uploaded in ${classroom.name}.`,
                type: 'note',
                link: `/classroom/${classroom.code}`
            });
            return notification.save();
        });
        await Promise.all(notificationPromises);

        res.json(classroom.notes[0]);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
