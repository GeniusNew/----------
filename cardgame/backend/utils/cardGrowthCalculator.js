// 卡牌成长曲线计算器

/**
 * 根据稀有度获取成长系数
 */
const getGrowthMultiplier = (rarity) => {
  const multipliers = {
    'N': { attack: 1.0, defense: 1.0, baseBonus: 1.0 },
    'R': { attack: 1.3, defense: 1.3, baseBonus: 1.2 },
    'SR': { attack: 1.7, defense: 1.7, baseBonus: 1.5 },
    'SSR': { attack: 2.2, defense: 2.2, baseBonus: 2.0 }
  };
  return multipliers[rarity] || multipliers['N'];
};

/**
 * 计算突破奖励
 * @param {number} level - 当前等级
 * @param {number} baseValue - 基础数值
 * @param {string} rarity - 稀有度
 * @param {string} type - 'attack' 或 'defense'
 * @returns {number} 突破奖励值
 */
const calculateBreakthroughBonus = (level, baseValue, rarity, type) => {
  const breakpoints = [20, 40, 60, 80, 100];
  const multiplier = getGrowthMultiplier(rarity);
  
  let breakthroughBonus = 0;
  
  for (const breakpoint of breakpoints) {
    if (level >= breakpoint) {
      // 基础突破奖励
      const baseBonus = baseValue * 0.15; // 基础值的15%
      
      // 稀有度加成
      const rarityBonus = baseBonus * (type === 'attack' ? multiplier.attack : multiplier.defense);
      
      // 三倍突破奖励！
      breakthroughBonus += rarityBonus * 3;
    }
  }
  
  return Math.floor(breakthroughBonus);
};

/**
 * 计算卡牌在指定等级的攻击力
 * @param {number} baseAttack - 基础攻击力
 * @param {string} rarity - 稀有度 (N, R, SR, SSR)
 * @param {number} level - 等级 (1-100)
 * @returns {number} 计算后的攻击力
 */
const calculateAttack = (baseAttack, rarity, level) => {
  if (level < 1 || level > 100) {
    throw new Error('等级必须在1-100之间');
  }
  
  const multiplier = getGrowthMultiplier(rarity);
  
  // 成长公式：基础攻击力 + (等级-1) * 成长系数 * 稀有度倍数
  // 添加非线性成长，高等级时成长更快
  const linearGrowth = (level - 1) * multiplier.attack * multiplier.baseBonus;
  const exponentialGrowth = Math.pow(level - 1, 1.1) * 0.1 * multiplier.attack;
  
  // 添加三倍突破奖励
  const breakthroughBonus = calculateBreakthroughBonus(level, baseAttack, rarity, 'attack');
  
  const totalAttack = Math.floor(baseAttack + linearGrowth + exponentialGrowth + breakthroughBonus);
  return Math.max(totalAttack, baseAttack); // 确保不低于基础攻击力
};

/**
 * 计算卡牌在指定等级的防御力
 * @param {number} baseDefense - 基础防御力
 * @param {string} rarity - 稀有度 (N, R, SR, SSR)
 * @param {number} level - 等级 (1-100)
 * @returns {number} 计算后的防御力
 */
const calculateDefense = (baseDefense, rarity, level) => {
  if (level < 1 || level > 100) {
    throw new Error('等级必须在1-100之间');
  }
  
  const multiplier = getGrowthMultiplier(rarity);
  
  // 防御力成长相对保守一些
  const linearGrowth = (level - 1) * multiplier.defense * multiplier.baseBonus * 0.8;
  const exponentialGrowth = Math.pow(level - 1, 1.05) * 0.08 * multiplier.defense;
  
  // 添加三倍突破奖励
  const breakthroughBonus = calculateBreakthroughBonus(level, baseDefense, rarity, 'defense');
  
  const totalDefense = Math.floor(baseDefense + linearGrowth + exponentialGrowth + breakthroughBonus);
  return Math.max(totalDefense, baseDefense); // 确保不低于基础防御力
};

/**
 * 计算升级到指定等级所需的金币
 * @param {number} currentLevel - 当前等级
 * @param {number} targetLevel - 目标等级
 * @param {string} rarity - 稀有度
 * @returns {number} 所需金币
 */
const calculateUpgradeCost = (currentLevel, targetLevel, rarity) => {
  if (currentLevel >= targetLevel || targetLevel > 100) {
    return 0;
  }
  
  const rarityMultiplier = {
    'N': 1.0,
    'R': 1.5,
    'SR': 2.5,
    'SSR': 4.0
  };
  
  let totalCost = 0;
  for (let level = currentLevel; level < targetLevel; level++) {
    // 基础消耗 * 等级系数 * 稀有度系数
    const baseCost = 100;
    const levelMultiplier = Math.pow(level, 1.2);
    const cost = Math.floor(baseCost * levelMultiplier * (rarityMultiplier[rarity] || 1.0));
    totalCost += cost;
  }
  
  return totalCost;
};

/**
 * 获取升级到指定等级需要的特殊物品
 * @param {number} currentLevel - 当前等级
 * @param {number} targetLevel - 目标等级
 * @returns {Array} 需要的特殊物品列表
 */
const getRequiredEnhancementItems = (currentLevel, targetLevel) => {
  const requiredItems = [];
  const breakpoints = [20, 40, 60, 80, 100];
  const itemNames = ['大物实验教程', '量子物理教材', '数学分析练习册', '线性代数试卷', '毕业论文代写'];
  
  for (let i = 0; i < breakpoints.length; i++) {
    const breakpoint = breakpoints[i];
    if (currentLevel < breakpoint && targetLevel >= breakpoint) {
      requiredItems.push({
        itemName: itemNames[i],
        requiredLevel: breakpoint,
        quantity: 1
      });
    }
  }
  
  return requiredItems;
};

/**
 * 获取卡牌完整的升级预览信息
 * @param {Object} card - 卡牌信息（必须包含base_attack和base_defense）
 * @param {number} targetLevel - 目标等级
 * @returns {Object} 升级预览信息
 */
const getUpgradePreview = (card, targetLevel) => {
  const currentAttack = card.current_attack || card.attack;
  const currentDefense = card.current_defense || card.defense;
  const currentLevel = card.level || card.card_level;
  const rarity = card.original_rarity || card.rarity;
  
  // 使用正确的基础属性（从数据库获取）
  const baseAttack = card.base_attack;
  const baseDefense = card.base_defense;
  
  // 如果没有base_attack/base_defense，则报错
  if (baseAttack === undefined || baseDefense === undefined) {
    throw new Error('卡牌信息缺少基础属性 base_attack 或 base_defense');
  }
  
  const newAttack = calculateAttack(baseAttack, rarity, targetLevel);
  const newDefense = calculateDefense(baseDefense, rarity, targetLevel);
  const goldCost = calculateUpgradeCost(currentLevel, targetLevel, rarity);
  const requiredItems = getRequiredEnhancementItems(currentLevel, targetLevel);
  
  return {
    currentLevel,
    targetLevel,
    currentAttack,
    currentDefense,
    newAttack,
    newDefense,
    attackIncrease: newAttack - currentAttack,
    defenseIncrease: newDefense - currentDefense,
    goldCost,
    requiredItems
  };
};

module.exports = {
  calculateAttack,
  calculateDefense,
  calculateUpgradeCost,
  getRequiredEnhancementItems,
  getUpgradePreview,
  getGrowthMultiplier
}; 