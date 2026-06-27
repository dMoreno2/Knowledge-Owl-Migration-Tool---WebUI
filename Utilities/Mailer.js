module.exports = { sendResetEmail };

const nodemailer = require('nodemailer');
const fs = require('fs');

let configFile;
try {
    configFile = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (e) {
    console.error('Mailer: failed to load config.json:', e.message);
}

async function sendResetEmail(toEmail, resetLink) {
    const { host, port, user, password, from } = configFile.Email;
    const sender = from ? `"${from}" <${user}>` : `"No Reply" <${user}>`;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: password }
    });

    await transporter.sendMail({
        from: sender,
        to: toEmail,
        subject: 'Password Reset — Knowledge Owl Migration Tool',
        text: `You requested a password reset.\n\nReset your password here (link expires in 1 hour):\n${resetLink}\n\nIf you did not request this, ignore this email.`,
        html: `
            <p>You requested a password reset.</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request this, ignore this email.</p>
        `
    });
}
