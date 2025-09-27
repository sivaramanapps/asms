const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';

// Hash password
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    fullName: user.full_name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Get user with company roles
const getUserWithRoles = async (userId) => {
  const query = `
    SELECT 
      u.id, u.email, u.full_name, u.phone, u.language_preference,
      u.is_active, u.last_login_at,
      json_agg(
        json_build_object(
          'companyId', c.id,
          'companyName', c.display_name,
          'role', ucr.role,
          'permissions', ucr.permissions,
          'isActive', ucr.is_active
        )
      ) as companies
    FROM users u
    LEFT JOIN user_company_roles ucr ON u.id = ucr.user_id AND ucr.is_active = true
    LEFT JOIN companies c ON ucr.company_id = c.id AND c.status = 'active'
    WHERE u.id = $1 AND u.is_active = true
    GROUP BY u.id
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
};

// Authenticate user (login)
const authenticateUser = async (email, password) => {
  try {
    // Get user by email
    const userQuery = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    const updateLoginQuery = 'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(updateLoginQuery, [user.id]);

    // Get user with roles
    const userWithRoles = await getUserWithRoles(user.id);

    // Generate tokens
    const tokens = generateTokens(user);

    return {
      user: userWithRoles,
      ...tokens
    };

  } catch (error) {
    throw error;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyToken,
  getUserWithRoles,
  authenticateUser
};