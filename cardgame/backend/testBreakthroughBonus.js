const { calculateAttack, calculateDefense } = require('./utils/cardGrowthCalculator');

function testBreakthroughBonus() {
  console.log('=== 测试三倍突破奖励效果 ===\n');
  
  // 测试数据：基础攻击100，基础防御80的SSR卡牌
  const baseAttack = 100;
  const baseDefense = 80;
  const rarity = 'SSR';
  
  console.log(`测试卡牌: SSR级别，基础攻击${baseAttack}，基础防御${baseDefense}\n`);
  
  // 测试关键等级的属性值
  const testLevels = [1, 19, 20, 21, 39, 40, 41, 59, 60, 61, 79, 80, 81, 99, 100];
  
  console.log('等级  攻击力  防御力  突破奖励说明');
  console.log('----  ------  ------  --------------');
  
  for (const level of testLevels) {
    const attack = calculateAttack(baseAttack, rarity, level);
    const defense = calculateDefense(baseDefense, rarity, level);
    
    let note = '';
    if (level === 20) note = '← 20级突破！（大物实验教程）';
    else if (level === 40) note = '← 40级突破！（量子物理教材）';
    else if (level === 60) note = '← 60级突破！（数学分析练习册）';
    else if (level === 80) note = '← 80级突破！（线性代数试卷）';
    else if (level === 100) note = '← 100级满级！（毕业论文代写）';
    
    console.log(`${level.toString().padStart(2)}    ${attack.toString().padStart(4)}    ${defense.toString().padStart(4)}    ${note}`);
  }
  
  console.log('\n=== 突破前后对比 ===');
  
  // 分析每个突破点的收益
  const breakpoints = [
    { level: 20, name: '大物实验教程' },
    { level: 40, name: '量子物理教材' },
    { level: 60, name: '数学分析练习册' },
    { level: 80, name: '线性代数试卷' },
    { level: 100, name: '毕业论文代写' }
  ];
  
  for (const bp of breakpoints) {
    const beforeAttack = calculateAttack(baseAttack, rarity, bp.level - 1);
    const afterAttack = calculateAttack(baseAttack, rarity, bp.level);
    const beforeDefense = calculateDefense(baseDefense, rarity, bp.level - 1);
    const afterDefense = calculateDefense(baseDefense, rarity, bp.level);
    
    const attackBonus = afterAttack - beforeAttack;
    const defenseBonus = afterDefense - beforeDefense;
    
    console.log(`\n${bp.level}级突破（${bp.name}）:`);
    console.log(`  攻击: ${beforeAttack} → ${afterAttack} (+${attackBonus})`);
    console.log(`  防御: ${beforeDefense} → ${afterDefense} (+${defenseBonus})`);
  }
  
  console.log('\n=== 总成长对比 ===');
  const level1Attack = calculateAttack(baseAttack, rarity, 1);
  const level100Attack = calculateAttack(baseAttack, rarity, 100);
  const level1Defense = calculateDefense(baseDefense, rarity, 1);
  const level100Defense = calculateDefense(baseDefense, rarity, 100);
  
  const totalAttackGrowth = level100Attack - level1Attack;
  const totalDefenseGrowth = level100Defense - level1Defense;
  
  console.log(`1级 → 100级总成长:`);
  console.log(`  攻击: ${level1Attack} → ${level100Attack} (+${totalAttackGrowth}, +${Math.round(totalAttackGrowth/level1Attack*100)}%)`);
  console.log(`  防御: ${level1Defense} → ${level100Defense} (+${totalDefenseGrowth}, +${Math.round(totalDefenseGrowth/level1Defense*100)}%)`);
  
  console.log('\n🎉 三倍突破奖励测试完成！');
}

testBreakthroughBonus(); 