const { Pool } = require('pg');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'asms_db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // Retry settings
  retryDelayMs: 2000
};

console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

const pool = new Pool(dbConfig);

// Connection retry logic
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Database connected successfully');
      client.release();
      return true;
    } catch (err) {
      console.log(`❌ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('🚨 Database connection failed after all retries');
        return false;
      }
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Test database connection with retry
const testConnection = async () => {
  return await connectWithRetry();
};

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

module.exports = {
  pool,
  testConnection,
  connectWithRetry
};