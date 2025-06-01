const express = require('express');
const router = express.Router();
const dungeonController = require('../controllers/dungeonController');
const authMiddleware = require('../middleware/authMiddleware');

// 获取所有副本列表
router.get('/list', authMiddleware, dungeonController.getDungeonList);

// 获取副本详情（包含敌人信息）
router.get('/:dungeonId', authMiddleware, dungeonController.getDungeonDetail);

module.exports = router; 