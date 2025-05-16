const CardPool = require('../models/CardPool');
const jwt = require('jsonwebtoken');

// 处理抽卡请求
const drawCards = async (req, res) => {
  try {
    const { drawType } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请重新登录' });
    }
    
    if (drawType === 'single') {
      // 单抽
      const result = await CardPool.drawSingleCard(userId);
      return res.status(200).json({
        message: '单抽成功',
        cards: [result.card],
        updatedResources: result.updatedResources
      });
    } else if (drawType === 'ten') {
      // 十连抽
      const result = await CardPool.drawTenCards(userId);
      return res.status(200).json({
        message: '十连抽成功',
        cards: result.cards,
        updatedResources: result.updatedResources
      });
    } else {
      return res.status(400).json({ message: '无效的抽卡类型' });
    }
  } catch (error) {
    console.error('抽卡失败:', error);
    return res.status(500).json({ message: error.message || '抽卡失败，请稍后再试' });
  }
};

// 获取卡池信息
const getCardPoolInfo = async (req, res) => {
  try {
    const cardPool = await CardPool.getCardPool();
    const rates = await CardPool.getCardPoolRates();
    
    return res.status(200).json({
      cardPool,
      rates
    });
  } catch (error) {
    console.error('获取卡池信息失败:', error);
    return res.status(500).json({ message: '获取卡池信息失败，请稍后再试' });
  }
};

module.exports = {
  drawCards,
  getCardPoolInfo
}; 