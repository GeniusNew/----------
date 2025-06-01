const { pool } = require('./config/db');

async function testCardPoolFix() {
  try {
    console.log('=== 测试卡池概率修复和技能字段修复 ===\n');
    
    // 1. 首先更新卡池概率
    console.log('1. 更新卡池概率...');
    await pool.query(`
      UPDATE card_pool_types 
      SET 
          drop_rate_N = 0.59,
          drop_rate_R = 0.30,
          drop_rate_SR = 0.10,
          drop_rate_SSR = 0.01
      WHERE pool_type_name = 'regular'
    `);
    
    // 如果不存在则创建
    await pool.query(`
      INSERT IGNORE INTO card_pool_types (
          pool_type_name, 
          drop_rate_N, 
          drop_rate_R, 
          drop_rate_SR, 
          drop_rate_SSR, 
          pool_type_description
      ) VALUES (
          'regular', 
          0.59, 
          0.30, 
          0.10, 
          0.01, 
          'Updated regular card pool with N 59%, R 30%, SR 10%, SSR 1%'
      )
    `);
    
    // 2. 检查概率更新结果
    console.log('2. 检查概率更新结果:');
    const [ratesResult] = await pool.query(`
      SELECT pool_type_name, drop_rate_N, drop_rate_R, drop_rate_SR, drop_rate_SSR 
      FROM card_pool_types 
      WHERE pool_type_name = 'regular'
    `);
    
    if (ratesResult.length > 0) {
      const rates = ratesResult[0];
      console.log(`   池类型: ${rates.pool_type_name}`);
      console.log(`   N卡概率: ${(rates.drop_rate_N * 100).toFixed(1)}%`);
      console.log(`   R卡概率: ${(rates.drop_rate_R * 100).toFixed(1)}%`);
      console.log(`   SR卡概率: ${(rates.drop_rate_SR * 100).toFixed(1)}%`);
      console.log(`   SSR卡概率: ${(rates.drop_rate_SSR * 100).toFixed(1)}%`);
      console.log('   ✅ 概率更新成功!');
    } else {
      console.log('   ❌ 未找到regular卡池类型');
    }
    
    // 3. 检查卡牌数据是否存在
    console.log('\n3. 检查卡牌数据:');
    const [N_cards] = await pool.query('SELECT COUNT(*) as count FROM cards WHERE rarity = "N"');
    const [R_cards] = await pool.query('SELECT COUNT(*) as count FROM cards WHERE rarity = "R"');
    const [SR_cards] = await pool.query('SELECT COUNT(*) as count FROM cards WHERE rarity = "SR"');
    const [SSR_cards] = await pool.query('SELECT COUNT(*) as count FROM cards WHERE rarity = "SSR"');
    
    console.log(`   N卡数量: ${N_cards[0].count}`);
    console.log(`   R卡数量: ${R_cards[0].count}`);
    console.log(`   SR卡数量: ${SR_cards[0].count}`);
    console.log(`   SSR卡数量: ${SSR_cards[0].count}`);
    
    // 4. 检查技能字段结构
    console.log('\n4. 检查card_skill_relation表结构:');
    const [skillTableStructure] = await pool.query('DESCRIBE card_skill_relation');
    
    const requiredFields = ['skill_attack', 'skill_defense', 'skill_strike', 'skill_recovery', 'skill_block'];
    const existingFields = skillTableStructure.map(field => field.Field);
    
    let allFieldsExist = true;
    requiredFields.forEach(field => {
      if (existingFields.includes(field)) {
        console.log(`   ✅ ${field} 字段存在`);
      } else {
        console.log(`   ❌ ${field} 字段缺失`);
        allFieldsExist = false;
      }
    });
    
    if (allFieldsExist) {
      console.log('   ✅ 所有必需的技能字段都存在!');
    } else {
      console.log('   ❌ 部分技能字段缺失，可能需要运行ai_creatures.sql脚本');
    }
    
    // 5. 检查现有的技能关联数据
    console.log('\n5. 检查现有技能关联数据:');
    const [skillRelations] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM card_skill_relation csr
      JOIN user_cards uc ON csr.user_card_id = uc.user_card_id
      WHERE uc.user_id = (SELECT user_id FROM users WHERE username = 'example' LIMIT 1)
    `);
    
    console.log(`   现有技能关联记录: ${skillRelations[0].count}`);
    
    console.log('\n=== 测试完成 ===');
    console.log('🎉 卡池概率和技能字段修复验证完成!');
    
  } catch (error) {
    console.error('测试出错:', error);
  } finally {
    process.exit(0);
  }
}

testCardPoolFix(); 