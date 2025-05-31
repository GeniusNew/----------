const { pool } = require('./config/db');
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function unifyCardLevels() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('=== 统一同种卡牌等级 ===\n');
    
    // 1. 找出每个用户每种卡牌的最高等级
    console.log('1. 分析需要统一的卡牌...');
    const [maxLevels] = await connection.query(`
      SELECT 
        uc.user_id,
        uc.card_id,
        c.card_name,
        MAX(uc.level) as max_level,
        COUNT(*) as card_count
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      GROUP BY uc.user_id, uc.card_id
      HAVING COUNT(*) > 1 OR MAX(uc.level) > 1
      ORDER BY uc.user_id, c.card_name
    `);
    
    console.log(`找到 ${maxLevels.length} 种需要统一等级的卡牌:`);
    maxLevels.forEach(item => {
      console.log(`  用户${item.user_id}: ${item.card_name} (${item.card_count}张) -> 统一到等级${item.max_level}`);
    });
    
    // 2. 对每种卡牌进行等级统一
    let totalUpdated = 0;
    
    for (const levelInfo of maxLevels) {
      const { user_id, card_id, max_level, card_name } = levelInfo;
      
      // 获取卡牌基础属性
      const [cardInfo] = await connection.query(`
        SELECT base_attack, base_defense, rarity
        FROM cards 
        WHERE card_id = ?
      `, [card_id]);
      
      if (cardInfo.length === 0) continue;
      
      const card = cardInfo[0];
      card.original_rarity = card.rarity;
      
      // 计算目标等级的属性
      const newAttack = calculateAttack(card.base_attack, card.rarity, max_level);
      const newDefense = calculateDefense(card.base_defense, card.rarity, max_level);
      
      // 更新该用户该种卡牌的所有副本
      const [updateResult] = await connection.query(`
        UPDATE user_cards 
        SET 
          level = ?,
          current_attack = ?,
          current_defense = ?
        WHERE user_id = ? AND card_id = ?
      `, [max_level, newAttack, newDefense, user_id, card_id]);
      
      totalUpdated += updateResult.affectedRows;
      console.log(`  ✅ 用户${user_id}的${card_name}: ${updateResult.affectedRows}张卡牌已统一到等级${max_level} (攻击:${newAttack}, 防御:${newDefense})`);
    }
    
    // 3. 验证统一结果
    console.log('\n2. 验证统一结果...');
    const [verifyResults] = await connection.query(`
      SELECT 
        uc.user_id,
        c.card_name,
        COUNT(*) as card_count,
        MIN(uc.level) as min_level,
        MAX(uc.level) as max_level,
        GROUP_CONCAT(DISTINCT uc.level) as all_levels
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2
      GROUP BY uc.user_id, uc.card_id
      HAVING COUNT(*) > 1
      ORDER BY c.card_name
    `);
    
    console.log('用户2的卡牌等级统一验证:');
    let allUnified = true;
    verifyResults.forEach(result => {
      if (result.min_level === result.max_level) {
        console.log(`  ✅ ${result.card_name}: ${result.card_count}张, 等级统一为${result.min_level}`);
      } else {
        console.log(`  ❌ ${result.card_name}: ${result.card_count}张, 等级不统一[${result.all_levels}]`);
        allUnified = false;
      }
    });
    
    await connection.commit();
    
    console.log(`\n🎉 统一完成！共更新了 ${totalUpdated} 张卡牌`);
    if (allUnified) {
      console.log('✅ 所有同种卡牌等级已成功统一！');
    } else {
      console.log('❌ 仍有部分卡牌等级未统一，请检查');
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 统一失败:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

unifyCardLevels(); 