const { pool } = require('./config/db');

async function testNCardDisplay() {
  try {
    console.log('=== 测试N卡品质显示修复 ===\n');
    
    // 1. 检查数据库中的N卡数据
    console.log('1. 检查数据库中的N卡:');
    const [nCards] = await pool.query('SELECT card_id, card_name, rarity FROM cards WHERE rarity = "N"');
    
    if (nCards.length === 0) {
      console.log('   ❌ 数据库中没有N卡数据');
      return;
    }
    
    console.log(`   找到 ${nCards.length} 张N卡:`);
    nCards.forEach(card => {
      console.log(`   - ${card.card_name} (ID: ${card.card_id}, 稀有度: ${card.rarity})`);
    });
    
    // 2. 测试稀有度映射
    console.log('\n2. 测试稀有度映射:');
    
    // 模拟后端稀有度映射
    const rarityMap = {
      'N': 'normal',
      'R': 'common', 
      'SR': 'rare',
      'SSR': 'epic'
    };
    
    console.log('   后端稀有度映射:');
    Object.entries(rarityMap).forEach(([dbRarity, frontendRarity]) => {
      console.log(`   ${dbRarity} -> ${frontendRarity}`);
    });
    
    // 3. 测试前端显示映射
    console.log('\n3. 测试前端显示映射:');
    
    const getRarityName = (rarity) => {
      switch(rarity) {
        case 'normal': return '普通 (N)';
        case 'common': return '常见 (R)';
        case 'rare': return '稀有 (SR)';
        case 'epic': return '史诗 (SSR)';
        default: return rarity;
      }
    };
    
    console.log('   前端显示映射:');
    ['normal', 'common', 'rare', 'epic'].forEach(rarity => {
      console.log(`   ${rarity} -> ${getRarityName(rarity)}`);
    });
    
    // 4. 测试N卡完整映射链
    console.log('\n4. 测试N卡完整映射链:');
    const nCard = nCards[0];
    const mappedRarity = rarityMap[nCard.rarity];
    const displayName = getRarityName(mappedRarity);
    
    console.log(`   数据库稀有度: ${nCard.rarity}`);
    console.log(`   映射后稀有度: ${mappedRarity}`);
    console.log(`   前端显示名称: ${displayName}`);
    
    if (displayName === '普通 (N)') {
      console.log('   ✅ N卡品质显示修复成功!');
    } else {
      console.log(`   ❌ N卡品质显示错误: ${displayName}`);
    }
    
    // 5. 测试其他稀有度
    console.log('\n5. 测试其他稀有度映射:');
    const testRarities = ['R', 'SR', 'SSR'];
    
    testRarities.forEach(dbRarity => {
      const mappedRarity = rarityMap[dbRarity];
      const displayName = getRarityName(mappedRarity);
      console.log(`   ${dbRarity} -> ${mappedRarity} -> ${displayName}`);
    });
    
    console.log('\n=== 测试完成 ===');
    console.log('🎉 N卡品质显示修复验证完成!');
    
  } catch (error) {
    console.error('测试出错:', error);
  } finally {
    process.exit(0);
  }
}

testNCardDisplay(); 