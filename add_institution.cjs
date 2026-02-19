const mongoose = require('mongoose');
const Institution = require('./server/models/Institution.js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const addInstitution = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const instData = {
            name: 'Rajasthan Technical University',
            code: 'RTU',
            address: 'Kota, Rajasthan'
        };

        let inst = await Institution.findOne({ code: instData.code });

        if (inst) {
            console.log(`Institution ${instData.name} (${instData.code}) already exists.`);
        } else {
            inst = new Institution(instData);
            await inst.save();
            console.log(`Successfully added: ${inst.name}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error adding institution:', err);
        process.exit(1);
    }
};

addInstitution();
