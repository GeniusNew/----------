const { pool } = require('./config/db'); 
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

async function upgradeCard() {
  try {
    // 将刚添加的卡牌升级到5级
    const targetLevel = 5;
    const cardId = 21; // BombardiroCrocodilo
    const userId = 1; // example用户
    
    // 获取卡牌基础属性
    const [cardInfo] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [cardId]);
    const card = cardInfo[0];
    
    // 计算新属性
    const newAttack = calculateAttack(card.base_attack, card.rarity, targetLevel);
    const newDefense = calculateDefense(card.base_defense || card.base_defemse || 0, card.rarity, targetLevel);
    
    console.log('升级卡牌到5级...');
    console.log(`新属性: 攻击${newAttack}, 防御${newDefense}`);
    
    // 更新所有同种卡牌
    await pool.query(
      'UPDATE user_cards SET level = ?, current_attack = ?, current_defense = ? WHERE user_id = ? AND card_id = ?',
      [targetLevel, newAttack, newDefense, userId, cardId]
    );
    
    console.log('升级完成!');
    process.exit(0);
  } catch (error) {
    console.error('升级失败:', error);
    process.exit(1);
  }
}

upgradeCard(); 