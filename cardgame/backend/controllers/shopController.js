const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// 获取商店商品列表
const getShopItems = async (req, res) => {
  try {
    console.log('获取商店商品列表');
    
    // 定义商店商品数据
    const shopItems = [
      // 金币包
      {
        id: 'gold_small',
        name: '小金币包',
        description: '获得1,000金币',
        type: 'gold',
        gems_cost: 10,
        reward_type: 'coins',
        reward_amount: 1000,
        icon: '🪙',
        category: 'gold'
      },
      {
        id: 'gold_medium',
        name: '中金币包',
        description: '获得5,000金币',
        type: 'gold',
        gems_cost: 45,
        reward_type: 'coins',
        reward_amount: 5000,
        icon: '🪙',
        category: 'gold'
      },
      {
        id: 'gold_large',
        name: '大金币包',
        description: '获得10,000金币',
        type: 'gold',
        gems_cost: 80,
        reward_type: 'coins',
        reward_amount: 10000,
        icon: '🪙',
        category: 'gold'
      },
      {
        id: 'gold_mega',
        name: '超大金币包',
        description: '获得25,000金币',
        type: 'gold',
        gems_cost: 180,
        reward_type: 'coins',
        reward_amount: 25000,
        icon: '🪙',
        category: 'gold'
      },
      
      // 强化材料
      {
        id: 'stone_1',
        name: '大物实验教程',
        description: '用于20级突破的大学物理实验教程',
        type: 'enhancement',
        gems_cost: 20,
        reward_type: 'enhancement_item',
        reward_item: '大物实验教程',
        reward_amount: 1,
        icon: '🔸',
        category: 'enhancement'
      },
      {
        id: 'stone_2',
        name: '量子物理教材',
        description: '用于40级突破的量子物理学教材',
        type: 'enhancement',
        gems_cost: 50,
        reward_type: 'enhancement_item',
        reward_item: '量子物理教材',
        reward_amount: 1,
        icon: '🔹',
        category: 'enhancement'
      },
      {
        id: 'stone_3',
        name: '数学分析练习册',
        description: '用于60级突破的数学分析练习册',
        type: 'enhancement',
        gems_cost: 100,
        reward_type: 'enhancement_item',
        reward_item: '数学分析练习册',
        reward_amount: 1,
        icon: '💎',
        category: 'enhancement'
      },
      {
        id: 'stone_4',
        name: '线性代数试卷',
        description: '用于80级突破的线性代数试卷',
        type: 'enhancement',
        gems_cost: 200,
        reward_type: 'enhancement_item',
        reward_item: '线性代数试卷',
        reward_amount: 1,
        icon: '💠',
        category: 'enhancement'
      },
      {
        id: 'stone_5',
        name: '毕业论文代写',
        description: '用于100级突破的终极学业代写服务',
        type: 'enhancement',
        gems_cost: 500,
        reward_type: 'enhancement_item',
        reward_item: '毕业论文代写',
        reward_amount: 1,
        icon: '⭐',
        category: 'enhancement'
      },
      
      // 特殊商品
      {
        id: 'exp_potion',
        name: '红专并进',
        description: '体现红专并进精神的神奇药水，可直接提升卡牌1级',
        type: 'consumable',
        gems_cost: 15,
        reward_type: 'enhancement_item',
        reward_item: '红专并进',
        reward_amount: 1,
        icon: '🧪',
        category: 'consumable'
      },
      {
        id: 'attribute_essence',
        name: '数理基础',
        description: '加强数理基础的珍贵材料，永久提升攻击防御各5点',
        type: 'material',
        gems_cost: 150,
        reward_type: 'enhancement_item',
        reward_item: '数理基础',
        reward_amount: 1,
        icon: '✨',
        category: 'material'
      }
    ];
    
    return res.status(200).json({
      success: true,
      items: shopItems
    });
  } catch (error) {
    console.error('获取商店商品失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '获取商店商品失败，请稍后再试' 
    });
  }
};

