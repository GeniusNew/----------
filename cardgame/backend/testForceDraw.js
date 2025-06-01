const { pool } = require('./config/db');
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function testForceDraw() {
  try {
    console.log('=== 测试强制抽取同种卡牌等级同步 ===\n');
    
    const userId = 1; // example用户
    const cardId = 22; // BonecaAmbalam，刚升级到3级的卡牌
    
    // 1. 查看现有卡牌状态
    console.log('1. 查看现有卡牌状态:');
    const [existingCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.level,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      WHERE uc.user_id = ? AND uc.card_id = ?
      ORDER BY uc.user_card_id
    `, [userId, cardId]);
    
    const [cardInfo] = await pool.query('SELECT card_name, rarity FROM cards WHERE card_id = ?', [cardId]);
    const cardName = cardInfo[0].card_name;
    
    console.log(`${cardName} 现有副本:`);
    existingCards.forEach(card => {
      console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}`);
    });
    
    // 2. 使用修复后的addCardToUserInventory逻辑
    console.log('\n2. 模拟抽到相同卡牌（使用修复后的逻辑）:');
    
    // 获取卡牌信息
    const [cardDetails] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [cardId]);
    const card = cardDetails[0];
    
    // 检查用户是否已有这种卡牌，获取最高等级
    const [maxLevelResult] = await pool.query(
      'SELECT MAX(level) as max_level FROM user_cards WHERE user_id = ? AND card_id = ?', 
      [userId, cardId]
    );
    
    // 确定新卡牌的等级
    let newCardLevel = 1;
    let newAttack = card.base_attack;
    let newDefense = card.base_defense || card.base_defemse || 0;
    
    if (maxLevelResult.length > 0 && maxLevelResult[0].max_level) {
      // 用户已有该卡牌，新卡牌等级同步到最高等级
      newCardLevel = maxLevelResult[0].max_level;
      // 重新计算对应等级的属性
      newAttack = calculateAttack(card.base_attack, card.rarity, newCardLevel);
      newDefense = calculateDefense(newDefense, card.rarity, newCardLevel);
      
      console.log(`✅ 检测到用户已有该卡牌，新卡牌将同步到等级${newCardLevel}`);
      console.log(`   计算新卡牌属性: 攻击${newAttack}, 防御${newDefense}`);
    } else {
      console.log(`ℹ️  用户没有该卡牌，将添加1级新卡牌`);
    }
    
    // 3. 添加新卡牌
    console.log('\n3. 添加新卡牌到用户库存:');
    await pool.query(
      'INSERT INTO user_cards (user_id, card_id, level, current_attack, current_defense) VALUES (?, ?, ?, ?, ?)',
      [userId, cardId, newCardLevel, newAttack, newDefense]
    );
    console.log('新卡牌添加完成!');
    
    // 4. 验证结果
    console.log('\n4. 验证等级同步结果:');
    const [finalCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.level,
        uc.current_attack,
        uc.current_defense,
        uc.acquired_time
      FROM user_cards uc
      WHERE uc.user_id = ? AND uc.card_id = ?
      ORDER BY uc.acquired_time DESC
    `, [userId, cardId]);
    
    console.log(`${cardName} 所有副本 (按获得时间排序):`);
    let allSameLevel = true;
    const expectedLevel = finalCards[0].level;
    
    finalCards.forEach((card, index) => {
      const isNewCard = index === 0 ? ' (新抽取)' : '';
      const status = card.level === expectedLevel ? '✅' : '❌';
      console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}${isNewCard} ${status}`);
      if (card.level !== expectedLevel) allSameLevel = false;
    });
    
    // 5. 最终验证
    console.log('\n5. 等级同步修复验证:');
    if (allSameLevel) {
      console.log('🎉 修复成功！新抽取的卡牌成功同步到已有卡牌的最高等级！');
      console.log(`   所有 ${cardName} 卡牌都统一为等级 ${expectedLevel}`);
    } else {
      console.log('❌ 修复失败！同种卡牌等级仍然不统一！');
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testForceDraw(); 