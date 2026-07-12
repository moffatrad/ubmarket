const Listing = require('../models/Listing');
const { getUploadedPaths } = require('../middleware/upload');
const { sendExpiryNotification } = require('../services/emailService');
const User = require('../models/User');
const sql = require('../config/database');

// Create listing
const createListing = async (req, res) => {
  try {
    const {
      category, title, description, price,
      condition, courseCode, author, edition,
      location, bedrooms, furnished, availableFrom,
      subjects, ratePerHour, bio
    } = req.body;

    // Create main listing
    const listing = await Listing.create({
      userId: req.userId,
      category,
      title,
      description,
      price: parseFloat(price),
      condition,
      courseCode,
      author,
      edition
    });

    // Save images
    const imagePaths = getUploadedPaths(req);
    if (imagePaths.length > 0) {
      await Listing.saveImages(listing.id, imagePaths);
    }

    // Save category-specific details
    if (category === 'room') {
      await sql`
        INSERT INTO rooms (listing_id, location, bedrooms, furnished, available_from)
        VALUES (
          ${listing.id}, 
          ${location}, 
          ${parseInt(bedrooms) || 1}, 
          ${furnished === 'true' || furnished === true}, 
          ${availableFrom || null}
        )
      `;
    } else if (category === 'tutor') {
      const subjectsArray = Array.isArray(subjects) ? subjects : [subjects];
      await sql`
        INSERT INTO tutors (listing_id, user_id, subjects, rate_per_hour, bio, is_premium)
        VALUES (
          ${listing.id}, 
          ${req.userId}, 
          ${subjectsArray}, 
          ${parseFloat(ratePerHour) || 0}, 
          ${bio || ''}, 
          false
        )
      `;
    }

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Failed to create listing', error: error.message });
  }
};

// Get all listings
const getListings = async (req, res) => {
  try {
    const filters = req.query;
    const listings = await Listing.find(filters);
    
    res.json({
      listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

// Get single listing
const getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(parseInt(id));

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const listing = await Listing.update(parseInt(id), req.userId, updates);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    res.json({
      message: 'Listing updated successfully',
      listing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Failed to update listing' });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Listing.delete(parseInt(id), req.userId);

    if (!result) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

// Get user's listings
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.findByUser(req.userId);
    res.json(listings);
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ message: 'Failed to fetch user listings' });
  }
};

// Get featured listings
const getFeaturedListings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const listings = await Listing.getFeatured(limit);
    res.json(listings);
  } catch (error) {
    console.error('Get featured listings error:', error);
    res.status(500).json({ message: 'Failed to fetch featured listings' });
  }
};

// Get category counts
const getCategoryCounts = async (req, res) => {
  try {
    const counts = await Listing.countByCategory();
    res.json(counts);
  } catch (error) {
    console.error('Get category counts error:', error);
    res.status(500).json({ message: 'Failed to fetch category counts' });
  }
};

// Feature listing (admin/payment)
const featureListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body; // days

    // Check if listing exists and belongs to user
    const listing = await sql`
      SELECT * FROM listings WHERE id = ${parseInt(id)} AND user_id = ${req.userId}
    `;

    if (!listing || listing.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Update listing to featured
    await sql`
      UPDATE listings 
      SET is_featured = true, updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `;

    // Record featured payment
    await sql`
      INSERT INTO featured_listings (listing_id, paid_at, expires_at)
      VALUES (${parseInt(id)}, NOW(), NOW() + INTERVAL '${duration || 7} days')
    `;

    res.json({
      message: 'Listing featured successfully',
      listing_id: parseInt(id)
    });
  } catch (error) {
    console.error('Feature listing error:', error);
    res.status(500).json({ message: 'Failed to feature listing' });
  }
};

// Renew listing
const renewListing = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE listings 
      SET 
        status = 'active',
        expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
      WHERE id = ${parseInt(id)} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    res.json({
      message: 'Listing renewed successfully',
      listing: result[0]
    });
  } catch (error) {
    console.error('Renew listing error:', error);
    res.status(500).json({ message: 'Failed to renew listing' });
  }
};

// Mark as sold
const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE listings 
      SET status = 'sold', updated_at = NOW()
      WHERE id = ${parseInt(id)} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    res.json({
      message: 'Listing marked as sold',
      listing: result[0]
    });
  } catch (error) {
    console.error('Mark as sold error:', error);
    res.status(500).json({ message: 'Failed to mark listing as sold' });
  }
};

// Process expired listings (cron job)
const processExpiredListings = async (req, res) => {
  try {
    const expired = await Listing.markExpired();

    // Send notifications for expired listings
    for (const listing of expired) {
      const user = await User.findById(listing.user_id);
      if (user) {
        await sendExpiryNotification(user.email, user.name, listing.title);
      }
    }

    res.json({
      message: `Processed ${expired.length} expired listings`,
      expired_count: expired.length
    });
  } catch (error) {
    console.error('Process expired listings error:', error);
    res.status(500).json({ message: 'Failed to process expired listings' });
  }
};

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  getUserListings,
  getFeaturedListings,
  getCategoryCounts,
  featureListing,
  renewListing,
  markAsSold,
  processExpiredListings
};