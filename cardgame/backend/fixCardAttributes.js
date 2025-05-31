const { pool } = require('./config/db');
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function fixCardAttributes() {
  try {
    console.log('=== 修复卡牌属性 ===\n');
    
    // 1. 获取所有用户卡牌
    const [userCards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.user_id,
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
      ORDER BY uc.user_id, uc.card_id
    `);
    
    console.log(`找到 ${userCards.length} 张用户卡牌`);
    
    // 2. 逐一修复每张卡牌的属性
    let fixedCount = 0;
    
    for (const card of userCards) {
      // 计算正确的属性值
      const correctAttack = calculateAttack(card.base_attack, card.rarity, card.card_level);
      const correctDefense = calculateDefense(card.base_defense, card.rarity, card.card_level);
      
      // 检查是否需要修复
      if (card.current_attack !== correctAttack || card.current_defense !== correctDefense) {
        console.log(`修复卡牌: ${card.card_name} (用户${card.user_id}) - 等级${card.card_level}`);
        console.log(`  当前: 攻击${card.current_attack}, 防御${card.current_defense}`);
        console.log(`  修复: 攻击${correctAttack}, 防御${correctDefense}`);
        
        // 更新数据库
        await pool.query(`
          UPDATE user_cards 
          SET current_attack = ?, current_defense = ?
          WHERE user_card_id = ?
        `, [correctAttack, correctDefense, card.user_card_id]);
        
        fixedCount++;
      }
    }
    
    console.log(`\n✅ 修复完成！共修复了 ${fixedCount} 张卡牌的属性`);
    
    // 3. 验证修复结果
    console.log('\n=== 验证修复结果 ===');
    const [sampleCards] = await pool.query(`
      SELECT 
        uc.user_id,
        c.card_name,
        c.rarity,
        uc.level as card_level,
        c.base_attack,
        c.base_defense,
        uc.current_attack,
        uc.current_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      ORDER BY uc.user_id, c.rarity DESC
      LIMIT 5
    `);
    
    sampleCards.forEach(card => {
      const expectedAttack = calculateAttack(card.base_attack, card.rarity, card.card_level);
      const expectedDefense = calculateDefense(card.base_defense, card.rarity, card.card_level);
      
      console.log(`${card.card_name} (${card.rarity}) 等级${card.card_level}:`);
      console.log(`  基础: 攻击${card.base_attack}, 防御${card.base_defense}`);
      console.log(`  当前: 攻击${card.current_attack}, 防御${card.current_defense}`);
      console.log(`  预期: 攻击${expectedAttack}, 防御${expectedDefense}`);
      console.log(`  正确: ${card.current_attack === expectedAttack && card.current_defense === expectedDefense ? '✅' : '❌'}\n`);
    });
    
  } catch (error) {
    console.error('修复卡牌属性失败:', error);
  } finally {
    process.exit(0);
  }
}

fixCardAttributes(); 