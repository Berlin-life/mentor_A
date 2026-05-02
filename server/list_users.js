const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const findUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email role isVerified otp').limit(10);
        console.log('Existing Users:');
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

findUsers();
