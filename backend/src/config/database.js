const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config();

let sql;

// Create connection pool
try {
  sql = postgres(process.env.DATABASE_URL, {
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Max connections in pool
    idle_timeout: 20, // Idle timeout in seconds
    connect_timeout: 10
  });
  console.log('✅ Database connected successfully');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}

module.exports = sql;