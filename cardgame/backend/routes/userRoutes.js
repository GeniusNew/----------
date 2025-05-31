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

// 获取用户强化物品路由（受保护）
router.get('/enhancement-items', authenticateToken, userController.getUserEnhancementItems);

// 获取卡牌升级预览路由（受保护）
router.get('/cards/upgrade-preview', authenticateToken, userController.getCardUpgradePreview);

// 执行卡牌升级路由（受保护）
router.post('/cards/upgrade', authenticateToken, userController.upgradeCard);

// 使用道具路由（受保护）
router.post('/cards/use-item', authenticateToken, userController.useItem);

module.exports = router; 