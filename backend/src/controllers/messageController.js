const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendNewMessageNotification } = require('../services/emailService');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, listingId, body } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(parseInt(listingId));
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if receiver exists
    const receiver = await User.findById(parseInt(receiverId));
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create message
    const message = await Message.create({
      senderId: req.userId,
      receiverId: parseInt(receiverId),
      listingId: parseInt(listingId),
      body
    });

    // Get sender info for notification
    const sender = await User.findById(req.userId);

    // Send email notification
    await sendNewMessageNotification(
      receiver.email,
      receiver.name,
      sender.name,
      listing.title
    );

    // Get the full message with sender info
    const fullMessage = await sql`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ${message.id}
    `;

    res.status(201).json({
      message: 'Message sent successfully',
      data: fullMessage[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get inbox
const getInbox = async (req, res) => {
  try {
    const inbox = await Message.getInbox(req.userId);
    const unreadCount = await Message.getUnreadCount(req.userId);

    res.json({
      inbox,
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ message: 'Failed to fetch inbox' });
  }
};

// Get conversation
const getConversation = async (req, res) => {
  try {
    const { userId, listingId } = req.params;

    const messages = await Message.getConversation(
      req.userId,
      parseInt(userId),
      parseInt(listingId)
    );

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(m => m.receiver_id === req.userId && !m.is_read)
      .map(m => m.id);

    if (unreadMessageIds.length > 0) {
      await Message.markAsRead(unreadMessageIds, req.userId);
    }

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({ message: 'No message IDs provided' });
    }

    const updated = await Message.markAsRead(messageIds, req.userId);

    res.json({
      message: 'Messages marked as read',
      updated_count: updated.length
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.userId);
    res.json({ unread_count: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Message.delete(parseInt(id), req.userId);

    if (!result) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

module.exports = {
  sendMessage,
  getInbox,
  getConversation,
  markAsRead,
  getUnreadCount,
  deleteMessage
};