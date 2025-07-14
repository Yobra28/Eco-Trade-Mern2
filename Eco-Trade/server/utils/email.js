const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Use 587 for TLS
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Use an App Password if 2FA is enabled
  },
});

async function sendEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
    text,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail }; 