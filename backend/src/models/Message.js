const sql = require('../config/database');

class Message {
  // Send a message
  static async create(messageData) {
    const { senderId, receiverId, listingId, body } = messageData;

    const result = await sql`
      INSERT INTO messages (sender_id, receiver_id, listing_id, body)
      VALUES (${senderId}, ${receiverId}, ${listingId}, ${body})
      RETURNING *
    `;

    return result[0];
  }

  // Get conversation between two users for a listing
  static async getConversation(userId1, userId2, listingId) {
    return await sql`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (
        (m.sender_id = ${userId1} AND m.receiver_id = ${userId2}) OR
        (m.sender_id = ${userId2} AND m.receiver_id = ${userId1})
      ) AND m.listing_id = ${listingId}
      ORDER BY m.sent_at ASC
    `;
  }

  // Get user's inbox (conversations grouped by listing)
  static async getInbox(userId) {
    return await sql`
      SELECT 
        m.listing_id,
        l.title as listing_title,
        l.category as listing_category,
        MAX(CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END) as other_user_id,
        MAX(CASE WHEN m.sender_id != ${userId} THEN u.name END) as other_user_name,
        MAX(CASE WHEN m.sender_id != ${userId} THEN u.avatar_url END) as other_user_avatar,
        COUNT(CASE WHEN m.receiver_id = ${userId} AND m.is_read = false THEN 1 END) as unread_count,
        MAX(m.sent_at) as last_message_at,
        MAX(m.body) as last_message_body
      FROM messages m
      JOIN listings l ON m.listing_id = l.id
      JOIN users u ON (CASE WHEN m.sender_id != ${userId} THEN m.sender_id ELSE m.receiver_id END) = u.id
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
      GROUP BY m.listing_id, l.title, l.category
      ORDER BY last_message_at DESC
    `;
  }

  // Mark messages as read
  static async markAsRead(messageIds, userId) {
    if (!messageIds || messageIds.length === 0) return [];

    const result = await sql`
      UPDATE messages
      SET is_read = true
      WHERE id = ANY(${messageIds}) AND receiver_id = ${userId}
      RETURNING id
    `;
    return result;
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    const result = await sql`
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE receiver_id = ${userId} AND is_read = false
    `;
    return parseInt(result[0].unread_count);
  }

  // Delete message
  static async delete(messageId, userId) {
    const result = await sql`
      DELETE FROM messages 
      WHERE id = ${messageId} AND (sender_id = ${userId} OR receiver_id = ${userId})
      RETURNING id
    `;
    return result[0] || null;
  }
}

module.exports = Message;