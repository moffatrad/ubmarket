const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const messageController = require('../controllers/messageController');

router.use(authenticate);

router.get('/inbox', messageController.getInbox);
router.get('/unread', messageController.getUnreadCount);
router.get('/conversation/:userId/:listingId', messageController.getConversation);
router.post('/', validateMessage, messageController.sendMessage);
router.put('/read', messageController.markAsRead);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;