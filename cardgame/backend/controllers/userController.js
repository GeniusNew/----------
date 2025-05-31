const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { getUpgradePreview, calculateAttack, calculateDefense } = require('../utils/cardGrowthCalculator');

// 更新用户资源
const updateResources = async (req, res) => {
  try {
    const { gems } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请重新登录' });
    }
    
    // 获取当前用户信息
    const user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新钻石数量
    const updatedResources = await User.updateResources(userId, {
      gems: gems,
      coins: user.coins // 保持金币不变
    });
    
    return res.status(200).json({
      message: '资源更新成功',
      updatedResources
    });
  } catch (error) {
    console.error('更新资源失败:', error);
    return res.status(500).json({ message: error.message || '更新资源失败，请稍后再试' });
  }
};

// 获取用户资源信息
const getUserResources = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请重新登录' });
    }
    
    const user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    return res.status(200).json({
      username: user.username,
      level: user.level,
      gems: user.gems,
      coins: user.coins
    });
  } catch (error) {
    console.error('获取用户资源失败:', error);
    return res.status(500).json({ message: '获取用户资源失败，请稍后再试' });
  }
};

// 卡牌分解功能
const decomposeCard = async (req, res) => {
  try {
    const { cardId, quantity = 1 } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    console.log('=== 卡牌分解请求开始 ===');
    console.log('请求体:', req.body);
    console.log('用户ID:', userId);
    console.log('卡牌ID:', cardId);
    console.log('分解数量:', quantity);
    
    if (!userId) {
      console.log('错误: 用户ID无效');
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    if (!cardId || quantity <= 0) {
      console.log('错误: 参数无效', { cardId, quantity });
      return res.status(400).json({ 
        success: false, 
        message: '参数无效' 
      });
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. 检查用户是否拥有该卡牌，以及拥有的数量
      console.log('查询用户卡牌数量...');
      const [userCards] = await connection.query(`
        SELECT COUNT(*) as owned_count, MIN(user_card_id) as first_card_id
        FROM user_cards 
        WHERE user_id = ? AND card_id = ?
      `, [userId, cardId]);
      
      console.log('用户卡牌查询结果:', userCards[0]);
      
      if (userCards[0].owned_count < quantity) {
        console.log('错误: 拥有的卡牌数量不足');
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: '拥有的卡牌数量不足' 
        });
      }
      
      // 如果分解数量等于或超过拥有数量，不允许分解（至少保留1张）
      if (userCards[0].owned_count <= quantity) {
        console.log('错误: 至少需要保留1张卡牌');
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: '至少需要保留1张卡牌' 
        });
      }
      
      // 2. 获取卡牌稀有度信息
      console.log('查询卡牌信息...');
      const [cardInfo] = await connection.query(`
        SELECT rarity FROM cards WHERE card_id = ?
      `, [cardId]);
      
      console.log('卡牌信息查询结果:', cardInfo[0]);
      
      if (cardInfo.length === 0) {
        console.log('错误: 卡牌不存在');
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: '卡牌不存在' 
        });
      }
      
      // 3. 根据稀有度计算获得的钻石
      const rarity = cardInfo[0].rarity;
      let gemsPerCard = 0;
      switch(rarity) {
        case 'SSR':
          gemsPerCard = 100;
          break;
        case 'SR':
          gemsPerCard = 50;
          break;
        case 'R':
          gemsPerCard = 20;
          break;
        case 'N':
          gemsPerCard = 1;
          break;
        default:
          gemsPerCard = 1;
      }
      
      const totalGems = gemsPerCard * quantity;
      
      // 4. 删除指定数量的卡牌（删除最早获得的卡牌）
      await connection.query(`
        DELETE FROM user_cards 
        WHERE user_id = ? AND card_id = ? 
        ORDER BY acquired_time ASC 
        LIMIT ?
      `, [userId, cardId, quantity]);
      
      // 5. 更新用户钻石
      await connection.query(`
        UPDATE users 
        SET diamonds = diamonds + ? 
        WHERE user_id = ?
      `, [totalGems, userId]);
      
      // 6. 获取更新后的用户资源
      const [updatedUser] = await connection.query(`
        SELECT diamonds as gems, coins FROM users WHERE user_id = ?
      `, [userId]);
      
      await connection.commit();
      connection.release();
      
      console.log(`卡牌分解成功: 用户${userId}分解了${quantity}张${rarity}卡牌，获得${totalGems}钻石`);
      
      return res.status(200).json({
        success: true,
        message: `成功分解${quantity}张${rarity}卡牌，获得${totalGems}钻石`,
        gemsGained: totalGems,
        newUserResources: updatedUser[0]
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('卡牌分解失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '卡牌分解失败，请稍后再试' 
    });
  }
};

