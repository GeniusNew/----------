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
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, passwordHash, email]
      );
      
      return { 
        user_id: result.insertId, 
        username, 
        email
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
        email: user.email
      };
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
}

module.exports = User; 