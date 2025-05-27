const { pool } = require('./config/db');

async function checkCardPools() {
  try {
    console.log('检查数据库中的卡池数据...');
    
    const [results] = await pool.execute('SELECT * FROM card_pools');
    
    console.log('数据库中的卡池数据:');
    console.log(JSON.stringify(results, null, 2));
    
    if (results.length === 0) {
      console.log('❌ 数据库中没有卡池数据');
    } else {
      console.log(`✅ 找到 ${results.length} 个卡池`);
      results.forEach((pool, index) => {
        console.log(`\n卡池 ${index + 1}:`);
        console.log(`  ID: ${pool.pool_id}`);
        console.log(`  名称: ${pool.name}`);
        console.log(`  描述: ${pool.description}`);
        console.log(`  类型: ${pool.type}`);
        console.log(`  开始时间: ${pool.start_time}`);
        console.log(`  结束时间: ${pool.end_time}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkCardPools(); 