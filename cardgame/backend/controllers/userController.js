const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

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
        MIN(uc.level) as card_level,
        MIN(uc.current_attack) as current_attack,
        MIN(uc.current_defense) as current_defense,
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
      GROUP BY uc.card_id, c.card_name, c.rarity, c.card_type, c.image_url, c.card_description, cs.skill_name, cs.skill_description, cs.skill_base_attack, cs.skill_base_defense
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

module.exports = {
  updateResources,
  getUserResources,
  getUserCards,
  decomposeCard
}; 