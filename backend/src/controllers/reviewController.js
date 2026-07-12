const Review = require('../models/Review');
const Listing = require('../models/Listing');
const User = require('../models/User');

// Create review
const createReview = async (req, res) => {
  try {
    const { revieweeId, listingId, rating, comment } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(parseInt(listingId));
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if reviewer is not reviewee
    if (req.userId === parseInt(revieweeId)) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    // Check if reviewee exists
    const reviewee = await User.findById(parseInt(revieweeId));
    if (!reviewee) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const review = await Review.create({
      reviewerId: req.userId,
      revieweeId: parseInt(revieweeId),
      listingId: parseInt(listingId),
      rating: parseInt(rating),
      comment
    });

    // Get full review with reviewer info
    const fullReview = await sql`
      SELECT 
        r.*,
        u.name as reviewer_name,
        u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = ${review.id}
    `;

    res.status(201).json({
      message: 'Review submitted successfully',
      review: fullReview[0]
    });
  } catch (error) {
    if (error.message === 'You have already reviewed this transaction') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

// Get reviews for a user
const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.getForUser(parseInt(userId));
    const average = await Review.getAverageRating(parseInt(userId));

    res.json({
      reviews,
      average_rating: parseFloat(average.avg_rating),
      review_count: parseInt(average.review_count)
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Get reviews for a listing
const getReviewsForListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const reviews = await Review.getForListing(parseInt(listingId));

    // Calculate average
    let avgRating = 0;
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      avgRating = total / reviews.length;
    }

    res.json({
      reviews,
      average_rating: parseFloat(avgRating),
      review_count: reviews.length
    });
  } catch (error) {
    console.error('Get listing reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Get current user's reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.getForUser(req.userId);
    const average = await Review.getAverageRating(req.userId);

    res.json({
      reviews,
      average_rating: parseFloat(average.avg_rating),
      review_count: parseInt(average.review_count)
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Review.delete(parseInt(id), req.userId);

    if (!result) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForListing,
  getMyReviews,
  deleteReview
};