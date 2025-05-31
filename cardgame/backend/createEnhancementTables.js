const { pool } = require('./config/db');

async function createEnhancementTables() {
  try {
    console.log('开始创建强化材料表...');
    
    // 创建强化材料表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enhancement_items (
          item_id INT PRIMARY KEY AUTO_INCREMENT,
          item_name VARCHAR(50) NOT NULL,
          item_description TEXT,
          item_type ENUM('enhancement_stone', 'material', 'consumable') DEFAULT 'enhancement_stone',
          required_level INT DEFAULT 0,
          rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ enhancement_items 表创建成功');
    
    // 创建用户物品库存表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_enhancement_items (
          user_item_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          item_id INT NOT NULL,
          quantity INT DEFAULT 0,
          acquired_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES enhancement_items(item_id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_item (user_id, item_id)
      )
    `);
    console.log('✓ user_enhancement_items 表创建成功');
    
    // 插入强化石数据
    await pool.query(`
      INSERT IGNORE INTO enhancement_items (item_name, item_description, item_type, required_level, rarity) VALUES
      ('强化石I', '用于提升卡牌等级至20级的基础强化石', 'enhancement_stone', 20, 'common'),
      ('强化石II', '用于提升卡牌等级至40级的中级强化石', 'enhancement_stone', 40, 'rare'),
      ('强化石III', '用于提升卡牌等级至60级的高级强化石', 'enhancement_stone', 60, 'rare'),
      ('强化石IV', '用于提升卡牌等级至80级的超级强化石', 'enhancement_stone', 80, 'epic'),
      ('强化石V', '用于提升卡牌等级至100级的传说强化石', 'enhancement_stone', 100, 'legendary'),
      ('经验药水', '直接为卡牌提供经验值的神奇药水', 'consumable', 1, 'common'),
      ('属性精华', '永久提升卡牌基础属性的珍贵材料', 'material', 1, 'epic')
    `);
    console.log('✓ 强化材料数据插入成功');
    
    // 为所有现有用户添加初始强化石
    await pool.query(`
      INSERT INTO user_enhancement_items (user_id, item_id, quantity)
      SELECT u.user_id, ei.item_id, 
          CASE 
              WHEN ei.item_name = '强化石I' THEN 10
              WHEN ei.item_name = '强化石II' THEN 5
              WHEN ei.item_name = '强化石III' THEN 3
              WHEN ei.item_name = '强化石IV' THEN 2
              WHEN ei.item_name = '强化石V' THEN 1
              WHEN ei.item_name = '经验药水' THEN 20
              WHEN ei.item_name = '属性精华' THEN 5
              ELSE 0
          END as quantity
      FROM users u
      CROSS JOIN enhancement_items ei
      WHERE ei.item_type = 'enhancement_stone' OR ei.item_name IN ('经验药水', '属性精华')
      ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
    `);
    console.log('✓ 用户强化材料初始化成功');
    
    console.log('\n🎉 所有强化材料表创建完成！');
    
  } catch (error) {
    console.error('创建强化材料表失败:', error);
  } finally {
    process.exit(0);
  }
}

createEnhancementTables(); 