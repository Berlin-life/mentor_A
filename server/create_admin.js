const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createVerifyAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'antigravity_admin@test.com';
        const password = 'password123';

        // Remove existing if any
        await User.deleteMany({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new User({
            name: 'Antigravity Admin',
            email,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });

        await admin.save();
        console.log('Admin user created successfully:');
        console.log('Email:', email);
        console.log('Password:', password);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createVerifyAdmin();