// 获取用户卡牌信息
const getUserCards = async (req, res) => {
  try {
    console.log('获取用户卡牌请求接收');
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    console.log('用户ID:', userId);
    
    if (!userId) {
      console.log('未找到有效用户ID');
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    // 修改查询，解决GROUP BY问题，并获取技能信息
    console.log('执行SQL查询...');
    const [rows] = await pool.query(`
      SELECT 
        MIN(uc.user_card_id) as user_card_id,
        uc.card_id,
        uc.level as card_level,
        uc.current_attack,
        uc.current_defense,
        MIN(uc.acquired_time) as acquired_time,
        c.card_name,
        c.rarity,
        c.card_type,
        c.image_url,
        c.card_description,
        COUNT(*) as quantity,
        cs.skill_name,
        cs.skill_description,
        cs.skill_base_attack,
        cs.skill_base_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      LEFT JOIN card_skills cs ON c.card_skill = cs.skill_id
      WHERE uc.user_id = ?
      GROUP BY uc.card_id, uc.level, uc.current_attack, uc.current_defense, c.card_name, c.rarity, c.card_type, c.image_url, c.card_description, cs.skill_name, cs.skill_description, cs.skill_base_attack, cs.skill_base_defense
      ORDER BY 
        CASE c.rarity 
          WHEN 'SSR' THEN 1 
          WHEN 'SR' THEN 2 
          WHEN 'R' THEN 3 
        END,
        c.card_name
    `, [userId]);
    
    console.log(`查询到${rows.length}张卡牌`);
    
    // 转换稀有度为前端展示格式
    const rarityMap = {
      'R': 'common',
      'SR': 'rare',
      'SSR': 'epic'
    };
    
    const formattedCards = rows.map(card => ({
      id: card.card_id,
      user_card_id: card.user_card_id,
      name: card.card_name,
      rarity: rarityMap[card.rarity] || card.rarity,
      type: card.card_type,
      level: card.card_level,
      attack: card.current_attack,
      defense: card.current_defense,
      description: card.card_description,
      image_url: card.image_url || `/images/cards/${card.card_name}.jpg`,
      acquired_time: card.acquired_time,
      quantity: card.quantity,
      original_rarity: card.rarity, // 保留原始稀有度用于分解计算
      skill_name: card.skill_name,
      skill_description: card.skill_description,
      skill_base_attack: card.skill_base_attack,
      skill_base_defense: card.skill_base_defense
    }));
    
    console.log('数据格式转换完成，返回结果');
    
    return res.status(200).json({
      success: true,
      cards: formattedCards
    });
  } catch (error) {
    console.error('获取用户卡牌失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取用户卡牌失败，请稍后再试' 
    });
  }
};

// 获取用户强化物品
const getUserEnhancementItems = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    const [items] = await pool.query(`
      SELECT 
        uei.user_item_id,
        uei.item_id,
        uei.quantity,
        ei.item_name,
        ei.item_description,
        ei.item_type,
        ei.required_level,
        ei.rarity
      FROM user_enhancement_items uei
      JOIN enhancement_items ei ON uei.item_id = ei.item_id
      WHERE uei.user_id = ? AND uei.quantity > 0
      ORDER BY ei.required_level, ei.item_name
    `, [userId]);
    
    return res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    console.error('获取用户强化物品失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取强化物品失败，请稍后再试' 
    });
  }
};

