const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow ALL origins for debugging
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for Base64 images

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('Attendance API Running');
});

// Import Routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
