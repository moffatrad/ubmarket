const User = require('../models/User');
const { generateToken, comparePassword } = require('../config/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');
const sql = require('../config/database');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({ name, email, password, studentId });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store verification token
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${verificationToken}, NOW() + INTERVAL '24 hours')
    `;

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find verification token
    const verification = await sql`
      SELECT * FROM email_verifications 
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (!verification || verification.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user
    const user = await User.verifyEmail(verification[0].user_id);

    // Delete verification token
    await sql`
      DELETE FROM email_verifications WHERE token = ${token}
    `;

    res.json({ 
      message: 'Email verified successfully',
      user
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update verification token
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${verificationToken}, NOW() + INTERVAL '24 hours')
      ON CONFLICT (user_id) DO UPDATE 
      SET token = ${verificationToken}, expires_at = NOW() + INTERVAL '24 hours'
    `;

    await sendVerificationEmail(email, user.name, verificationToken);

    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    await sql`
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, NOW() + INTERVAL '1 hour')
    `;

    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send password reset email' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find reset token
    const reset = await sql`
      SELECT * FROM password_resets 
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (!reset || reset.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const { hashPassword } = require('../config/auth');
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${reset[0].user_id}
    `;

    // Delete reset token
    await sql`
      DELETE FROM password_resets WHERE token = ${token}
    `;

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.getUserWithRating(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const updates = { name, bio };

    // Handle avatar upload if present
    if (req.file) {
      updates.avatar_url = `/uploads/${req.file.filename}`;
    }

    const user = await User.update(req.userId, updates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile
};