// 获取卡牌升级预览
const getCardUpgradePreview = async (req, res) => {
  try {
    const { userCardId, targetLevel } = req.query;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    if (!userCardId || !targetLevel) {
      return res.status(400).json({ 
        success: false, 
        message: '参数不完整' 
      });
    }
    
    // 获取卡牌信息
    const [cardRows] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.card_id,
        uc.level as card_level,
        uc.current_attack,
        uc.current_defense,
        c.card_name,
        c.rarity,
        c.base_attack,
        c.base_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_card_id = ? AND uc.user_id = ?
    `, [userCardId, userId]);
    
    if (cardRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '卡牌不存在' 
      });
    }
    
    const card = cardRows[0];
    card.original_rarity = card.rarity;
    
    // 获取升级预览
    const preview = getUpgradePreview(card, parseInt(targetLevel));
    
    return res.status(200).json({
      success: true,
      preview
    });
  } catch (error) {
    console.error('获取升级预览失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取升级预览失败，请稍后再试' 
    });
  }
};

// 执行卡牌升级
const upgradeCard = async (req, res) => {
  try {
    const { userCardId, targetLevel } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    console.log('=== 卡牌升级请求开始 ===');
    console.log('用户ID:', userId);
    console.log('用户卡牌ID:', userCardId);
    console.log('目标等级:', targetLevel);
    
    if (!userId) {
      console.log('错误: 用户ID无效');
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    if (!userCardId || !targetLevel || targetLevel < 1 || targetLevel > 100) {
      console.log('错误: 参数无效', { userCardId, targetLevel });
      return res.status(400).json({ 
        success: false, 
        message: '参数无效' 
      });
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. 获取卡牌信息
      console.log('查询卡牌信息...');
      const [cardRows] = await connection.query(`
        SELECT 
          uc.user_card_id,
          uc.card_id,
          uc.level as card_level,
          uc.current_attack,
          uc.current_defense,
          c.card_name,
          c.rarity,
          c.base_attack,
          c.base_defense
        FROM user_cards uc
        JOIN cards c ON uc.card_id = c.card_id
        WHERE uc.user_card_id = ? AND uc.user_id = ?
      `, [userCardId, userId]);
      
      console.log('卡牌查询结果:', cardRows);
      
      if (cardRows.length === 0) {
        console.log('错误: 卡牌不存在');
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: '卡牌不存在' 
        });
      }
      
      const card = cardRows[0];
      console.log('获取到的卡牌:', card);
      
      if (card.card_level >= targetLevel) {
        console.log('错误: 目标等级不能低于或等于当前等级');
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: '目标等级不能低于或等于当前等级' 
        });
      }
      
      // 2. 获取升级预览信息
      console.log('生成升级预览...');
      card.original_rarity = card.rarity;
      const preview = getUpgradePreview(card, targetLevel);
      console.log('升级预览:', preview);
      
      // 3. 检查用户金币是否足够
      console.log('检查用户金币...');
      const [userRows] = await connection.query(`
        SELECT coins, diamonds FROM users WHERE user_id = ?
      `, [userId]);
      
      console.log('用户资源:', userRows[0]);
      
      if (userRows[0].coins < preview.goldCost) {
        console.log('错误: 金币不足');
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: `金币不足，需要${preview.goldCost}金币` 
        });
      }
      
      // 4. 检查特殊物品是否足够
      console.log('检查强化材料...');
      for (const requiredItem of preview.requiredItems) {
        console.log(`检查材料: ${requiredItem.itemName}, 需要数量: ${requiredItem.quantity}`);
        const [itemRows] = await connection.query(`
          SELECT uei.quantity
          FROM user_enhancement_items uei
          JOIN enhancement_items ei ON uei.item_id = ei.item_id
          WHERE uei.user_id = ? AND ei.item_name = ?
        `, [userId, requiredItem.itemName]);
        
        console.log(`材料查询结果:`, itemRows);
        
        if (itemRows.length === 0 || itemRows[0].quantity < requiredItem.quantity) {
          console.log(`错误: 缺少升级材料: ${requiredItem.itemName}`);
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: `缺少升级材料：${requiredItem.itemName}` 
          });
        }
      }
      
      console.log('所有检查通过，开始升级...');
      
      // 5. 扣除金币
      await connection.query(`
        UPDATE users SET coins = coins - ? WHERE user_id = ?
      `, [preview.goldCost, userId]);
      
      // 6. 扣除特殊物品
      for (const requiredItem of preview.requiredItems) {
        await connection.query(`
          UPDATE user_enhancement_items uei
          JOIN enhancement_items ei ON uei.item_id = ei.item_id
          SET uei.quantity = uei.quantity - ?
          WHERE uei.user_id = ? AND ei.item_name = ?
        `, [requiredItem.quantity, userId, requiredItem.itemName]);
      }
      
      // 7. 计算新的属性值（使用基础属性）
      console.log('计算新属性...');
      const baseAttack = card.base_attack;
      const baseDefense = card.base_defense;
      
      const newAttack = calculateAttack(baseAttack, card.rarity, targetLevel);
      const newDefense = calculateDefense(baseDefense, card.rarity, targetLevel);
      
      console.log('新属性计算结果:', { 
        baseAttack, 
        baseDefense, 
        currentLevel: card.card_level, 
        targetLevel, 
        newAttack, 
        newDefense 
      });
      
      // 8. 更新卡牌等级和属性（同时更新该用户的所有同种卡牌）
      console.log('更新所有同种卡牌的等级和属性...');
      const [updateResult] = await connection.query(`
        UPDATE user_cards 
        SET level = ?, current_attack = ?, current_defense = ?
        WHERE user_id = ? AND card_id = ?
      `, [targetLevel, newAttack, newDefense, userId, card.card_id]);
      
      console.log(`已更新 ${updateResult.affectedRows} 张同种卡牌 (card_id: ${card.card_id})`);
      
      // 9. 获取更新后的用户资源
      const [updatedUser] = await connection.query(`
        SELECT coins, diamonds as gems FROM users WHERE user_id = ?
      `, [userId]);
      
      await connection.commit();
      connection.release();
      
      console.log(`卡牌升级成功: ${card.card_name} 从${card.card_level}级升级到${targetLevel}级`);
      
      return res.status(200).json({
        success: true,
        message: `${card.card_name} 成功升级到 ${targetLevel} 级！`,
        newStats: {
          level: targetLevel,
          attack: newAttack,
          defense: newDefense
        },
        costsUsed: {
          goldCost: preview.goldCost,
          itemsUsed: preview.requiredItems
        },
        newUserResources: updatedUser[0]
      });
      
    } catch (error) {
      console.error('升级事务中发生错误:', error);
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('卡牌升级失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: `卡牌升级失败: ${error.message}` 
    });
  }
};

// 使用道具
const useItem = async (req, res) => {
  try {
    const { userCardId, itemName } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    console.log('=== 使用道具请求开始 ===');
    console.log('用户ID:', userId);
    console.log('卡牌ID:', userCardId);
    console.log('道具名称:', itemName);
    
    if (!userId || !userCardId || !itemName) {
      return res.status(400).json({ 
        success: false, 
        message: '参数不完整' 
      });
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. 验证卡牌属于该用户
      const [cardRows] = await connection.query(`
        SELECT uc.*, c.card_name, c.rarity, c.base_attack, c.base_defense
        FROM user_cards uc
        JOIN cards c ON uc.card_id = c.card_id
        WHERE uc.user_card_id = ? AND uc.user_id = ?
      `, [userCardId, userId]);
      
      if (cardRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: '卡牌不存在或不属于该用户' 
        });
      }
      
      const card = cardRows[0];
      
      // 2. 检查用户是否拥有该道具
      const [itemRows] = await connection.query(`
        SELECT uei.quantity, ei.item_name
        FROM user_enhancement_items uei
        JOIN enhancement_items ei ON uei.item_id = ei.item_id
        WHERE uei.user_id = ? AND ei.item_name = ?
      `, [userId, itemName]);
      
      if (itemRows.length === 0 || itemRows[0].quantity <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: `没有足够的${itemName}` 
        });
      }
      
      let newLevel = card.level;
      let newAttack = card.current_attack;
      let newDefense = card.current_defense;
      let resultMessage = '';
      
      // 3. 根据道具类型执行不同效果
      if (itemName === '红专并进') {
        // 提升1级，但不能超过100级
        if (card.level >= 100) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            success: false, 
            message: '卡牌已达到最高等级，无法继续提升' 
          });
        }
        
        newLevel = card.level + 1;
        
        // 重新计算属性（使用基础属性计算）
        newAttack = calculateAttack(card.base_attack, card.rarity, newLevel);
        newDefense = calculateDefense(card.base_defense, card.rarity, newLevel);
        
        resultMessage = `${card.card_name} 等级提升至 ${newLevel} 级！`;
        
      } else if (itemName === '数理基础') {
        // 永久提升攻击防御各5点
        newAttack = card.current_attack + 5;
        newDefense = card.current_defense + 5;
        
        resultMessage = `${card.card_name} 攻击力和防御力各提升5点！`;
        
      } else {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: '不支持的道具类型' 
        });
      }
      
      // 4. 扣除道具
      await connection.query(`
        UPDATE user_enhancement_items uei
        JOIN enhancement_items ei ON uei.item_id = ei.item_id
        SET uei.quantity = uei.quantity - 1
        WHERE uei.user_id = ? AND ei.item_name = ?
      `, [userId, itemName]);
      
      // 5. 更新卡牌属性
      if (itemName === '红专并进') {
        // 红专并进：更新该用户的所有同种卡牌等级和属性
        await connection.query(`
          UPDATE user_cards 
          SET level = ?, current_attack = ?, current_defense = ?
          WHERE user_id = ? AND card_id = ?
        `, [newLevel, newAttack, newDefense, userId, card.card_id]);
      } else {
        // 数理基础：只更新当前使用的卡牌
        await connection.query(`
          UPDATE user_cards 
          SET current_attack = ?, current_defense = ?
          WHERE user_card_id = ?
        `, [newAttack, newDefense, userCardId]);
      }
      
      await connection.commit();
      connection.release();
      
      console.log(`道具使用成功: 用户${userId}对卡牌${userCardId}使用了${itemName}`);
      
      return res.status(200).json({
        success: true,
        message: resultMessage,
        newStats: {
          level: newLevel,
          attack: newAttack,
          defense: newDefense
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('使用道具失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '使用道具失败，请稍后再试' 
    });
  }
};

module.exports = {
  updateResources,
  getUserResources,
  getUserCards,
  decomposeCard,
  getUserEnhancementItems,
  getCardUpgradePreview,
  upgradeCard,
  useItem
}; 