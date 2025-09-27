const express = require('express');
const { authenticateUser, hashPassword } = require('../auth');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../database');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate user
    const result = await authenticateUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// Logout endpoint (client-side mainly, but we can blacklist tokens later)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // For now, just return success (client should delete tokens)
    // In production, you might want to blacklist the token
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Change password endpoint
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user's password hash
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [req.user.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(updateQuery, [newPasswordHash, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;