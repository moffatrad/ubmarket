const { uploadMultiple } = require('../config/upload');

// Handle multiple file uploads
const handleUpload = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        message: err.message || 'File upload failed' 
      });
    }
    next();
  });
};

// Get uploaded file paths
const getUploadedPaths = (req) => {
  if (!req.files || req.files.length === 0) return [];
  return req.files.map(file => `/uploads/${file.filename}`);
};

module.exports = {
  handleUpload,
  getUploadedPaths
};