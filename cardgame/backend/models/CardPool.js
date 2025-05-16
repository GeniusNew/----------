const { pool } = require('../config/db');
const Card = require('./Card');
const User = require('./User');

class CardPool {
  // 获取卡池中所有卡牌
  static async getCardPool() {
    try {
      const [rows] = await pool.query('SELECT * FROM card_pool');
      return rows;
    } catch (error) {
      console.error('Error getting card pool:', error);
      throw error;
    }
  }

  // 根据稀有度获取卡池概率
  static async getCardPoolRates() {
    try {
      // 如果有专门的卡池概率表，可以从数据库获取
      // 否则使用预定义的概率
      return {
        common: 60,    // 60% 几率
        rare: 30,      // 30% 几率
        epic: 8,       // 8% 几率
        legendary: 2   // 2% 几率
      };
    } catch (error) {
      console.error('Error getting card pool rates:', error);
      throw error;
    }
  }

  // 单抽卡牌
  static async drawSingleCard(userId) {
    try {
      // 检查用户资源是否足够
      const user = await User.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const singleDrawCost = { gems: 100, coins: 0 };
      
      if (user.gems < singleDrawCost.gems) {
        throw new Error('钻石不足，无法进行单抽');
      }

      // 随机抽取卡牌
      const card = await this.getRandomCard();
      
      // 更新用户资源
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - singleDrawCost.gems,
        coins: user.coins
      });

      // 添加抽到的卡牌到用户卡牌库
      await this.addCardToUserInventory(userId, card.card_id);

