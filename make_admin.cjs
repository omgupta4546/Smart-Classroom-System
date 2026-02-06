const mongoose = require('mongoose');
const User = require('./server/models/User.cjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.log('Usage: node make_admin.cjs <email>');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const user = await User.findOne({ email: emailToPromote });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        user.role = 'admin';
        await user.save();
        console.log(`User ${emailToPromote} promoted to admin successfully`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
