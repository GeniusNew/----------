const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

module.exports = {
  updateResources,
  getUserResources
}; 