const { pool } = require('./config/db');
const { getUpgradePreview, calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function testUpgradePreview() {
  try {
    console.log('=== 测试升级预览一致性 ===\n');
    
    // 1. 获取一张卡牌进行测试
    const [cards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.card_id,
        uc.level as card_level,
        uc.current_attack,
        uc.current_defense,
        c.card_name,
        c.rarity,
        c.base_attack,
        c.base_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2 AND c.card_name = 'TralaleroTralala'
      LIMIT 1
    `);
    
    if (cards.length === 0) {
      console.log('❌ 找不到测试卡牌');
      return;
    }
    
    const card = cards[0];
    card.original_rarity = card.rarity;
    const targetLevel = card.card_level + 1;
    
    console.log('1. 测试卡牌信息:');
    console.log(`  卡牌: ${card.card_name}`);
    console.log(`  当前等级: ${card.card_level}`);
    console.log(`  当前攻击: ${card.current_attack}`);
    console.log(`  当前防御: ${card.current_defense}`);
    console.log(`  基础攻击: ${card.base_attack}`);
    console.log(`  基础防御: ${card.base_defense}`);
    console.log(`  稀有度: ${card.rarity}`);
    console.log(`  目标等级: ${targetLevel}`);
    
    // 2. 测试升级预览计算
    console.log('\n2. 升级预览计算:');
    try {
      const preview = getUpgradePreview(card, targetLevel);
      console.log(`  预览 - 升级后攻击: ${preview.newAttack}`);
      console.log(`  预览 - 升级后防御: ${preview.newDefense}`);
      console.log(`  预览 - 攻击增加: ${preview.attackIncrease}`);
      console.log(`  预览 - 防御增加: ${preview.defenseIncrease}`);
      
      // 3. 测试实际升级计算（模拟upgradeCard中的逻辑）
      console.log('\n3. 实际升级计算:');
      const actualNewAttack = calculateAttack(card.base_attack, card.rarity, targetLevel);
      const actualNewDefense = calculateDefense(card.base_defense, card.rarity, targetLevel);
      console.log(`  实际 - 升级后攻击: ${actualNewAttack}`);
      console.log(`  实际 - 升级后防御: ${actualNewDefense}`);
      console.log(`  实际 - 攻击增加: ${actualNewAttack - card.current_attack}`);
      console.log(`  实际 - 防御增加: ${actualNewDefense - card.current_defense}`);
      
      // 4. 验证一致性
      console.log('\n4. 一致性验证:');
      const attackMatch = preview.newAttack === actualNewAttack;
      const defenseMatch = preview.newDefense === actualNewDefense;
      
      console.log(`  攻击一致性: ${attackMatch ? '✅' : '❌'} (预览:${preview.newAttack} vs 实际:${actualNewAttack})`);
      console.log(`  防御一致性: ${defenseMatch ? '✅' : '❌'} (预览:${preview.newDefense} vs 实际:${actualNewDefense})`);
      
      if (attackMatch && defenseMatch) {
        console.log('\n🎉 升级预览和实际升级计算完全一致！');
      } else {
        console.log('\n❌ 升级预览和实际升级计算不一致，需要进一步检查');
      }
      
    } catch (error) {
      console.error('升级预览计算失败:', error.message);
    }
    
    // 5. 测试多个等级的一致性
    console.log('\n5. 多等级一致性测试:');
    for (let level = card.card_level + 1; level <= Math.min(card.card_level + 3, 100); level++) {
      try {
        const preview = getUpgradePreview(card, level);
        const actualAttack = calculateAttack(card.base_attack, card.rarity, level);
        const actualDefense = calculateDefense(card.base_defense, card.rarity, level);
        
        const consistent = preview.newAttack === actualAttack && preview.newDefense === actualDefense;
        const icon = consistent ? '✅' : '❌';
        
        console.log(`  等级${level}: ${icon} 攻击(${preview.newAttack}/${actualAttack}) 防御(${preview.newDefense}/${actualDefense})`);
      } catch (error) {
        console.log(`  等级${level}: ❌ 计算失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testUpgradePreview(); 