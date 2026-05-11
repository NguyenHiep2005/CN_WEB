const nodemailer = require('nodemailer');
require('dotenv').config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const ForgotPassword = async (email, otp) => {
    try {
        // Simple Gmail setup with App Password
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
        });

        const info = await transport.sendMail({
            from: `"GLAB" <${EMAIL_USER}>`,
            to: email,
            subject: '🔐 Khôi phục mật khẩu - GLAB',
            html: `
                <div style="max-width: 500px; margin: auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
                    <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0px 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; text-align: center;">Khôi phục mật khẩu</h2>
                        <p style="color: #555; font-size: 16px;">Xin chào,</p>
                        <p style="color: #555; font-size: 16px;">Bạn vừa yêu cầu đặt lại mật khẩu. Dưới đây là mã OTP của bạn (có hiệu lực trong 15 phút):</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #d63384; background: #ffe8f0; padding: 15px 30px; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
                        </div>
                        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                        <p>© 2025 GLAB. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        
        console.log('✅ Email sent successfully to:', email);
        return { success: true, message: 'Email sent' };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw new Error('Không thể gửi email: ' + error.message);
    }
};

module.exports = ForgotPassword;
