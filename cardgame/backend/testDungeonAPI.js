const { pool } = require('./config/db');

async function testDungeonAPI() {
  let connection;
  
  try {
    console.log('测试副本API...');
    connection = await pool.getConnection();
    
    // 测试获取副本列表
    console.log('\n1. 测试获取副本列表:');
    const [dungeons] = await connection.execute(`
      SELECT 
        d.dungeon_id,
        d.dungeon_name,
        d.difficulty,
        d.dungeon_description,
        COUNT(de.enemy_id) as enemy_count,
        SUM(CASE WHEN de.is_boss = 1 THEN 1 ELSE 0 END) as boss_count
      FROM dungeons d
      LEFT JOIN dungeon_enemies de ON d.dungeon_id = de.dungeon_id
      GROUP BY d.dungeon_id, d.dungeon_name, d.difficulty, d.dungeon_description
      ORDER BY 
        CASE d.difficulty 
          WHEN 'easy' THEN 1 
          WHEN 'normal' THEN 2 
          WHEN 'hard' THEN 3 
          WHEN 'expert' THEN 4 
        END
    `);
    
    console.log(`找到 ${dungeons.length} 个副本:`);
    dungeons.forEach(dungeon => {
      console.log(`- ${dungeon.dungeon_name} (${dungeon.difficulty}) - 敌人: ${dungeon.enemy_count}, Boss: ${dungeon.boss_count}`);
    });
    
    // 测试获取第一个副本的详情
    if (dungeons.length > 0) {
      const firstDungeon = dungeons[0];
      console.log(`\n2. 测试获取副本详情 (${firstDungeon.dungeon_name}):`);
      
      // 获取敌人信息
      const [enemies] = await connection.execute(`
        SELECT 
          de.enemy_id,
          de.enemy_name,
          de.enemy_level,
          de.is_boss,
          de.enemy_attack,
          de.enemy_defense
        FROM dungeon_enemies de
        WHERE de.dungeon_id = ?
        ORDER BY de.is_boss, de.enemy_level
      `, [firstDungeon.dungeon_id]);
      
      console.log(`敌人列表 (${enemies.length} 个):`);
      enemies.forEach(enemy => {
        console.log(`- ${enemy.enemy_name} Lv.${enemy.enemy_level} ${enemy.is_boss ? '[BOSS]' : ''} (攻击: ${enemy.enemy_attack}, 防御: ${enemy.enemy_defense})`);
      });
      
      // 获取奖励信息
      const [rewards] = await connection.execute(`
        SELECT reward_type, reward_quantity, drop_rate
        FROM dungeon_rewards
        WHERE dungeon_id = ?
        ORDER BY drop_rate DESC
      `, [firstDungeon.dungeon_id]);
      
      console.log(`奖励列表 (${rewards.length} 个):`);
      rewards.forEach(reward => {
        console.log(`- ${reward.reward_quantity} ${reward.reward_type} (${Math.round(reward.drop_rate * 100)}% 概率)`);
      });
    }
    
    console.log('\n✅ 副本API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

testDungeonAPI(); 