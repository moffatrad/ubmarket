const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email verification
const sendVerificationEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"UBMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your UBMarket Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; text-align: center;">Welcome to UBMarket!</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333;">
          Thank you for registering on UBMarket, the University of Botswana's student marketplace.
        </p>
        <p style="font-size: 16px; color: #333;">
          Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #3182ce; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          If you didn't create an account on UBMarket, you can safely ignore this email.
        </p>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} UBMarket. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Verification email sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"UBMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your UBMarket Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; text-align: center;">Reset Password</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333;">
          We received a request to reset your UBMarket password.
          Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #3182ce; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} UBMarket. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send new message notification
const sendNewMessageNotification = async (email, name, senderName, listingTitle) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const mailOptions = {
    from: `"UBMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'New Message on UBMarket',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; text-align: center;">New Message</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333;">
          ${senderName} has sent you a message regarding your listing:
          <strong>"${listingTitle}"</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/inbox" 
             style="background-color: #3182ce; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Message
          </a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} UBMarket. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 New message notification sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

// Send listing expiry notification
const sendExpiryNotification = async (email, name, listingTitle) => {
  const frontendUrl = process.env.FRONTEND_URL;

  const mailOptions = {
    from: `"UBMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your UBMarket Listing is About to Expire',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d; text-align: center;">Listing Expiring Soon</h1>
        <p style="font-size: 16px; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; color: #333;">
          Your listing "<strong>${listingTitle}</strong>" will expire in 3 days.
        </p>
        <p style="font-size: 16px; color: #333;">
          Log in to renew it and keep it visible to students.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/dashboard" 
             style="background-color: #3182ce; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
          &copy; ${new Date().getFullYear()} UBMarket. All rights reserved.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Expiry notification sent to ${email}`);
  } catch (error) {
    console.error('Email send error:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNewMessageNotification,
  sendExpiryNotification
};