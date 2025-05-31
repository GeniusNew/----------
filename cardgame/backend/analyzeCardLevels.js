const { pool } = require('./config/db');

async function analyzeCardLevels() {
  try {
    console.log('=== 分析卡牌等级问题 ===\n');
    
    // 1. 检查用户2的卡牌等级分布
    console.log('1. 用户2的卡牌等级分布:');
    const [userCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.card_id,
        c.card_name,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2
      ORDER BY c.card_name, uc.user_card_id
      LIMIT 15
    `);
    
    userCards.forEach(card => {
      console.log(`  [${card.user_card_id}] ${card.card_name} (ID:${card.card_id}) - 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}`);
    });
    
    // 2. 按卡牌名称分组，查看同名卡牌的等级差异
    console.log('\n2. 同名卡牌等级差异分析:');
    const [groupedCards] = await pool.query(`
      SELECT 
        c.card_name,
        c.card_id,
        COUNT(*) as count,
        MIN(uc.level) as min_level,
        MAX(uc.level) as max_level,
        GROUP_CONCAT(DISTINCT uc.level) as all_levels
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2
      GROUP BY c.card_id, c.card_name
      HAVING COUNT(*) > 1
      ORDER BY c.card_name
    `);
    
    if (groupedCards.length > 0) {
      console.log('发现同名卡牌等级不一致的情况:');
      groupedCards.forEach(group => {
        if (group.min_level !== group.max_level) {
          console.log(`  ❌ ${group.card_name}: 数量${group.count}, 等级范围${group.min_level}-${group.max_level}, 所有等级:[${group.all_levels}]`);
        } else {
          console.log(`  ✅ ${group.card_name}: 数量${group.count}, 等级统一为${group.min_level}`);
        }
      });
    } else {
      console.log('没有重复的卡牌');
    }
    
    // 3. 检查是否有等级大于1的卡牌
    console.log('\n3. 等级大于1的卡牌:');
    const [highLevelCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        c.card_name,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2 AND uc.level > 1
      ORDER BY uc.level DESC
    `);
    
    if (highLevelCards.length > 0) {
      highLevelCards.forEach(card => {
        console.log(`  等级${card.level}: ${card.card_name} [${card.user_card_id}] 攻击:${card.current_attack} 防御:${card.current_defense}`);
      });
    } else {
      console.log('  没有等级大于1的卡牌');
    }
    
    console.log('\n=== 分析完成 ===');
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    process.exit(0);
  }
}

analyzeCardLevels(); 