const { pool } = require('./config/db');

async function testNewUpgradeLogic() {
  try {
    console.log('=== 测试新的升级逻辑 ===\n');
    
    // 1. 查看升级前的状态
    console.log('1. 升级前的状态:');
    const [beforeCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        c.card_name,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2 AND c.card_name = 'TralaleroTralala'
      ORDER BY uc.user_card_id
    `);
    
    console.log('TralaleroTralala 卡牌状态:');
    beforeCards.forEach(card => {
      console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}`);
    });
    
    // 2. 模拟升级请求
    console.log('\n2. 模拟升级一张TralaleroTralala到等级10...');
    
    const targetCardId = beforeCards[0].user_card_id;
    console.log(`选择卡牌ID: ${targetCardId} 进行升级`);
    
    // 获取卡牌信息用于计算
    const [cardInfo] = await pool.query(`
      SELECT 
        uc.card_id,
        c.card_name,
        c.rarity,
        c.base_attack,
        c.base_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_card_id = ?
    `, [targetCardId]);
    
    if (cardInfo.length === 0) {
      console.log('❌ 找不到目标卡牌');
      return;
    }
    
    const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');
    const card = cardInfo[0];
    const targetLevel = 10;
    
    // 计算新属性
    const newAttack = calculateAttack(card.base_attack, card.rarity, targetLevel);
    const newDefense = calculateDefense(card.base_defense, card.rarity, targetLevel);
    
    console.log(`计算结果: 等级${targetLevel} -> 攻击:${newAttack}, 防御:${newDefense}`);
    
    // 3. 执行升级（模拟新逻辑）
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 使用新逻辑：更新该用户所有同种卡牌
      const [updateResult] = await connection.query(`
        UPDATE user_cards 
        SET level = ?, current_attack = ?, current_defense = ?
        WHERE user_id = ? AND card_id = ?
      `, [targetLevel, newAttack, newDefense, 2, card.card_id]);
      
      console.log(`✅ 已更新 ${updateResult.affectedRows} 张同种卡牌`);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    // 4. 查看升级后的状态
    console.log('\n3. 升级后的状态:');
    const [afterCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        c.card_name,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2 AND c.card_name = 'TralaleroTralala'
      ORDER BY uc.user_card_id
    `);
    
    console.log('TralaleroTralala 卡牌状态:');
    let allSameLevel = true;
    const firstLevel = afterCards[0]?.level;
    
    afterCards.forEach(card => {
      const statusIcon = card.level === firstLevel ? '✅' : '❌';
      console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense} ${statusIcon}`);
      if (card.level !== firstLevel) allSameLevel = false;
    });
    
    // 5. 验证结果
    console.log('\n4. 验证结果:');
    if (allSameLevel) {
      console.log(`✅ 所有同种卡牌等级已统一为 ${firstLevel}`);
    } else {
      console.log('❌ 同种卡牌等级仍不统一');
    }
    
    if (afterCards.length > 0 && afterCards[0].level === targetLevel) {
      console.log('✅ 升级目标等级正确');
    } else {
      console.log('❌ 升级目标等级不正确');
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testNewUpgradeLogic(); 