const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authenticateToken = require('../middleware/authMiddleware');

// 获取商店商品列表路由（受保护）
router.get('/items', authenticateToken, shopController.getShopItems);

// 购买商品路由（受保护）
router.post('/purchase', authenticateToken, shopController.purchaseItem);

module.exports = router; 