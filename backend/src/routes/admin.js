const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Admin routes are available' });
});

module.exports = router;
