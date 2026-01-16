import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send OTP to user's email
 * @param {string} email - User's email address
 * @param {string} otp - One-time password (6-digit number)
 * @returns {Promise}
 */
export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'BookAPI - Email Verification OTP',
    html: `
      <h2>Email Verification</h2>
      <p>Welcome to BookAPI!</p>
      <p>Your One-Time Password (OTP) for email verification is:</p>
      <h1 style="color: #007bff; letter-spacing: 2px;">${otp}</h1>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        BookAPI - Secure Book Management System
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'OTP sent successfully.' };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

/**
 * Send approval confirmation email to user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @returns {Promise}
 */
export const sendApprovalEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'BookAPI - Account Approved',
    html: `
      <h2>Account Approved!</h2>
      <p>Hi ${username},</p>
      <p>Great news! Your account has been approved by an admin/manager.</p>
      <p>You can now log in to BookAPI using your credentials.</p>
      <p><strong>Login URL:</strong> http://localhost:3000/api/auth/login</p>
      <p>Thank you for joining BookAPI!</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        BookAPI - Secure Book Management System
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Approval email sent successfully.' };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw new Error('Failed to send approval email.');
  }
};

/**
 * Send rejection email to user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 * @param {string} reason - Rejection reason (optional)
 * @returns {Promise}
 */
export const sendRejectionEmail = async (email, username, reason = 'Your account was rejected by an admin.') => {
  const mailOptions = {
    from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
    to: email,
    subject: 'BookAPI - Account Status Update',
    html: `
      <h2>Account Status Update</h2>
      <p>Hi ${username},</p>
      <p>${reason}</p>
      <p>If you believe this is a mistake, please contact support.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        BookAPI - Secure Book Management System
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Notification email sent.' };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw new Error('Failed to send notification email.');
  }
};
