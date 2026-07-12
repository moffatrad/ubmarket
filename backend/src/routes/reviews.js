const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');
const reviewController = require('../controllers/reviewController');

// Public routes
router.get('/user/:userId', reviewController.getReviewsForUser);
router.get('/listing/:listingId', reviewController.getReviewsForListing);

// Protected routes
router.use(authenticate);
router.post('/', validateReview, reviewController.createReview);
router.get('/my/reviews', reviewController.getMyReviews);
router.delete('/:id', reviewController.deleteReview);

module.exports = router;