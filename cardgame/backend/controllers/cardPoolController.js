const CardPool = require('../models/CardPool');
const User = require('../models/User');
const Card = require('../models/Card');
const { pool } = require('../config/db');
const { calculateAttack, calculateDefense } = require('../utils/cardGrowthCalculator');

// 抽卡控制器
const drawCards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { drawType } = req.body;
    
    console.log(`用户${userId}请求${drawType}抽卡`);
    
    // 获取用户信息
    const user = await User.getUserById(userId);
    
    if (!user) {
      console.log(`用户${userId}不存在`);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 获取卡池概率 - 更新为新的概率配置：N 59%, R 30%, SR 10%, SSR 1%
    const rates = {
      N: 0.59,
      R: 0.30,
      SR: 0.10,
      SSR: 0.01
    };
    
    // 稀有度映射
    const rarityMap = {
      'N': 'normal',
      'R': 'common', 
      'SR': 'rare',
      'SSR': 'epic'
    };
    
    // 从数据库获取所有卡牌
    console.log('获取卡牌库...');
    const [N_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['N']);
    const [R_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['R']);
    const [SR_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['SR']);
    const [SSR_cards] = await pool.query('SELECT * FROM cards WHERE rarity = ?', ['SSR']);
    
    console.log(`卡牌库统计: N卡${N_cards.length}张, R卡${R_cards.length}张, SR卡${SR_cards.length}张, SSR卡${SSR_cards.length}张`);
    
    if (!N_cards.length && !R_cards.length && !SR_cards.length && !SSR_cards.length) {
      console.log('卡牌库为空');
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
        console.log(`用户钻石不足: ${user.gems}/${singleDrawCost.gems}`);
        return res.status(400).json({
          success: false,
          message: '钻石不足，无法进行单抽'
        });
      }
      
      // 随机抽取卡牌
      const rarity = getRandomRarity(rates);
      console.log(`抽到稀有度: ${rarity}`);
      let cardPool;
      
      if (rarity === 'N') cardPool = N_cards;
      else if (rarity === 'R') cardPool = R_cards;
      else if (rarity === 'SR') cardPool = SR_cards;
      else cardPool = SSR_cards;
      
      // 如果该稀有度没有卡牌，选择下一个更低稀有度
      if (!cardPool || cardPool.length === 0) {
        console.log(`${rarity}稀有度没有卡牌，选择替代稀有度`);
        if (rarity === 'SSR' && SR_cards.length > 0) {
          cardPool = SR_cards;
        } else if (rarity === 'SR' && R_cards.length > 0) {
          cardPool = R_cards;
        } else if (rarity === 'R' && N_cards.length > 0) {
          cardPool = N_cards;
        } else {
          // 找到任何可用的卡牌池
          cardPool = SSR_cards.length > 0 ? SSR_cards : 
                   SR_cards.length > 0 ? SR_cards : 
                   R_cards.length > 0 ? R_cards : N_cards;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * cardPool.length);
      const card = cardPool[randomIndex];
      
      console.log(`抽到卡牌: ${card.card_name} (${card.rarity})`);
      
      // 转换为前端期望的格式
      const formattedCard = {
        id: card.card_id,
        name: card.card_name,
        rarity: rarityMap[card.rarity],
        image_url: card.image_url || `/images/cards/${card.card_name}.jpg`
      };
      
      // 更新用户资源
      console.log(`更新用户资源: ${user.gems} - ${singleDrawCost.gems} = ${user.gems - singleDrawCost.gems}`);
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - singleDrawCost.gems,
        coins: user.coins
      });
      
      // 记录抽卡历史
      console.log('记录抽卡历史');
      await pool.query(
        'INSERT INTO draw_history (user_id, card_id) VALUES (?, ?)',
        [userId, card.card_id]
      );
      
      // 添加到用户卡牌库
      console.log('添加卡牌到用户库存');
      await addCardToUserInventory(userId, card.card_id);
      
      result = {
        cards: [formattedCard],
        updatedResources
      };
    } else if (drawType === 'ten') {
      // 十连抽
      const tenDrawCost = { gems: 950, coins: 0 };
      
      if (user.gems < tenDrawCost.gems) {
        console.log(`用户钻石不足: ${user.gems}/${tenDrawCost.gems}`);
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
        
        console.log(`第${i+1}抽稀有度: ${rarity}`);
        
        // 选择对应稀有度的卡牌池
        let cardPool;
        if (rarity === 'N') cardPool = N_cards;
        else if (rarity === 'R') cardPool = R_cards;
        else if (rarity === 'SR') cardPool = SR_cards;
        else cardPool = SSR_cards;
        
        // 如果该稀有度没有卡牌，选择下一个更低稀有度
        if (!cardPool || cardPool.length === 0) {
          console.log(`${rarity}稀有度没有卡牌，选择替代稀有度`);
          if (rarity === 'SSR' && SR_cards.length > 0) {
            cardPool = SR_cards;
            rarity = 'SR';
          } else if (rarity === 'SR' && R_cards.length > 0) {
            cardPool = R_cards;
            rarity = 'R';
          } else if (rarity === 'R' && N_cards.length > 0) {
            cardPool = N_cards;
            rarity = 'N';
          } else {
            // 找到任何可用的卡牌池
            if (SSR_cards.length > 0) {
              cardPool = SSR_cards;
              rarity = 'SSR';
            } else if (SR_cards.length > 0) {
              cardPool = SR_cards;
              rarity = 'SR';
            } else if (R_cards.length > 0) {
              cardPool = R_cards;
              rarity = 'R';
            } else {
              cardPool = N_cards;
              rarity = 'N';
            }
          }
        }
        
        const randomIndex = Math.floor(Math.random() * cardPool.length);
        const card = cardPool[randomIndex];
        
        console.log(`抽到卡牌: ${card.card_name} (${card.rarity})`);
        
        // 转换为前端期望的格式
        cards.push({
          id: card.card_id,
          name: card.card_name,
          rarity: rarityMap[card.rarity],
          image_url: card.image_url || `/images/cards/${card.card_name}.jpg`
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
      console.log(`更新用户资源: ${user.gems} - ${tenDrawCost.gems} = ${user.gems - tenDrawCost.gems}`);
      const updatedResources = await User.updateResources(userId, {
        gems: user.gems - tenDrawCost.gems,
        coins: user.coins
      });
      
      result = {
        cards,
        updatedResources
      };
    } else {
      console.log(`无效的抽卡类型: ${drawType}`);
      return res.status(400).json({
        success: false,
        message: '无效的抽卡类型'
      });
    }
    
    console.log('抽卡成功，返回结果');
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
    if (!cardInfo.length) {
      console.log(`卡牌ID=${cardId}不存在`);
      return;
    }
    
    const card = cardInfo[0];
    
    // 检查用户是否已有这种卡牌，获取最高等级
    const [existingCards] = await pool.query(
      'SELECT MAX(level) as max_level FROM user_cards WHERE user_id = ? AND card_id = ?', 
      [userId, cardId]
    );
    
    // 确定新卡牌的等级：如果用户已有同种卡牌，使用最高等级；否则使用1级
    let newCardLevel = 1;
    let newAttack = card.base_attack;
    let newDefense = card.base_defense || 0;
    
    if (existingCards.length > 0 && existingCards[0].max_level) {
      // 用户已有该卡牌，新卡牌等级同步到最高等级
      newCardLevel = existingCards[0].max_level;
      // 重新计算对应等级的属性
      newAttack = calculateAttack(card.base_attack, card.rarity, newCardLevel);
      newDefense = calculateDefense(card.base_defense || 0, card.rarity, newCardLevel);
      
      console.log(`用户${userId}已有卡牌${cardId}，新卡牌同步到等级${newCardLevel}，攻击:${newAttack}，防御:${newDefense}`);
    } else {
      console.log(`用户${userId}没有卡牌${cardId}，添加1级新卡牌`);
    }
    
    // 添加新卡牌记录
    await pool.query(
      'INSERT INTO user_cards (user_id, card_id, level, current_attack, current_defense) VALUES (?, ?, ?, ?, ?)',
      [userId, cardId, newCardLevel, newAttack, newDefense]
    );
    
    // 如果卡牌有技能，添加技能关联
    if (card.card_skill) {
      // 获取新创建的user_card_id
      const [newUserCard] = await pool.query(
        'SELECT user_card_id FROM user_cards WHERE user_id = ? AND card_id = ? ORDER BY user_card_id DESC LIMIT 1',
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
          // 添加卡牌技能关联，包含所有技能字段的默认值
          console.log(`为卡牌添加技能: 卡牌=${userCardId}, 技能=${skill.skill_id}`);
          await pool.query(
            'INSERT INTO card_skill_relation (user_card_id, skill_id, skill_attack, skill_defense, skill_strike, skill_recovery, skill_block) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              userCardId, 
              skill.skill_id, 
              skill.skill_base_attack || 0, 
              skill.skill_base_defense || 0,
              skill.skill_base_strike || 0,
              skill.skill_base_recovery || 0,
              skill.skill_base_block || 0
            ]
          );
        }
      }
    }
  } catch (error) {
    console.error('添加卡牌到用户库存出错:', error);
    throw error;
  }
};

