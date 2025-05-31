const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// 更新用户资源路由（受保护）
router.post('/resources', authenticateToken, userController.updateResources);

// 获取用户资源信息路由（受保护）
router.get('/resources', authenticateToken, userController.getUserResources);

// 获取用户卡牌仓库路由（受保护）
router.get('/cards', authenticateToken, userController.getUserCards);

// 卡牌分解路由（受保护）
router.post('/cards/decompose', authenticateToken, userController.decomposeCard);

module.exports = router; 