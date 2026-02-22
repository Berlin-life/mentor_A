const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"MentorMatch" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your MentorMatch Verification Code',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 1.8rem;">🎓 MentorMatch</h1>
                    <p style="color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 0.9rem;">Email Verification</p>
                </div>
                <div style="padding: 32px 24px; text-align: center;">
                    <p style="font-size: 1rem; margin-bottom: 24px;">Your verification code is:</p>
                    <div style="background: #1e293b; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; display: inline-block;">
                        <span style="font-size: 2.5rem; letter-spacing: 12px; font-weight: 700; color: #60a5fa;">${otp}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 24px;">This code expires in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 0.8rem; color: #64748b; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
                </div>
                <div style="background: #1e293b; padding: 16px 24px; text-align: center;">
                    <p style="font-size: 0.75rem; color: #64748b; margin: 0;">© ${new Date().getFullYear()} MentorMatch. All rights reserved.</p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
