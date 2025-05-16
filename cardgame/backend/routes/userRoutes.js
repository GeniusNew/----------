const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// 更新用户资源路由（受保护）
router.post('/resources', authenticateToken, userController.updateResources);

// 获取用户资源信息路由（受保护）
router.get('/resources', authenticateToken, userController.getUserResources);

module.exports = router; 