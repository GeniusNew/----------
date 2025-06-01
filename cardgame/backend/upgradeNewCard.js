const { pool } = require('./config/db'); 
const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

(async () => {
  try {
    const targetLevel = 3;
    const cardId = 22; // BonecaAmbalam
    const userId = 1;
    
    const [cardInfo] = await pool.query('SELECT * FROM cards WHERE card_id = ?', [cardId]);
    const card = cardInfo[0];
    
    const newAttack = calculateAttack(card.base_attack, card.rarity, targetLevel);
    const newDefense = calculateDefense(card.base_defense || card.base_defemse || 0, card.rarity, targetLevel);
    
    await pool.query('UPDATE user_cards SET level = ?, current_attack = ?, current_defense = ? WHERE user_id = ? AND card_id = ?', [targetLevel, newAttack, newDefense, userId, cardId]);
    
    console.log('BonecaAmbalam升级到3级完成!');
    process.exit(0);
  } catch (error) {
    console.error('失败:', error);
    process.exit(1);
  }
})(); 