// 购买商品
const purchaseItem = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    const userId = decoded.userId;
    
    console.log('=== 商店购买请求开始 ===');
    console.log('用户ID:', userId);
    console.log('商品ID:', itemId);
    console.log('购买数量:', quantity);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: '未授权，请重新登录' 
      });
    }
    
    if (!itemId || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: '参数无效' 
      });
    }
    
    // 获取商品信息 (这里重新定义，在实际项目中应该从数据库获取)
    const shopItems = [
      { id: 'gold_small', gems_cost: 10, reward_type: 'coins', reward_amount: 1000 },
      { id: 'gold_medium', gems_cost: 45, reward_type: 'coins', reward_amount: 5000 },
      { id: 'gold_large', gems_cost: 80, reward_type: 'coins', reward_amount: 10000 },
      { id: 'gold_mega', gems_cost: 180, reward_type: 'coins', reward_amount: 25000 },
      { id: 'stone_1', gems_cost: 20, reward_type: 'enhancement_item', reward_item: '大物实验教程', reward_amount: 1 },
      { id: 'stone_2', gems_cost: 50, reward_type: 'enhancement_item', reward_item: '量子物理教材', reward_amount: 1 },
      { id: 'stone_3', gems_cost: 100, reward_type: 'enhancement_item', reward_item: '数学分析练习册', reward_amount: 1 },
      { id: 'stone_4', gems_cost: 200, reward_type: 'enhancement_item', reward_item: '线性代数试卷', reward_amount: 1 },
      { id: 'stone_5', gems_cost: 500, reward_type: 'enhancement_item', reward_item: '毕业论文代写', reward_amount: 1 },
      { id: 'exp_potion', gems_cost: 15, reward_type: 'enhancement_item', reward_item: '红专并进', reward_amount: 1 },
      { id: 'attribute_essence', gems_cost: 150, reward_type: 'enhancement_item', reward_item: '数理基础', reward_amount: 1 }
    ];
    
    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }
    
    const totalCost = item.gems_cost * quantity;
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. 检查用户钻石是否足够
      const [userRows] = await connection.query(`
        SELECT diamonds FROM users WHERE user_id = ?
      `, [userId]);
      
      if (userRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ 
          success: false, 
          message: '用户不存在' 
        });
      }
      
      if (userRows[0].diamonds < totalCost) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ 
          success: false, 
          message: `钻石不足，需要${totalCost}钻石` 
        });
      }
      
      // 2. 扣除钻石
      await connection.query(`
        UPDATE users SET diamonds = diamonds - ? WHERE user_id = ?
      `, [totalCost, userId]);
      
      // 3. 根据奖励类型发放奖励
      if (item.reward_type === 'coins') {
        // 增加金币
        await connection.query(`
          UPDATE users SET coins = coins + ? WHERE user_id = ?
        `, [item.reward_amount * quantity, userId]);
      } else if (item.reward_type === 'enhancement_item') {
        // 增加强化物品
        await connection.query(`
          INSERT INTO user_enhancement_items (user_id, item_id, quantity)
          SELECT ?, ei.item_id, ?
          FROM enhancement_items ei
          WHERE ei.item_name = ?
          ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [userId, item.reward_amount * quantity, item.reward_item]);
      }
      
      // 4. 获取更新后的用户资源
      const [updatedUser] = await connection.query(`
        SELECT diamonds as gems, coins FROM users WHERE user_id = ?
      `, [userId]);
      
      await connection.commit();
      connection.release();
      
      console.log(`购买成功: 用户${userId}购买了${quantity}个${itemId}，花费${totalCost}钻石`);
      
      let rewardMessage = '';
      if (item.reward_type === 'coins') {
        rewardMessage = `获得${item.reward_amount * quantity}金币`;
      } else if (item.reward_type === 'enhancement_item') {
        rewardMessage = `获得${item.reward_amount * quantity}个${item.reward_item}`;
      }
      
      return res.status(200).json({
        success: true,
        message: `购买成功！${rewardMessage}`,
        newUserResources: updatedUser[0],
        purchased: {
          itemId: itemId,
          quantity: quantity,
          totalCost: totalCost,
          reward: rewardMessage
        }
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('购买商品失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '购买失败，请稍后再试' 
    });
  }
};

module.exports = {
  getShopItems,
  purchaseItem
}; 