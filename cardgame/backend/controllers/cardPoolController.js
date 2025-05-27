const CardPool = require('../models/CardPool');
const User = require('../models/User');
const Card = require('../models/Card');
const { pool } = require('../config/db');

// 抽卡控制器
const drawCards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { drawType } = req.body;
    
    // 获取用户信息
    const user = await User.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取卡池概率
    const rates = {
      R: 0.6,
      SR: 0.38,
      SSR: 0.02
    };
    
    // 稀有度映射
    const rarityMap = {
      'R': 'common',
      'SR': 'rare',
      'SSR': 'epic'
    };
    
    // 从数据库获取所有卡牌
    const [R_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['R']);
    const [SR_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['SR']);
    const [SSR_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['SSR']);
    
    if (!R_cards.length && !SR_cards.length && !SSR_cards.length) {
      return res.status(500).json({
        success: false,
        message: '卡牌数据库为空，请先添加卡牌'
      });
    }
    
    let result;
    
    if (drawType === 'single') {
      // 单抽
      const singleDrawCost = { gems: 100, coins: 0 };
      
      if (user.gems < singleDrawCost.gems) {
        return res.status(400).json({
          success: false,
          message: '钻石不足，无法进行单抽'
        });
      }
      
      // 随机抽取卡牌
      const rarity = getRandomRarity(rates);
      let cardPool;
      
      if (rarity === 'R') cardPool = R_cards;
      else if (rarity === 'SR') cardPool = SR_cards;
      else cardPool = SSR_cards;
      
      // 如果该稀有度没有卡牌，选择下一个更低稀有度
      if (!cardPool || cardPool.length === 0) {
        if (rarity === 'SSR' && SR_cards.length > 0) {
          cardPool = SR_cards;
        } else {
          cardPool = R_cards;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * cardPool.length);
      const card = cardPool[randomIndex];
      
      // 转换为前端期望的格式
      const formattedCard = {
        id: card.card_id,
        name: card.card_name,
        rarity: rarityMap[card.rarity],
        image_url: card.image_url || `/images/cards/${card.card_name}.png`
      };
      
      // 更新用户资源
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - singleDrawCost.gems,
        coins: user.coins
      });
      
      // 记录抽卡历史
      await pool.query(
        'INSERT INTO draw_history (user_id, card_id) VALUES (?, ?)',
        [userId, card.card_id]
      );
      
      // 添加到用户卡牌库
      await addCardToUserInventory(userId, card.card_id);
      
      result = {
        cards: [formattedCard],
        updatedResources
      };
    } else if (drawType === 'ten') {
      // 十连抽
      const tenDrawCost = { gems: 950, coins: 0 };
      
      if (user.gems < tenDrawCost.gems) {
        return res.status(400).json({
          success: false,
          message: '钻石不足，无法进行十连抽'
        });
      }
      
      // 随机抽取10张卡牌
      const cards = [];
      for (let i = 0; i < 10; i++) {
        // 保证第10张至少是SR稀有度
        let rarity;
        if (i === 9) {
          // 第10抽保底SR，20%概率是SSR
          rarity = Math.random() < 0.2 ? 'SSR' : 'SR';
          // 如果没有SR或SSR卡牌，使用R卡牌
          if ((rarity === 'SSR' && !SSR_cards.length) || 
              (rarity === 'SR' && !SR_cards.length)) {
            if (SR_cards.length > 0) rarity = 'SR';
            else if (SSR_cards.length > 0) rarity = 'SSR';
            else rarity = 'R';
          }
        } else {
          rarity = getRandomRarity(rates);
        }
        
        // 选择对应稀有度的卡牌池
        let cardPool;
        if (rarity === 'R') cardPool = R_cards;
        else if (rarity === 'SR') cardPool = SR_cards;
        else cardPool = SSR_cards;
        
        // 如果该稀有度没有卡牌，选择下一个更低稀有度
        if (!cardPool || cardPool.length === 0) {
          if (rarity === 'SSR' && SR_cards.length > 0) {
            cardPool = SR_cards;
            rarity = 'SR';
          } else {
            cardPool = R_cards;
            rarity = 'R';
          }
        }
        
        const randomIndex = Math.floor(Math.random() * cardPool.length);
        const card = cardPool[randomIndex];
        
        // 转换为前端期望的格式
        cards.push({
          id: card.card_id,
          name: card.card_name,
          rarity: rarityMap[card.rarity],
          image_url: card.image_url || `/images/cards/${card.card_name}.png`
        });
        
        // 记录抽卡历史
        await pool.query(
          'INSERT INTO draw_history (user_id, card_id) VALUES (?, ?)',
          [userId, card.card_id]
        );
        
        // 添加到用户卡牌库
        await addCardToUserInventory(userId, card.card_id);
      }
      
      // 更新用户资源
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - tenDrawCost.gems,
        coins: user.coins
      });
      
      result = {
        cards,
        updatedResources
      };
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的抽卡类型'
      });
    }
    
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('抽卡错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '抽卡时发生错误'
    });
  }
};