      return {
        card,
        updatedResources
      };
    } catch (error) {
      console.error('Error drawing single card:', error);
      throw error;
    }
  }

  // 十连抽卡牌
  static async drawTenCards(userId) {
    try {
      // 检查用户资源是否足够
      const user = await User.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const tenDrawCost = { gems: 950, coins: 0 };
      
      if (user.gems < tenDrawCost.gems) {
        throw new Error('钻石不足，无法进行十连抽');
      }

      // 随机抽取10张卡牌
      const cards = [];
      for (let i = 0; i < 10; i++) {
        // 保证第10张至少是稀有度为rare的卡牌
        const card = i === 9 
          ? await this.getRandomCardWithMinRarity('rare')
          : await this.getRandomCard();
        
        cards.push(card);
        
        // 添加抽到的卡牌到用户卡牌库
        await this.addCardToUserInventory(userId, card.card_id);
      }
      
      // 更新用户资源
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - tenDrawCost.gems,
        coins: user.coins
      });

      return {
        cards,
        updatedResources
      };
    } catch (error) {
      console.error('Error drawing ten cards:', error);
      throw error;
    }
  }

  // 随机抽取卡牌，根据稀有度概率
  static async getRandomCard() {
    try {
      const rates = await this.getCardPoolRates();
      
      // 生成0-99之间的随机数
      const rand = Math.floor(Math.random() * 100);
      
      // 根据概率确定稀有度
      let rarity;
      if (rand < rates.legendary) {
        rarity = 'legendary';
      } else if (rand < rates.legendary + rates.epic) {
        rarity = 'epic';
      } else if (rand < rates.legendary + rates.epic + rates.rare) {
        rarity = 'rare';
      } else {
        rarity = 'common';
      }
      
      // 获取特定稀有度的所有卡牌
      const cards = await Card.getCardsByRarity(rarity);
      
      // 如果没有该稀有度的卡牌，使用预设的卡牌数据
      if (!cards || cards.length === 0) {
        return this.getFallbackCard(rarity);
      }
      
      // 随机选择一张卡牌
      const randomIndex = Math.floor(Math.random() * cards.length);
      return cards[randomIndex];
    } catch (error) {
      console.error('Error getting random card:', error);
      // 出错时使用预设的卡牌数据
      return this.getFallbackCard('common');
    }
  }
  
  // 随机抽取指定最低稀有度的卡牌
  static async getRandomCardWithMinRarity(minRarity) {
    try {
      const rates = await this.getCardPoolRates();
      
      // 根据最低稀有度重新计算概率
      let rand;
      let rarity;
      
      if (minRarity === 'legendary') {
        rarity = 'legendary';
      } else if (minRarity === 'epic') {
        rand = Math.floor(Math.random() * (rates.epic + rates.legendary));
        rarity = rand < rates.legendary ? 'legendary' : 'epic';
      } else if (minRarity === 'rare') {
        rand = Math.floor(Math.random() * (rates.rare + rates.epic + rates.legendary));
        if (rand < rates.legendary) {
          rarity = 'legendary';
        } else if (rand < rates.legendary + rates.epic) {
          rarity = 'epic';
        } else {
          rarity = 'rare';
        }
      } else {
        return this.getRandomCard(); // 如果没有最低稀有度限制，使用标准抽卡
      }
      
      // 获取特定稀有度的所有卡牌
      const cards = await Card.getCardsByRarity(rarity);
      
      // 如果没有该稀有度的卡牌，使用预设的卡牌数据
      if (!cards || cards.length === 0) {
        return this.getFallbackCard(rarity);
      }
      
      // 随机选择一张卡牌
      const randomIndex = Math.floor(Math.random() * cards.length);
      return cards[randomIndex];
    } catch (error) {
      console.error('Error getting card with min rarity:', error);
      // 出错时使用预设的最低稀有度卡牌数据
      return this.getFallbackCard(minRarity);
    }
  }
  
  // 获取预设的卡牌数据（当数据库中没有卡牌数据时使用）
  static getFallbackCard(rarity) {
    const fallbackCards = {
      common: [
        { card_id: 'c1', name: '小兵', rarity: 'common', description: '基础攻击单位' },
        { card_id: 'c2', name: '弓箭手', rarity: 'common', description: '远程攻击单位' },
        { card_id: 'c3', name: '药水', rarity: 'common', description: '恢复少量生命值' }
      ],
      rare: [
        { card_id: 'r1', name: '骑士', rarity: 'rare', description: '中等防御力单位' },
        { card_id: 'r2', name: '法师', rarity: 'rare', description: '中等法术攻击单位' },
        { card_id: 'r3', name: '治疗术', rarity: 'rare', description: '恢复中等生命值' }
      ],
      epic: [
        { card_id: 'e1', name: '龙骑士', rarity: 'epic', description: '高攻击力单位' },
        { card_id: 'e2', name: '高级法师', rarity: 'epic', description: '高法术攻击单位' },
        { card_id: 'e3', name: '复活术', rarity: 'epic', description: '复活一个单位' }
      ],
      legendary: [
        { card_id: 'l1', name: '巨龙', rarity: 'legendary', description: '超高攻击力单位' },
        { card_id: 'l2', name: '大法师', rarity: 'legendary', description: '超高法术攻击单位' },
        { card_id: 'l3', name: '神圣护盾', rarity: 'legendary', description: '提供无敌护盾' }
      ]
    };
    
    const cards = fallbackCards[rarity] || fallbackCards.common;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }
  
  // 添加卡牌到用户库存
  static async addCardToUserInventory(userId, cardId) {
    try {
      // 检查用户是否已拥有该卡牌
      const [existingCard] = await pool.query(
        'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?',
        [userId, cardId]
      );
      
      if (existingCard.length > 0) {
        // 如果已有该卡牌，数量+1
        await pool.query(
          'UPDATE user_cards SET quantity = quantity + 1 WHERE user_id = ? AND card_id = ?',
          [userId, cardId]
        );
      } else {
        // 如果没有该卡牌，添加新记录
        await pool.query(
          'INSERT INTO user_cards (user_id, card_id, quantity) VALUES (?, ?, 1)',
          [userId, cardId]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error adding card to user inventory:', error);
      // 可以选择忽略库存添加错误，不影响抽卡结果
      return false;
    }
  }
}

module.exports = CardPool; 