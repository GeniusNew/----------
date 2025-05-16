const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Get user by ID
  static async findById(userId) {
    try {
      const [rows] = await pool.query('SELECT user_id, username, email, created_at FROM users WHERE user_id = ?', [userId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  
  // 根据ID获取用户（包含资源信息）
  static async getUserById(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT user_id, username, email, level, gems, coins FROM users WHERE user_id = ?', 
        [userId]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
  
  // 更新用户资源
  static async updateResources(userId, resources) {
    try {
      const { gems, coins } = resources;
      
      await pool.query(
        'UPDATE users SET gems = ?, coins = ? WHERE user_id = ?',
        [gems, coins, userId]
      );
      
      return { gems, coins };
    } catch (error) {
      console.error('Error updating user resources:', error);
      throw error;
    }
  }

  // Get user by username
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Get user by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      const { username, password, email } = userData;
      
      // Check if username already exists
      const existingUsername = await this.findByUsername(username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
      
      // Check if email already exists
      const existingEmail = await this.findByEmail(email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
      
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert the new user
      const [result] = await pool.query(
        'INSERT INTO users (username, password_hash, email, level, gems, coins) VALUES (?, ?, ?, ?, ?, ?)',
        [username, passwordHash, email, 1, 1000, 500]
      );
      
      return { 
        user_id: result.insertId, 
        username, 
        email,
        level: 1,
        gems: 1000,
        coins: 500
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Verify user password
  static async verifyPassword(username, password) {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        return null;
      }
      
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return null;
      }
      
      return {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        level: user.level || 1,
        gems: user.gems || 0,
        coins: user.coins || 0
      };
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
}

module.exports = User; 