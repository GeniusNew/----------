const { pool } = require('./config/db');

async function simpleTest() {
  try {
    console.log('=== 简单测试 ===');
    
    // 1. 测试字段是否存在
    console.log('1. 检查字段名...');
    const [columns] = await pool.query('SHOW COLUMNS FROM cards');
    const fields = columns.map(col => col.Field);
    console.log('找到字段:', fields);
    
    const hasBaseDefense = fields.includes('base_defense');
    const hasBaseDefemse = fields.includes('base_defemse');
    
    console.log('base_defense字段存在:', hasBaseDefense);
    console.log('base_defemse字段存在:', hasBaseDefemse);
    
    // 2. 测试基础查询
    console.log('\n2. 测试基础查询...');
    if (hasBaseDefense) {
      const [cards] = await pool.query('SELECT card_name, base_attack, base_defense FROM cards LIMIT 2');
      console.log('卡牌数据:');
      cards.forEach(card => {
        console.log(`  ${card.card_name}: 攻击${card.base_attack}, 防御${card.base_defense}`);
      });
    } else if (hasBaseDefemse) {
      const [cards] = await pool.query('SELECT card_name, base_attack, base_defemse FROM cards LIMIT 2');
      console.log('卡牌数据(旧字段):');
      cards.forEach(card => {
        console.log(`  ${card.card_name}: 攻击${card.base_attack}, 防御${card.base_defemse}`);
      });
    }
    
    // 3. 测试用户卡牌
    console.log('\n3. 测试用户卡牌...');
    const [userCards] = await pool.query('SELECT COUNT(*) as count FROM user_cards');
    console.log('用户卡牌总数:', userCards[0].count);
    
    console.log('\n✅ 所有测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    process.exit(0);
  }
}

simpleTest(); 