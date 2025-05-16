const { pool } = require('../config/db');

class Card {
  // 获取所有卡牌
  static async getAllCards() {
    try {
      const [rows] = await pool.query('SELECT * FROM cards');
      return rows;
    } catch (error) {
      console.error('Error fetching all cards:', error);
      throw error;
    }
  }

  // 根据ID获取卡牌
  static async getCardById(cardId) {
    try {
      const [rows] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [cardId]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      throw error;
    }
  }

  // 根据稀有度获取卡牌
  static async getCardsByRarity(rarity) {
    try {
      const [rows] = await pool.query('SELECT * FROM cards WHERE rarity = ?', [rarity]);
      return rows;
    } catch (error) {
      console.error('Error fetching cards by rarity:', error);
      throw error;
    }
  }

  // 创建新卡牌
  static async createCard(cardData) {
    try {
      const { name, rarity, description } = cardData;
      
      const [result] = await pool.query(
        'INSERT INTO cards (name, rarity, description) VALUES (?, ?, ?)',
        [name, rarity, description]
      );
      
      return { 
        card_id: result.insertId, 
        name, 
        rarity,
        description
      };
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }
}

module.exports = Card; 