const express = require('express');
const router = express.Router();
const Class = require('../models/Class.js');
const User = require('../models/User.js');
const Attendance = require('../models/Attendance.js');
const Notification = require('../models/Notification.js');
const jwt = require('jsonwebtoken');
const logAction = require('../utils/logger.js');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

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

// --- STATIC ANALYTICS ROUTES (Must be before parameterized routes) ---

// @route   GET /api/classes/analytics/attendance
// @desc    Get attendance analytics for last 7 days
// @access  Private
router.get('/analytics/attendance', auth, async (req, res) => {
    try {
        const historyDays = 14;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historyDays);

        let analytics, classes;
        if (req.user.role === 'professor') {
            classes = await Class.find({ professor: req.user.id });
        } else {
            classes = await Class.find({ students: req.user.id });
        }
        const classIds = classes.map(c => c._id);

        if (req.user.role === 'professor') {
            analytics = await Attendance.aggregate([
                { $match: { classId: { $in: classIds }, date: { $gte: startDate } } },
                {
                    $lookup: {
                        from: 'classes',
                        localField: 'classId',
                        foreignField: '_id',
                        as: 'classInfo'
                    }
                },
                { $unwind: '$classInfo' },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalPresent: { $sum: { $size: "$records" } },
                        totalPossible: { $sum: { $size: "$classInfo.students" } }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        } else {
            // Safe approach: unwind then group to avoid $anyElementTrue crash on empty arrays
            analytics = await Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: startDate },
                        classId: { $in: classIds }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalSessions: { $sum: 1 },
                        allRecords: { $push: "$records" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Post-process in JS to safely count attended sessions
            const studentId = req.user.id.toString();
            analytics = analytics.map(day => {
                let attended = 0;
                day.allRecords.forEach(sessionRecords => {
                    const wasPresent = sessionRecords.some(r =>
                        r.student && r.student.toString() === studentId && r.status === 'present'
                    );
                    if (wasPresent) attended++;
                });
                return { _id: day._id, totalSessions: day.totalSessions, attendedSessions: attended };
            });
        }

        const labels = [];
        for (let i = historyDays - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toISOString().split('T')[0]);
        }

        // --- NEW: Calculate University Average for Comparison ---
        const universityAvg = await Attendance.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $lookup: {
                    from: 'classes',
                    localField: 'classId',
                    foreignField: '_id',
                    as: 'classInfo'
                }
            },
            { $unwind: '$classInfo' },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    totalPresent: { $sum: { $size: "$records" } },
                    totalPossible: { $sum: { $size: "$classInfo.students" } }
                }
            }
        ]);

        const data = labels.map(label => {
            const found = analytics.find(a => a._id === label);
            const foundUniv = universityAvg.find(u => u._id === label);

            let value = 0;
            if (req.user.role === 'professor') {
                value = found ? Math.round((found.totalPresent / found.totalPossible) * 100) : 0;
            } else {
                // Students: correctly use totalSessions from aggregation
                value = found ? Math.round((found.attendedSessions / found.totalSessions) * 100) : 0;
            }

            const avgValue = foundUniv ? Math.round((foundUniv.totalPresent / foundUniv.totalPossible) * 100) : 0;
            const volatility = Math.abs(value - avgValue); // Simple delta as volatility measure

            return {
                name: label.split('-').slice(1).join('/'),
                value: value,
                avg: avgValue,
                volatility: volatility
            };
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classes/analytics/insights
// @desc    Get actionable insights for professor/student
// @access  Private
router.get('/analytics/insights', auth, async (req, res) => {
    try {
        const insights = [];
        if (req.user.role === 'professor') {
            const classes = await Class.find({ professor: req.user.id });
            const classIds = classes.map(c => c._id);

            // 1. Identify "At Risk" Students (< 75% attendance)
            const attendanceData = await Attendance.aggregate([
                { $match: { classId: { $in: classIds } } },
                { $unwind: "$records" },
                {
                    $group: {
                        _id: "$records.student",
                        presentCount: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
                        totalSessions: { $sum: 1 }
                    }
                }
            ]);

            const atRiskIds = attendanceData
                .filter(a => (a.presentCount / a.totalSessions) < 0.75)
                .map(a => a._id);

            const atRiskStudents = await User.find({ _id: { $in: atRiskIds } }, 'name email universityRollNo');

            if (atRiskStudents.length > 0) {
                insights.push({
                    type: 'warning',
                    title: 'At-Risk Students',
                    message: `${atRiskStudents.length} students have less than 75% attendance.`,
                    data: atRiskStudents.slice(0, 5) // Send top 5
                });
            }

            // 2. Best Attendance Class
            const classParticipation = await Promise.all(classes.map(async (cls) => {
                const sessions = await Attendance.find({ classId: cls._id });
                if (sessions.length === 0) return { name: cls.name, rate: 0 };
                const totalPossible = sessions.length * cls.students.length;
                const totalPresent = sessions.reduce((acc, curr) => acc + curr.records.length, 0);
                return { name: cls.name, rate: (totalPresent / totalPossible) * 100 };
            }));

            const bestClass = classParticipation.reduce((prev, current) => (prev.rate > current.rate) ? prev : current, { rate: -1 });
            if (bestClass.rate > 0) {
                insights.push({
                    type: 'success',
                    title: 'Top Performing Class',
                    message: `${bestClass.name} has the highest engagement at ${bestClass.rate.toFixed(1)}%.`,
                });
            }

        } else {
            // Student Insights
            const myAttendance = await Attendance.aggregate([
                { $unwind: "$records" },
                { $match: { "records.student": new mongoose.Types.ObjectId(req.user.id) } },
                {
                    $group: {
                        _id: null,
                        presentCount: { $sum: { $cond: [{ $eq: ["$records.status", "present"] }, 1, 0] } },
                        totalSessions: { $sum: 1 }
                    }
                }
            ]);

            if (myAttendance.length > 0) {
                const rate = (myAttendance[0].presentCount / myAttendance[0].totalSessions) * 100;
                insights.push({
                    type: rate >= 75 ? 'success' : 'warning',
                    title: 'Global Attendance',
                    message: `Your overall attendance across all classes is ${rate.toFixed(1)}%.`,
                });

                if (rate < 75) {
                    insights.push({
                        type: 'critical',
                        title: 'Attendance Alert',
                        message: 'You are below the minimum 75% requirement. Attend more sessions to avoid penalties.',
                    });
                } else {
                    insights.push({
                        type: 'info',
                        title: 'Keep it Up!',
                        message: 'Maintain your current trend to qualify for exams.',
                    });
                }
            }
        }

        res.json(insights);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classes/analytics/radar
// @desc    Get multi-dimensional engagement data
// @access  Private
router.get('/analytics/radar', auth, async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'professor') {
            classes = await Class.find({ professor: req.user.id });
        } else {
            classes = await Class.find({ students: req.user.id });
        }

        const totalStudentsInUniv = await User.countDocuments({ role: 'student' });

        const radarData = await Promise.all(classes.map(async (cls) => {
            const sessions = await Attendance.find({ classId: cls._id });

            // Metric 1: Absolute Attendance (Total Present)
            let totalPresentCount = 0;
            if (sessions.length > 0) {
                totalPresentCount = sessions.reduce((acc, curr) => acc + curr.records.length, 0);
            }

            // Metric 2: Consistency (Actual Sessions count)
            const consistency = sessions.length;

            // Metric 3: Enrollment (Actual Students count)
            const enrollmentWeight = cls.students.length;

            return {
                subject: cls.subjectName || cls.name,
                attendance: totalPresentCount,
                consistency: consistency,
                enrollment: enrollmentWeight
            };
        }));

        res.json(radarData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classes/analytics/face-detection
// @desc    Get mock face detection analysis for professor
// @access  Private
router.get('/analytics/face-detection', auth, async (req, res) => {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Access denied' });
    try {
        // Mock data for presentation
        const data = [
            { name: 'Recognized', value: 78, fill: '#10b981' },
            { name: 'Blurry', value: 12, fill: '#f59e0b' },
            { name: 'Partial', value: 8, fill: '#ef4444' },
            { name: 'Undetected', value: 2, fill: '#64748b' }
        ];
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/analytics/participation', auth, async (req, res) => {
    try {
        let classes;
        if (req.user.role === 'professor') {
            classes = await Class.find({ professor: req.user.id });
        } else {
            classes = await Class.find({ students: req.user.id });
        }

        const studentId = new mongoose.Types.ObjectId(req.user.id);

        const participationData = await Promise.all(classes.map(async (cls) => {
            const label = cls.subjectName || cls.name;
            try {
                const totalClasses = await Attendance.countDocuments({ classId: cls._id });
                if (totalClasses === 0) return { name: label, totalClasses: 0, attended: 0, missed: 0 };

                if (req.user.role === 'professor') {
                    // Professor: total possible attendance slots vs present slots
                    const allAttendance = await Attendance.find({ classId: cls._id });
                    const totalPossible = allAttendance.length * cls.students.length;
                    const totalPresent = allAttendance.reduce((acc, curr) =>
                        acc + curr.records.filter(r => r.status === 'present').length, 0);
                    const missed = totalPossible - totalPresent;
                    return { name: label, totalClasses: totalPossible, attended: totalPresent, missed };
                } else {
                    // Student: use $elemMatch so BOTH student and status apply to the SAME record
                    const attended = await Attendance.countDocuments({
                        classId: cls._id,
                        records: {
                            $elemMatch: {
                                student: studentId,
                                status: 'present'
                            }
                        }
                    });
                    const missed = totalClasses - attended;
                    return { name: label, totalClasses, attended, missed };
                }
            } catch (innerErr) {
                console.error(`Participation error for class ${cls.name}:`, innerErr);
                return { name: label, totalClasses: 0, attended: 0, missed: 0 };
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
            const allStudents = classes.reduce((acc, curr) => acc.concat(curr.students), []);
            const uniqueStudentsCount = new Set(allStudents.map(s => s.toString())).size;

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
            const classes = await Class.find({ students: req.user.id });
            const classIds = classes.map(c => c._id);

            const attendanceCurrent = await Attendance.find({ classId: { $in: classIds }, date: { $gte: last7Days } });
            const attendancePrev = await Attendance.find({ classId: { $in: classIds }, date: { $gte: prev7Days, $lt: last7Days } });

            const calcStudentStats = (records) => {
                const myRecords = records.filter(r => r.records.some(rec => rec.student.toString() === req.user.id));
                const presentCount = myRecords.filter(r => r.records.find(rec => rec.student.toString() === req.user.id && rec.status === 'present')).length;
                return presentCount;
            };

            const currentCount = calcStudentStats(attendanceCurrent);
            const prevCount = calcStudentStats(attendancePrev);
            const trend = currentCount - prevCount;

            // Calculate overall percentage for the progress bar (Strictly using total classes happened)
            const totalClassHappened = await Attendance.countDocuments({ classId: { $in: classIds } });
            const presentMySessions = await Attendance.countDocuments({ classId: { $in: classIds }, "records.student": req.user.id, "records.status": "present" });
            const globalRate = totalClassHappened === 0 ? 0 : Math.round((presentMySessions / totalClassHappened) * 100);

            // Calculate classes needed to reach 75%
            // (Present + x) / (Total + x) >= 0.75 => x >= (0.75 * Total - Present) / 0.25
            let message = "You're in the safe zone!";
            if (globalRate < 75) {
                const x = Math.ceil((0.75 * totalClassHappened - presentMySessions) / 0.25);
                message = `You need to attend ${x} more classes to stay above 75%.`;
            }

            res.json({
                primaryStat: globalRate,
                avgAttendance: globalRate,
                trend: trend,
                statusMessage: message
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// --- CLASS ACTIONS ---

// Create Class (Prof)
router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Access denied' });

    const { name, code, subjectName } = req.body;
    try {
        let newClass = new Class({
            name,
            subjectName: subjectName || name,
            code,
            professor: req.user.id,
            institutionId: req.user.institutionId
        });
        await newClass.save();
        await logAction('CREATE_CLASS', req.user, newClass.name, { code, subjectName: newClass.subjectName });
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

        res.json({ msg: 'Joined successfully' });
    } catch (err) {
        res.status(500).send('Server Error: ' + err.message);
    }
});

// Leave Class (Student)
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const classroom = await Class.findById(req.params.id);
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        // Remove student from array
        classroom.students = classroom.students.filter(id => id.toString() !== req.user.id);
        await classroom.save();

        await logAction('LEAVE_CLASS', req.user, classroom.name);
        res.json({ msg: 'Left class successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete Class (Professor)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'professor') return res.status(403).json({ msg: 'Access denied' });

    try {
        const classroom = await Class.findById(req.params.id);
        if (!classroom) return res.status(404).json({ msg: 'Class not found' });

        if (classroom.professor.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        // Delete associated attendance records
        await Attendance.deleteMany({ classId: req.params.id });

        // Delete the class
        await Class.findByIdAndDelete(req.params.id);

        await logAction('DELETE_CLASS', req.user, classroom.name);
        res.json({ msg: 'Class deleted successfully' });
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