// 添加卡牌到用户库存
async function addCardToUserInventory(userId, cardId) {
  try {
    // 获取卡牌信息
    const [cardInfo] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [cardId]);
    if (!cardInfo.length) return;
    
    const card = cardInfo[0];
    
    // 检查用户是否已有这张卡
    const [userCardResult] = await pool.query(
      'SELECT * FROM user_cards WHERE user_id = ? AND card_id = ?', 
      [userId, cardId]
    );
    
    if (userCardResult.length > 0) {
      // 用户已有该卡牌，不需要额外操作
      return;
    } else {
      // 用户没有该卡牌，添加新记录
      await pool.query(
        'INSERT INTO user_cards (user_id, card_id, level, current_attack, current_defense) VALUES (?, ?, ?, ?, ?)',
        [userId, cardId, 1, card.base_attack, card.base_defemse]
      );
      
      // 如果卡牌有技能，添加技能关联
      if (card.card_skill) {
        // 获取新创建的user_card_id
        const [newUserCard] = await pool.query(
          'SELECT user_card_id FROM user_cards WHERE user_id = ? AND card_id = ?',
          [userId, cardId]
        );
        
        if (newUserCard.length > 0) {
          const userCardId = newUserCard[0].user_card_id;
          
          // 获取技能信息
          const [skillInfo] = await pool.query(
            'SELECT * FROM card_skills WHERE skill_id = ?',
            [card.card_skill]
          );
          
          if (skillInfo.length > 0) {
            const skill = skillInfo[0];
            // 添加卡牌技能关联
            await pool.query(
              'INSERT INTO card_skill_relation (user_card_id, skill_id, skill_attack, skill_defense) VALUES (?, ?, ?, ?)',
              [userCardId, skill.skill_id, skill.skill_base_attack, skill.skill_base_defense]
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('添加卡牌到用户库存出错:', error);
    throw error;
  }
}

// 根据概率获取随机稀有度
function getRandomRarity(rates) {
  const rand = Math.random();
  if (rand < rates.SSR) {
    return 'SSR';
  } else if (rand < rates.SSR + rates.SR) {
    return 'SR';
  } else {
    return 'R';
  }
}

// 获取卡池信息
const getCardPoolInfo = async (req, res) => {
  try {
    // 从数据库获取当前活跃的卡池
    const [pools] = await pool.query(`
      SELECT p.*, t.pool_type_name, t.drop_rate_R, t.drop_rate_SR, t.drop_rate_SSR 
      FROM card_pools p
      JOIN card_pool_types t ON p.pool_type_id = t.pool_type_id
      WHERE NOW() BETWEEN p.start_time AND p.end_time
      LIMIT 1
    `);
    
    if (!pools.length) {
      return res.status(200).json({
        success: true,
        cardPool: {
          name: '标准卡池',
          description: '包含多种稀有度的卡牌',
          startTime: '2023-01-01',
          endTime: '2025-12-31'
        },
        rates: {
          common: 60,    // 60% 几率
          rare: 38,      // 38% 几率
          epic: 2        // 2% 几率
        }
      });
    }
    
    const pool = pools[0];
    
    res.status(200).json({
      success: true,
      cardPool: {
        id: pool.pool_id,
        name: pool.pool_name,
        description: pool.pool_description,
        startTime: pool.start_time,
        endTime: pool.end_time
      },
      rates: {
        common: pool.drop_rate_R * 100,
        rare: pool.drop_rate_SR * 100,
        epic: pool.drop_rate_SSR * 100
      }
    });
  } catch (error) {
    console.error('获取卡池信息出错:', error);
    res.status(500).json({
      success: false,
      message: '获取卡池信息失败'
    });
  }
};

module.exports = {
  drawCards,
  getCardPoolInfo
}; 