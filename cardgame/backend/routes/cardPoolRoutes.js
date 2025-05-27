const express = require('express');
const router = express.Router();
const cardPoolController = require('../controllers/cardPoolController');
const authenticateToken = require('../middleware/authMiddleware');

// 抽卡路由
router.post('/draw', authenticateToken, cardPoolController.drawCards);

// 获取卡池信息路由
router.get('/info', authenticateToken, cardPoolController.getCardPoolInfo);

module.exports = router; 