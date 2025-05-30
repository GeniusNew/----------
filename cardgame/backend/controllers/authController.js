const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey';

// Login controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Verify user credentials
    const user = await User.verifyPassword(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 获取用户完整信息（包括资源）
    const userWithResources = await User.getUserById(user.user_id);
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        gems: userWithResources.gems,
        coins: userWithResources.coins,
        level: userWithResources.level
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
};

// Register controller
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate input
    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, and email are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Create user
    const newUser = await User.create({ username, password, email });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.user_id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        gems: newUser.gems,
        coins: newUser.coins,
        level: newUser.level
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message === 'Username already exists') {
      return res.status(409).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }
    
    if (error.message === 'Email already exists') {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
};

// Get current user controller
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    // 获取用户完整信息（包括资源）
    const user = await User.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        gems: user.gems,
        coins: user.coins,
        level: user.level,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred' 
    });
  }
}; 