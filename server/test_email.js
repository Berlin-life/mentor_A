require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Using user:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendTestOTP = async () => {
    try {
        const mailOptions = {
            from: `"MentorMatch" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Test Email',
            text: 'This is a test email'
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: " + info.response);
    } catch (err) {
        console.error("Failed to send email:");
        console.error(err);
    }
};

sendTestOTP();
