const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Login route
router.post('/login', authController.login);

// Register route
router.post('/register', authController.register);

// Get current user route (protected)
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router; 