const { pool } = require('./config/db');

async function testItemUsage() {
  try {
    console.log('=== 测试道具使用功能 ===\n');
    
    // 1. 获取测试用户的卡牌
    const [cards] = await pool.query(`
      SELECT 
        uc.user_card_id,
        uc.card_id,
        uc.level,
        uc.current_attack,
        uc.current_defense,
        c.card_name,
        c.rarity,
        c.base_attack,
        c.base_defense
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = 2
      LIMIT 1
    `);
    
    if (cards.length === 0) {
      console.log('❌ 找不到测试卡牌');
      return;
    }
    
    const card = cards[0];
    console.log('1. 测试卡牌信息:');
    console.log(`  卡牌: ${card.card_name}`);
    console.log(`  等级: ${card.level}`);
    console.log(`  攻击: ${card.current_attack}`);
    console.log(`  防御: ${card.current_defense}`);
    console.log(`  基础攻击: ${card.base_attack}`);
    console.log(`  基础防御: ${card.base_defense}`);
    
    // 2. 检查用户的道具
    const [items] = await pool.query(`
      SELECT uei.quantity, ei.item_name, ei.item_description
      FROM user_enhancement_items uei
      JOIN enhancement_items ei ON uei.item_id = ei.item_id
      WHERE uei.user_id = 2 AND ei.item_name IN ('红专并进', '数理基础')
    `);
    
    console.log('\n2. 用户道具库存:');
    items.forEach(item => {
      console.log(`  ${item.item_name}: ${item.quantity}个`);
      console.log(`    ${item.item_description}`);
    });
    
    // 3. 检查是否有重命名的道具
    const [allItems] = await pool.query(`
      SELECT ei.item_name, ei.item_description
      FROM enhancement_items ei
      WHERE ei.item_name IN (
        '大物实验教程', '量子物理教材', '数学分析练习册', 
        '线性代数试卷', '毕业论文代写', '红专并进', '数理基础'
      )
      ORDER BY ei.item_id
    `);
    
    console.log('\n3. 所有重命名的道具:');
    allItems.forEach(item => {
      console.log(`  ✓ ${item.item_name}: ${item.item_description}`);
    });
    
    // 4. 模拟道具使用效果预览
    console.log('\n4. 道具使用效果预览:');
    
    const expPotionItem = items.find(item => item.item_name === '红专并进');
    if (expPotionItem && expPotionItem.quantity > 0) {
      console.log('\n  红专并进效果:');
      console.log(`    当前等级: ${card.level}`);
      if (card.level < 100) {
        console.log(`    使用后等级: ${card.level + 1}`);
        console.log(`    ✓ 可以使用 (剩余${expPotionItem.quantity}个)`);
      } else {
        console.log(`    ❌ 卡牌已达到最高等级，无法使用`);
      }
    } else {
      console.log('\n  ❌ 没有红专并进道具');
    }
    
    const attributeItem = items.find(item => item.item_name === '数理基础');
    if (attributeItem && attributeItem.quantity > 0) {
      console.log('\n  数理基础效果:');
      console.log(`    当前攻击: ${card.current_attack}`);
      console.log(`    当前防御: ${card.current_defense}`);
      console.log(`    使用后攻击: ${card.current_attack + 5}`);
      console.log(`    使用后防御: ${card.current_defense + 5}`);
      console.log(`    ✓ 可以使用 (剩余${attributeItem.quantity}个)`);
    } else {
      console.log('\n  ❌ 没有数理基础道具');
    }
    
    console.log('\n🎉 道具使用功能测试完成！');
    console.log('\n📝 使用说明:');
    console.log('  - 红专并进: 直接提升卡牌1级，无视升级消耗');
    console.log('  - 数理基础: 永久提升攻击力和防御力各5点');
    console.log('  - 在培养界面可以直接点击"使用"按钮');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testItemUsage(); 