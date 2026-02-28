const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const fs = require('fs');
const path = require('path');
const { sendWelcomeEmail } = require('../utils/email.js');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role, rollNo, key, institutionId } = req.body;

    // Simple Professor Key Check (Demo)
    if (role === 'professor' && key !== 'admin123') {
        return res.status(403).json({ msg: 'Invalid Professor Key' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Default Institution Handling
        let finalInstitutionId = institutionId;
        if (!finalInstitutionId) {
            const Institution = require('../models/Institution.js');
            const defaultInst = await Institution.findOne({ code: 'DEFAULT' });
            if (defaultInst) finalInstitutionId = defaultInst._id;
        }

        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            rollNo,
            institutionId: finalInstitutionId
        });

        await user.save();

        const payload = { user: { id: user.id, role: user.role, institutionId: user.institutionId } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role, institutionId: user.institutionId } });
        });

        // Send welcome email async (don't block response)
        sendWelcomeEmail({ to: email, name, role }).catch(e => console.error('Welcome email error:', e.message));

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: user.role, institutionId: user.institutionId } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role, institutionId: user.institutionId } });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get User (Projected)
router.get('/me', async (req, res) => {
    // Middleware would usually handle this, but for speed simplified
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password').populate('institutionId', 'name');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

// Google Login
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { name, email, sub } = ticket.getPayload(); // sub is googleId

        let user = await User.findOne({ email });

        if (user) {
            // Link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = sub;
                await user.save();
            }
        } else {
            // New Google user — assign default institution
            const Institution = require('../models/Institution.js');
            const defaultInst = await Institution.findOne({ code: 'DEFAULT' });

            user = new User({
                name,
                email,
                password: 'google_login_no_password', // placeholder — Google users login via token
                googleId: sub,
                role: 'student', // Default role for new Google sign-ups
                institutionId: defaultInst ? defaultInst._id : undefined
            });
            await user.save();
        }

        const payload = { user: { id: user.id, role: user.role, institutionId: user.institutionId } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, jwtToken) => {
            if (err) throw err;
            res.json({
                token: jwtToken,
                user: { id: user.id, name: user.name, role: user.role, institutionId: user.institutionId }
            });
        });

        // Send welcome email for new Google sign-ups only
        if (!user.googleId || user.isNew) {
            sendWelcomeEmail({ to: email, name, role: user.role }).catch(e => console.error('Google welcome email error:', e.message));
        }

    } catch (err) {
        console.error('Google Auth Error:', err.message);
        res.status(500).json({ msg: 'Google authentication failed. Please try again.' });
    }
});

module.exports = router;
