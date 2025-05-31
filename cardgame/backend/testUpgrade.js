const { pool } = require('./config/db');
const { getUpgradePreview, calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function testUpgrade() {
  try {
    console.log('=== 测试升级功能 ===\n');
    
    // 1. 获取用户1的第一张卡牌
    const [userCards] = await pool.query(`
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
      WHERE uc.user_id = 1
      LIMIT 1
    `);
    
    if (userCards.length === 0) {
      console.log('用户1没有卡牌！');
      return;
    }
    
    const card = userCards[0];
    console.log('测试卡牌:', card);
    
    // 2. 测试升级预览
    card.original_rarity = card.rarity;
    const targetLevel = Math.min(100, card.card_level + 5); // 升级5级
    const preview = getUpgradePreview(card, targetLevel);
    console.log('升级预览:', preview);
    
    // 3. 检查用户资源
    const [userResources] = await pool.query(`
      SELECT coins, diamonds FROM users WHERE user_id = 1
    `);
    console.log('用户资源:', userResources[0]);
    
    // 4. 检查强化材料
    const [enhancementItems] = await pool.query(`
      SELECT uei.quantity, ei.item_name
      FROM user_enhancement_items uei
      JOIN enhancement_items ei ON uei.item_id = ei.item_id
      WHERE uei.user_id = 1
    `);
    console.log('用户强化材料:');
    enhancementItems.forEach(item => {
      console.log(`  ${item.item_name}: ${item.quantity}个`);
    });
    
    // 5. 检查是否可以升级
    const canUpgrade = userResources[0].coins >= preview.goldCost &&
      preview.requiredItems.every(requiredItem => {
        const userItem = enhancementItems.find(ei => ei.item_name === requiredItem.itemName);
        return userItem && userItem.quantity >= requiredItem.quantity;
      });
    
    console.log('\n升级检查结果:');
    console.log(`  金币充足: ${userResources[0].coins >= preview.goldCost ? '是' : '否'} (需要${preview.goldCost}, 拥有${userResources[0].coins})`);
    console.log(`  材料充足: ${preview.requiredItems.length === 0 ? '无需材料' : preview.requiredItems.map(item => {
      const userItem = enhancementItems.find(ei => ei.item_name === item.itemName);
      return `${item.itemName}(需要${item.quantity}, 拥有${userItem ? userItem.quantity : 0})`;
    }).join(', ')}`);
    console.log(`  可以升级: ${canUpgrade ? '是' : '否'}`);
    
  } catch (error) {
    console.error('测试升级功能失败:', error);
  } finally {
    process.exit(0);
  }
}

testUpgrade(); 