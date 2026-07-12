const sql = require('../config/database');
const { hashPassword } = require('../config/auth');

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, studentId } = userData;
    
    const hashedPassword = await hashPassword(password);
    
    const result = await sql`
      INSERT INTO users (name, email, password, student_id)
      VALUES (${name}, ${email}, ${hashedPassword}, ${studentId})
      RETURNING id, name, email, student_id, role, is_verified, created_at
    `;
    
    return result[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await sql`
      SELECT id, name, email, student_id, role, is_verified, avatar_url, 
             created_at, updated_at
      FROM users WHERE id = ${id}
    `;
    return result[0] || null;
  }

  // Update user profile
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.avatar_url) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(updates.avatar_url);
    }
    if (updates.bio) {
      fields.push(`bio = $${idx++}`);
      values.push(updates.bio);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, name, email, student_id, role, is_verified, avatar_url, bio
    `;

    const result = await sql.query(query, values);
    return result[0] || null;
  }

  // Verify user email
  static async verifyEmail(email) {
    const result = await sql`
      UPDATE users 
      SET is_verified = true, updated_at = NOW()
      WHERE email = ${email}
      RETURNING id, name, email, role, is_verified
    `;
    return result[0] || null;
  }

  // Get user with rating
  static async getUserWithRating(userId) {
    const result = await sql`
      SELECT 
        u.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT l.id) as listing_count
      FROM users u
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      LEFT JOIN listings l ON l.user_id = u.id AND l.status = 'active'
      WHERE u.id = ${userId}
      GROUP BY u.id
    `;
    return result[0] || null;
  }

  // Get all users (admin)
  static async findAll(limit = 50, offset = 0) {
    return await sql`
      SELECT id, name, email, role, is_verified, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  // Get user count
  static async count() {
    const result = await sql`SELECT COUNT(*) as total FROM users`;
    return parseInt(result[0].total);
  }
}

module.exports = User;