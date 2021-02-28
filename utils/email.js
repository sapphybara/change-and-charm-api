const nodemailer = require('nodemailer');

/**
 * send an email with nodemailer
 * @param options object containing info necessary to send email
 * @returns {Promise<void>}
 */
const sendEmail = async (options) => {
  // 1. create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. define email options
  const mailOptions = {
    from: 'Change & Charm <c&c@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3. send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
