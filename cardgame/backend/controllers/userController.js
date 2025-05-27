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
    
    // 修改查询，解决GROUP BY问题
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
        COUNT(*) as quantity
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = ?
      GROUP BY uc.card_id, c.card_name, c.rarity, c.card_type, c.image_url, c.card_description
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
      image_url: card.image_url || `/images/cards/${card.card_name}.png`,
      acquired_time: card.acquired_time,
      quantity: card.quantity
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
  getUserCards
}; 