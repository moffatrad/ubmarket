const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateListing } = require('../middleware/validation');
const { handleUpload } = require('../middleware/upload');
const listingController = require('../controllers/listingController');

// Public routes (some require authentication)
router.get('/', listingController.getListings);
router.get('/featured', listingController.getFeaturedListings);
router.get('/counts', listingController.getCategoryCounts);
router.get('/:id', listingController.getListing);

// Protected routes
router.post('/', authenticate, handleUpload, validateListing, listingController.createListing);
router.put('/:id', authenticate, listingController.updateListing);
router.delete('/:id', authenticate, listingController.deleteListing);
router.get('/user/me', authenticate, listingController.getUserListings);
router.post('/:id/renew', authenticate, listingController.renewListing);
router.post('/:id/sold', authenticate, listingController.markAsSold);
router.post('/:id/feature', authenticate, listingController.featureListing);

// Admin routes
router.post('/expire/process', authenticate, requireAdmin, listingController.processExpiredListings);

module.exports = router;