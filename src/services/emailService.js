// Email service
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendPasswordResetEmail(email, resetLink) {
        const mailOptions = {
            from: 'noreply@example.com',
            to: email,
            subject: 'Password Reset Request',
            html: `<h2>Password Reset</h2><p>Click the link: <a href="${resetLink}">Reset</a></p>`
        };
        await this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