// 根据概率获取随机稀有度
function getRandomRarity(rates) {
  const rand = Math.random();
  
  // 累积概率计算
  if (rand < rates.SSR) {
    return 'SSR';
  } else if (rand < rates.SSR + rates.SR) {
    return 'SR';
  } else if (rand < rates.SSR + rates.SR + rates.R) {
    return 'R';
  } else {
    return 'N';
  }
}

// 获取卡池信息
const getCardPoolInfo = async (req, res) => {
  try {
    console.log('获取卡池信息请求接收');
    
    // 默认返回的卡池信息
    const defaultPool = {
      success: true,
      cardPool: {
        name: '标准卡池',
        description: '包含多种稀有度的卡牌',
        startTime: '2023-01-01',
        endTime: '2025-12-31'
      },
      rates: {
        normal: 59,
        common: 30,
        rare: 10,
        epic: 1
      }
    };
    
    // 检查表是否存在
    try {
      const [tables] = await pool.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('card_pools', 'card_pool_types')
      `);
      
      const existingTables = tables.map(t => t.TABLE_NAME);
      
      if (!existingTables.includes('card_pools') || !existingTables.includes('card_pool_types')) {
        console.log('卡池相关表不存在，返回默认卡池信息');
        return res.status(200).json(defaultPool);
      }
    } catch (error) {
      console.error('检查表存在失败:', error);
      return res.status(200).json(defaultPool);
    }
    
    // 先获取一个卡池
    let poolData;
    try {
      const [poolsData] = await pool.query('SELECT * FROM card_pools LIMIT 1');
      
      if (!poolsData.length) {
        console.log('未找到卡池，返回默认卡池信息');
        return res.status(200).json(defaultPool);
      }
      
      poolData = poolsData[0];
      console.log('找到卡池:', poolData.pool_name);
    } catch (error) {
      console.error('获取卡池失败:', error);
      return res.status(200).json(defaultPool);
    }
    
    // 获取卡池类型信息
    let typeData;
    try {
      const [typesData] = await pool.query('SELECT * FROM card_pool_types WHERE pool_type_id = ?', 
        [poolData.pool_type_id]);
      
      if (!typesData.length) {
        console.log('未找到卡池类型，使用默认概率');
        
        return res.status(200).json({
          success: true,
          cardPool: {
            id: poolData.pool_id,
            name: poolData.pool_name,
            description: poolData.pool_description || '标准卡池',
            startTime: poolData.start_time,
            endTime: poolData.end_time
          },
          rates: {
            normal: 59,
            common: 30,
            rare: 10,
            epic: 1
          }
        });
      }
      
      typeData = typesData[0];
      console.log('找到卡池类型:', typeData.pool_type_name);
    } catch (error) {
      console.error('获取卡池类型失败:', error);
      
      return res.status(200).json({
        success: true,
        cardPool: {
          id: poolData.pool_id,
          name: poolData.pool_name,
          description: poolData.pool_description || '标准卡池',
          startTime: poolData.start_time,
          endTime: poolData.end_time
        },
        rates: {
          normal: 59,
          common: 30,
          rare: 10,
          epic: 1
        }
      });
    }
    
    // 返回完整信息
    const responseData = {
      success: true,
      cardPool: {
        id: poolData.pool_id,
        name: poolData.pool_name,
        description: poolData.pool_description || '标准卡池',
        startTime: poolData.start_time,
        endTime: poolData.end_time
      },
      rates: {
        normal: parseFloat((typeData.drop_rate_N * 100).toFixed(1)),
        common: parseFloat((typeData.drop_rate_R * 100).toFixed(1)),
        rare: parseFloat((typeData.drop_rate_SR * 100).toFixed(1)),
        epic: parseFloat((typeData.drop_rate_SSR * 100).toFixed(1))
      }
    };
    
    console.log('返回卡池信息:', JSON.stringify(responseData));
    res.status(200).json(responseData);
  } catch (error) {
    console.error('获取卡池信息出错:', error);
    // 即使出错也返回可用的默认值
    res.status(200).json({
      success: true,
      cardPool: {
        name: '标准卡池',
        description: '包含多种稀有度的卡牌',
        startTime: '2023-01-01',
        endTime: '2025-12-31'
      },
      rates: {
        normal: 59,
        common: 30,
        rare: 10,
        epic: 1
      }
    });
  }
};

module.exports = {
  drawCards,
  getCardPoolInfo
}; 