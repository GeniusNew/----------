const { pool } = require('./config/db');

async function createCardLevelSystem() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('=== 创建卡牌等级共享系统 ===\n');
    
    // 1. 创建用户卡牌等级表
    console.log('1. 创建 user_card_levels 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_card_levels (
        user_id INT NOT NULL,
        card_id INT NOT NULL,
        level INT NOT NULL DEFAULT 1,
        current_attack INT NOT NULL,
        current_defense INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, card_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ user_card_levels 表创建成功');
    
    // 2. 从现有数据中提取每个用户每种卡牌的最高等级
    console.log('\n2. 迁移现有卡牌等级数据...');
    const [existingData] = await connection.query(`
      SELECT 
        uc.user_id,
        uc.card_id,
        MAX(uc.level) as max_level,
        MAX(uc.current_attack) as max_attack,
        MAX(uc.current_defense) as max_defense
      FROM user_cards uc
      GROUP BY uc.user_id, uc.card_id
    `);
    
    console.log(`找到 ${existingData.length} 种用户卡牌组合`);
    
    // 3. 插入到新表中
    for (const data of existingData) {
      await connection.query(`
        INSERT INTO user_card_levels (user_id, card_id, level, current_attack, current_defense)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        level = GREATEST(level, VALUES(level)),
        current_attack = GREATEST(current_attack, VALUES(current_attack)),
        current_defense = GREATEST(current_defense, VALUES(current_defense))
      `, [data.user_id, data.card_id, data.max_level, data.max_attack, data.max_defense]);
    }
    console.log('✅ 卡牌等级数据迁移完成');
    
    // 4. 验证迁移结果
    console.log('\n3. 验证迁移结果...');
    const [newData] = await connection.query(`
      SELECT 
        ucl.user_id,
        c.card_name,
        ucl.level,
        ucl.current_attack,
        ucl.current_defense,
        COUNT(uc.user_card_id) as card_count
      FROM user_card_levels ucl
      JOIN cards c ON ucl.card_id = c.card_id
      LEFT JOIN user_cards uc ON ucl.user_id = uc.user_id AND ucl.card_id = uc.card_id
      WHERE ucl.user_id = 2
      GROUP BY ucl.user_id, ucl.card_id
      ORDER BY c.card_name
    `);
    
    console.log('用户2的卡牌等级统一结果:');
    newData.forEach(card => {
      console.log(`  ${card.card_name}: 等级${card.level} (拥有${card.card_count}张) 攻击:${card.current_attack} 防御:${card.current_defense}`);
    });
    
    await connection.commit();
    console.log('\n🎉 卡牌等级系统创建完成！');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 创建失败:', error);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

createCardLevelSystem(); 