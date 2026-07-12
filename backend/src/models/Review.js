const sql = require('../config/database');

class Review {
  // Create a review
  static async create(reviewData) {
    const { reviewerId, revieweeId, listingId, rating, comment } = reviewData;

    // Check if review already exists for this listing
    const existing = await sql`
      SELECT id FROM reviews 
      WHERE reviewer_id = ${reviewerId} AND listing_id = ${listingId}
    `;

    if (existing && existing.length > 0) {
      throw new Error('You have already reviewed this transaction');
    }

    const result = await sql`
      INSERT INTO reviews (reviewer_id, reviewee_id, listing_id, rating, comment)
      VALUES (${reviewerId}, ${revieweeId}, ${listingId}, ${rating}, ${comment})
      RETURNING *
    `;

    return result[0];
  }

  // Get reviews for a user
  static async getForUser(userId) {
    return await sql`
      SELECT 
        r.*,
        u.name as reviewer_name,
        u.avatar_url as reviewer_avatar,
        l.title as listing_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN listings l ON r.listing_id = l.id
      WHERE r.reviewee_id = ${userId}
      ORDER BY r.created_at DESC
    `;
  }

  // Get reviews for a listing
  static async getForListing(listingId) {
    return await sql`
      SELECT 
        r.*,
        u.name as reviewer_name,
        u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.listing_id = ${listingId}
      ORDER BY r.created_at DESC
    `;
  }

  // Get user's average rating
  static async getAverageRating(userId) {
    const result = await sql`
      SELECT 
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as review_count
      FROM reviews
      WHERE reviewee_id = ${userId}
    `;
    return result[0] || { avg_rating: 0, review_count: 0 };
  }

  // Delete a review
  static async delete(reviewId, userId) {
    const result = await sql`
      DELETE FROM reviews 
      WHERE id = ${reviewId} AND reviewer_id = ${userId}
      RETURNING id
    `;
    return result[0] || null;
  }
}

module.exports = Review;