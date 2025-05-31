const { pool } = require('./config/db');

async function checkEnhancementData() {
  try {
    console.log('=== 检查强化材料数据 ===\n');
    
    // 1. 检查强化材料表
    const [items] = await pool.query('SELECT * FROM enhancement_items');
    console.log('强化材料表数据:');
    items.forEach(item => {
      console.log(`  ID: ${item.item_id}, 名称: ${item.item_name}, 稀有度: ${item.rarity}`);
    });
    console.log('');
    
    // 2. 检查用户强化材料
    const [userItems] = await pool.query(`
      SELECT uei.*, ei.item_name 
      FROM user_enhancement_items uei 
      JOIN enhancement_items ei ON uei.item_id = ei.item_id 
      WHERE uei.user_id = 1
    `);
    console.log('用户1的强化材料:');
    if (userItems.length === 0) {
      console.log('  用户1没有任何强化材料！');
    } else {
      userItems.forEach(item => {
        console.log(`  ${item.item_name}: ${item.quantity}个`);
      });
    }
    console.log('');
    
    // 3. 检查用户卡牌
    const [userCards] = await pool.query(`
      SELECT uc.*, c.card_name, c.rarity 
      FROM user_cards uc 
      JOIN cards c ON uc.card_id = c.card_id 
      WHERE uc.user_id = 1 
      LIMIT 3
    `);
    console.log('用户1的卡牌样例:');
    userCards.forEach(card => {
      console.log(`  ${card.card_name} (${card.rarity}) - 等级: ${card.level}, 攻击: ${card.current_attack}, 防御: ${card.current_defense}`);
    });
    console.log('');
    
    // 4. 如果用户没有强化材料，添加一些测试材料
    if (userItems.length === 0) {
      console.log('正在为用户1添加测试强化材料...');
      
      // 添加各种强化石
      const enhancementData = [
        { itemName: '大物实验教程', quantity: 10 },
        { itemName: '量子物理教材', quantity: 5 },
        { itemName: '数学分析练习册', quantity: 3 },
        { itemName: '线性代数试卷', quantity: 2 },
        { itemName: '毕业论文代写', quantity: 1 },
        { itemName: '红专并进', quantity: 20 },
        { itemName: '数理基础', quantity: 5 }
      ];
      
      for (const data of enhancementData) {
        await pool.query(`
          INSERT INTO user_enhancement_items (user_id, item_id, quantity)
          SELECT 1, ei.item_id, ?
          FROM enhancement_items ei
          WHERE ei.item_name = ?
          ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [data.quantity, data.itemName]);
        console.log(`  添加了 ${data.quantity} 个 ${data.itemName}`);
      }
      console.log('强化材料添加完成！\n');
    }
    
  } catch (error) {
    console.error('检查强化材料数据失败:', error);
  } finally {
    process.exit(0);
  }
}

checkEnhancementData(); 