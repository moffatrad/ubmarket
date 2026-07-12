const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Please provide a valid email')
    .matches(/@ub\.bw$/).withMessage('Only @ub.bw emails are allowed'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Listing validation
const validateListing = [
  body('category').isIn(['textbook', 'room', 'tutor', 'general']).withMessage('Invalid category'),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('condition').optional().isIn(['new', 'like-new', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  body('courseCode').optional().trim(),
  body('author').optional().trim(),
  body('edition').optional().trim(),
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('receiverId').isInt().withMessage('Invalid receiver ID'),
  body('listingId').isInt().withMessage('Invalid listing ID'),
  body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  handleValidationErrors
];

// Review validation
const validateReview = [
  body('revieweeId').isInt().withMessage('Invalid reviewee ID'),
  body('listingId').isInt().withMessage('Invalid listing ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be under 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateListing,
  validateMessage,
  validateReview
};