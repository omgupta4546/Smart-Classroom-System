import mongoose from 'mongoose';
import User from './server/models/User.js';
import Institution from './server/models/Institution.js';
import Class from './server/models/Class.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const init = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create Default Institution
        let defaultInst = await Institution.findOne({ code: 'DEFAULT' });
        if (!defaultInst) {
            defaultInst = new Institution({
                name: 'Default University',
                code: 'DEFAULT',
                address: 'System Generated'
            });
            await defaultInst.save();
            console.log('Default Institution Created:', defaultInst.name);
        } else {
            console.log('Default Institution Exists:', defaultInst.name);
        }

        // 2. Create/Update Super Admin
        const superAdminEmail = 'superadmin@system.com';
        let superAdmin = await User.findOne({ email: superAdminEmail });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('superadmin123', salt);

        if (!superAdmin) {
            superAdmin = new User({
                name: 'Super Admin',
                email: superAdminEmail,
                password: hashedPassword,
                role: 'super_admin',
                institutionId: defaultInst._id
            });
            await superAdmin.save();
            console.log('Super Admin Created: superadmin@system.com / superadmin123');
        } else {
            superAdmin.role = 'super_admin';
            superAdmin.password = hashedPassword;
            superAdmin.institutionId = defaultInst._id;
            await superAdmin.save();
            console.log('Super Admin Updated');
        }

        // 3. Migrate Existing Users (Backfill)
        const resultUsers = await User.updateMany(
            { institutionId: null },
            { $set: { institutionId: defaultInst._id } }
        );
        console.log(`Migrated ${resultUsers.modifiedCount} users to Default Institution.`);

        // 4. Migrate Existing Classes (Backfill)
        const resultClasses = await Class.updateMany(
            { institutionId: { $exists: false } },
            { $set: { institutionId: defaultInst._id } }
        );
        console.log(`Migrated ${resultClasses.modifiedCount} classes to Default Institution.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

init();
