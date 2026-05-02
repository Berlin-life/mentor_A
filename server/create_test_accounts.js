const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createTestAccounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const accounts = [
            {
                name: 'Test Mentor',
                email: 'test_mentor@test.com',
                password: hashedPassword,
                role: 'mentor',
                isVerified: true,
                skills: ['JavaScript', 'React', 'Node.js'],
                bio: 'Passionate about web development and teaching.',
                title: 'Senior Developer',
                company: 'Tech Solutions',
                availabilitySlots: [{ day: 'Monday', startTime: '09:00', endTime: '17:00' }]
            },
            {
                name: 'Test Student',
                email: 'test_student@test.com',
                password: hashedPassword,
                role: 'mentee',
                isVerified: true,
                interests: ['JavaScript', 'Frontend Dev']
            }
        ];

        for (const account of accounts) {
            await User.deleteMany({ email: account.email });
            const user = new User(account);
            await user.save();
            console.log(`Created ${account.role}: ${account.email}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

createTestAccounts();
