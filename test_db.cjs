const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config({ path: './server/.env' });

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri.split('@')[1]); // Log host part only for safety

async function testDNS() {
    try {
        const url = new URL(uri);
        const host = url.hostname;
        console.log(`Looking up SRV for: ${host}`);
        const records = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
        console.log('SRV Records found successfully!');
    } catch (err) {
        console.error('DNS Lookup Failed:', err.message);
    }
}

async function testConnection() {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1);
    }
}

testDNS().then(testConnection);
