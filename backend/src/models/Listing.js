const sql = require('../config/database');

class Listing {
  // Create a new listing
  static async create(listingData) {
    const {
      userId, category, title, description, price, 
      condition, courseCode, author, edition
    } = listingData;

    const result = await sql`
      INSERT INTO listings (
        user_id, category, title, description, price,
        condition, course_code, author, edition,
        status, created_at, expires_at
      )
      VALUES (
        ${userId}, ${category}, ${title}, ${description}, ${price},
        ${condition || null}, ${courseCode || null}, 
        ${author || null}, ${edition || null},
        'active', NOW(), NOW() + INTERVAL '30 days'
      )
      RETURNING *
    `;

    return result[0];
  }

  // Save listing images
  static async saveImages(listingId, imagePaths) {
    const results = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const result = await sql`
        INSERT INTO listing_images (listing_id, image_path, is_primary)
        VALUES (${listingId}, ${imagePaths[i]}, ${i === 0})
        RETURNING id, image_path, is_primary
      `;
      results.push(result[0]);
    }
    return results;
  }

  // Find listing by ID with images
  static async findById(id) {
    const listing = await sql`
      SELECT 
        l.*,
        u.id as user_id,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        u.email as seller_email,
        COALESCE(AVG(r.rating), 0) as seller_rating,
        COUNT(DISTINCT r.id) as seller_review_count
      FROM listings l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      WHERE l.id = ${id}
      GROUP BY l.id, u.id
    `;

    if (!listing || listing.length === 0) return null;

    // Get images
    const images = await sql`
      SELECT image_path, is_primary 
      FROM listing_images 
      WHERE listing_id = ${id}
      ORDER BY is_primary DESC, id ASC
    `;

    // Get category-specific details
    let details = null;
    if (listing[0].category === 'room') {
      details = await sql`
        SELECT * FROM rooms WHERE listing_id = ${id}
      `;
    } else if (listing[0].category === 'tutor') {
      details = await sql`
        SELECT * FROM tutors WHERE listing_id = ${id}
      `;
    }

    return {
      ...listing[0],
      images: images || [],
      details: details ? details[0] : null
    };
  }

  // Get listings with filters
  static async find(filters = {}) {
    let query = sql`
      SELECT 
        l.*,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        COALESCE(AVG(r.rating), 0) as seller_rating
      FROM listings l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      WHERE l.status = 'active'
    `;

    const conditions = [];
    const params = [];

    if (filters.category) {
      conditions.push(`l.category = $${params.length + 1}`);
      params.push(filters.category);
    }

    if (filters.search) {
      conditions.push(`(l.title ILIKE $${params.length + 1} OR l.description ILIKE $${params.length + 1})`);
      params.push(`%${filters.search}%`);
    }

    if (filters.minPrice) {
      conditions.push(`l.price >= $${params.length + 1}`);
      params.push(parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      conditions.push(`l.price <= $${params.length + 1}`);
      params.push(parseFloat(filters.maxPrice));
    }

    if (filters.courseCode) {
      conditions.push(`l.course_code ILIKE $${params.length + 1}`);
      params.push(`%${filters.courseCode}%`);
    }

    if (conditions.length > 0) {
      query = sql`
        ${query}
        AND ${sql.join(conditions, ' AND ')}
      `;
    }

    // Add grouping for ratings
    query = sql`
      ${query}
      GROUP BY l.id, u.id
    `;

    // Sorting
    const orderBy = filters.sortBy || 'created_at';
    const orderDir = filters.sortDir || 'DESC';
    query = sql`
      ${query}
      ORDER BY l.is_featured DESC, l.${sql(orderBy)} ${sql(orderDir)}
    `;

    // Pagination
    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;
    query = sql`
      ${query}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return await query;
  }

  // Update listing
  static async update(id, userId, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.description) {
      fields.push(`description = $${idx++}`);
      values.push(updates.description);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${idx++}`);
      values.push(updates.price);
    }
    if (updates.status) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.condition) {
      fields.push(`condition = $${idx++}`);
      values.push(updates.condition);
    }

    if (fields.length === 0) return null;

    values.push(id);
    values.push(userId);
    const query = `
      UPDATE listings 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx++} AND user_id = $${idx}
      RETURNING *
    `;

    const result = await sql.query(query, values);
    return result[0] || null;
  }

  // Delete listing
  static async delete(id, userId) {
    const result = await sql`
      DELETE FROM listings 
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;
    return result[0] || null;
  }

  // Get user's listings
  static async findByUser(userId) {
    return await sql`
      SELECT * FROM listings 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
  }

  // Get featured listings
  static async getFeatured(limit = 10) {
    return await sql`
      SELECT 
        l.*,
        u.name as seller_name,
        u.avatar_url as seller_avatar
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active' AND l.is_featured = true
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `;
  }

  // Count listings by category
  static async countByCategory() {
    return await sql`
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM listings
      GROUP BY category
    `;
  }

  // Mark expired listings
  static async markExpired() {
    return await sql`
      UPDATE listings
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active' AND expires_at < NOW()
      RETURNING id, title, user_id
    `;
  }
}

module.exports = Listing;