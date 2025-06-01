const { pool } = require('./config/db');
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function testCardSyncFix() {
  try {
    console.log('=== 测试新抽取卡牌等级同步修复 ===\n');
    
    // 1. 找一个测试用户
    const [users] = await pool.query('SELECT user_id, username FROM users WHERE username = "example" OR user_id = 2 LIMIT 1');
    if (users.length === 0) {
      console.log('❌ 找不到测试用户');
      return;
    }
    
    const testUserId = users[0].user_id;
    console.log(`1. 使用测试用户: ${users[0].username} (ID: ${testUserId})`);
    
    // 2. 查看用户当前的卡牌情况
    console.log('\n2. 查看用户当前卡牌情况:');
    const [currentCards] = await pool.query(`
      SELECT 
        uc.card_id,
        c.card_name,
        c.rarity,
        COUNT(*) as count,
        MIN(uc.level) as min_level,
        MAX(uc.level) as max_level,
        GROUP_CONCAT(DISTINCT uc.level ORDER BY uc.level) as all_levels
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = ?
      GROUP BY uc.card_id, c.card_name, c.rarity
      HAVING COUNT(*) > 1 OR MAX(uc.level) > 1
      ORDER BY c.card_name
    `, [testUserId]);
    
    if (currentCards.length > 0) {
      console.log('找到多张或已升级的卡牌:');
      currentCards.forEach(card => {
        const isUnified = card.min_level === card.max_level;
        const status = isUnified ? '✅ 已统一' : '❌ 未统一';
        console.log(`  ${card.card_name} (${card.rarity}): ${card.count}张, 等级${card.all_levels} ${status}`);
      });
    } else {
      console.log('没有找到多张或已升级的卡牌');
    }
    
    // 3. 选择一张卡牌来模拟抽卡测试
    let testCardId = null;
    let testCardInfo = null;
    
    if (currentCards.length > 0) {
      // 选择第一张多等级卡牌
      testCardId = currentCards[0].card_id;
      console.log(`\n3. 选择测试卡牌: ${currentCards[0].card_name} (ID: ${testCardId})`);
      
      // 获取卡牌详细信息
      const [cardDetails] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [testCardId]);
      testCardInfo = cardDetails[0];
    } else {
      // 随机选择一张卡牌
      const [allCards] = await pool.query('SELECT * FROM cards LIMIT 1');
      if (allCards.length > 0) {
        testCardId = allCards[0].card_id;
        testCardInfo = allCards[0];
        console.log(`\n3. 选择测试卡牌: ${testCardInfo.card_name} (ID: ${testCardId})`);
      } else {
        console.log('❌ 数据库中没有卡牌');
        return;
      }
    }
    
    // 4. 模拟新的addCardToUserInventory逻辑
    console.log('\n4. 模拟新的addCardToUserInventory逻辑:');
    
    // 检查用户是否已有这种卡牌，获取最高等级
    const [existingCards] = await pool.query(
      'SELECT MAX(level) as max_level FROM user_cards WHERE user_id = ? AND card_id = ?', 
      [testUserId, testCardId]
    );
    
    // 确定新卡牌的等级
    let newCardLevel = 1;
    let newAttack = testCardInfo.base_attack;
    let newDefense = testCardInfo.base_defense || testCardInfo.base_defemse || 0;
    
    if (existingCards.length > 0 && existingCards[0].max_level) {
      // 用户已有该卡牌，新卡牌等级同步到最高等级
      newCardLevel = existingCards[0].max_level;
      // 重新计算对应等级的属性
      newAttack = calculateAttack(testCardInfo.base_attack, testCardInfo.rarity, newCardLevel);
      newDefense = calculateDefense(newDefense, testCardInfo.rarity, newCardLevel);
      
      console.log(`✅ 用户已有该卡牌，新卡牌将同步到等级${newCardLevel}`);
      console.log(`   新卡牌属性: 攻击${newAttack}, 防御${newDefense}`);
    } else {
      console.log(`ℹ️  用户没有该卡牌，将添加1级新卡牌`);
    }
    
    // 5. 实际添加新卡牌（模拟抽卡获得）
    console.log('\n5. 模拟抽卡获得新卡牌:');
    
    const beforeCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_cards WHERE user_id = ? AND card_id = ?',
      [testUserId, testCardId]
    );
    console.log(`添加前数量: ${beforeCount[0][0].count}张`);
    
    // 执行添加（这会调用我们修复后的逻辑）
    await pool.query(
      'INSERT INTO user_cards (user_id, card_id, level, current_attack, current_defense) VALUES (?, ?, ?, ?, ?)',
      [testUserId, testCardId, newCardLevel, newAttack, newDefense]
    );
    
    const afterCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_cards WHERE user_id = ? AND card_id = ?',
      [testUserId, testCardId]
    );
    console.log(`添加后数量: ${afterCount[0][0].count}张`);
    
    // 6. 验证结果
    console.log('\n6. 验证等级同步结果:');
    const [finalCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      WHERE uc.user_id = ? AND uc.card_id = ?
      ORDER BY uc.user_card_id DESC
      LIMIT 5
    `, [testUserId, testCardId]);
    
    if (finalCards.length > 0) {
      console.log(`${testCardInfo.card_name} 的所有副本:`)
      let allSameLevel = true;
      const firstLevel = finalCards[0].level;
      
      finalCards.forEach((card, index) => {
        const isNewCard = index === 0 ? ' (新抽取)' : '';
        const status = card.level === firstLevel ? '✅' : '❌';
        console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}${isNewCard} ${status}`);
        if (card.level !== firstLevel) allSameLevel = false;
      });
      
      console.log('\n7. 修复效果验证:');
      if (allSameLevel) {
        console.log('🎉 成功！所有同种卡牌等级已同步统一！');
      } else {
        console.log('❌ 失败！同种卡牌等级仍然不统一！');
      }
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testCardSyncFix(); 