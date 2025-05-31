const { getDefenseFieldName, adaptDefenseFieldQuery } = require('./utils/dbFieldChecker');

async function testFieldDetection() {
  try {
    console.log('=== 测试字段检测功能 ===\n');
    
    // 1. 检测当前字段名
    const fieldName = await getDefenseFieldName();
    console.log(`检测到的defense字段名: ${fieldName}`);
    
    // 2. 测试查询适配
    const testQuery = `
      SELECT 
        c.card_name,
        c.base_attack,
        c.base_defense
      FROM cards c
      LIMIT 3
    `;
    
    const adaptedQuery = await adaptDefenseFieldQuery(testQuery);
    console.log('\n原始查询:');
    console.log(testQuery);
    console.log('\n适配后查询:');
    console.log(adaptedQuery);
    
    // 3. 测试实际执行
    const { pool } = require('./config/db');
    const [rows] = await pool.query(adaptedQuery);
    
    console.log('\n✅ 查询执行成功，结果:');
    rows.forEach(row => {
      console.log(`  ${row.card_name}: 攻击${row.base_attack}, 防御${row.base_defense}`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testFieldDetection(); 