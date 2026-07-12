const User = require('../models/User');
const Listing = require('../models/Listing');
const sql = require('../config/database');

// Get dashboard stats
const getStats = async (req, res) => {
  try {
    const userCount = await User.count();
    
    const listingStats = await sql`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_listings
      FROM listings
    `;

    const categoryCounts = await Listing.countByCategory();

    const messageCount = await sql`
      SELECT COUNT(*) as total_messages FROM messages
    `;

    const reviewCount = await sql`
      SELECT COUNT(*) as total_reviews FROM reviews
    `;

    res.json({
      users: {
        total: parseInt(userCount),
        // Would need additional query for verified count
      },
      listings: {
        total: parseInt(listingStats[0].total_listings),
        active: parseInt(listingStats[0].active_listings),
        sold: parseInt(listingStats[0].sold_listings),
        expired: parseInt(listingStats[0].expired_listings),
        by_category: categoryCounts
      },
      messages: {
        total: parseInt(messageCount[0].total_messages)
      },
      reviews: {
        total: parseInt(reviewCount[0].total_reviews)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get all users (with pagination)
const getUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const users = await User.findAll(limit, offset);
    const total = await User.count();

    res.json({
      users,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Suspend user
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE users 
      SET role = 'suspended', updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, name, email, role
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also deactivate all their listings
    await sql`
      UPDATE listings 
      SET status = 'expired', updated_at = NOW()
      WHERE user_id = ${parseInt(id)} AND status = 'active'
    `;

    res.json({
      message: 'User suspended successfully',
      user: result[0]
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Failed to suspend user' });
  }
};

// Unsuspend user
const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE users 
      SET role = 'student', updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, name, email, role
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User unsuspended successfully',
      user: result[0]
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ message: 'Failed to unsuspend user' });
  }
};

// Delete listing (admin)
const adminDeleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM listings 
      WHERE id = ${parseInt(id)}
      RETURNING id, title
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({
      message: 'Listing deleted successfully',
      listing: result[0]
    });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
};

// Get reported listings
const getReportedListings = async (req, res) => {
  try {
    // Note: In a real implementation, you'd have a reports table
    // For now, we'll just show all listings with potential issues
    const listings = await sql`
      SELECT 
        l.*,
        u.name as user_name,
        u.email as user_email,
        COUNT(m.id) as message_count
      FROM listings l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN messages m ON m.listing_id = l.id
      WHERE l.status = 'active'
      GROUP BY l.id, u.id
      HAVING COUNT(m.id) > 0
      ORDER BY l.created_at DESC
      LIMIT 20
    `;

    res.json(listings);
  } catch (error) {
    console.error('Get reported listings error:', error);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
};

// Verify a user (admin)
const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      UPDATE users 
      SET is_verified = true, updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING id, name, email, is_verified
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User verified successfully',
      user: result[0]
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Failed to verify user' });
  }
};

module.exports = {
  getStats,
  getUsers,
  suspendUser,
  unsuspendUser,
  adminDeleteListing,
  getReportedListings,
  verifyUser
};