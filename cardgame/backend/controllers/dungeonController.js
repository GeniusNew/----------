const mysql = require('mysql2/promise');
const { pool } = require('../config/db');

// 获取副本列表
const getDungeonList = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // 查询所有副本信息
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

    // 为每个副本获取奖励信息
    for (let dungeon of dungeons) {
      const [rewards] = await connection.execute(`
        SELECT reward_type, reward_quantity, drop_rate
        FROM dungeon_rewards
        WHERE dungeon_id = ?
        ORDER BY drop_rate DESC
      `, [dungeon.dungeon_id]);
      
      dungeon.rewards = rewards;
    }

    res.json({
      success: true,
      data: dungeons
    });

  } catch (error) {
    console.error('获取副本列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取副本列表失败'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 获取副本详情
const getDungeonDetail = async (req, res) => {
  let connection;
  
  try {
    const { dungeonId } = req.params;
    connection = await pool.getConnection();
    
    // 获取副本基本信息
    const [dungeonInfo] = await connection.execute(`
      SELECT dungeon_id, dungeon_name, difficulty, dungeon_description
      FROM dungeons
      WHERE dungeon_id = ?
    `, [dungeonId]);
    
    if (dungeonInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: '副本不存在'
      });
    }
    
    // 获取副本敌人信息
    const [enemies] = await connection.execute(`
      SELECT 
        de.enemy_id,
        de.enemy_name,
        de.enemy_level,
        de.is_boss,
        de.enemy_attack,
        de.enemy_defense,
        de.image_url
      FROM dungeon_enemies de
      WHERE de.dungeon_id = ?
      ORDER BY de.is_boss, de.enemy_level
    `, [dungeonId]);
    
    // 获取每个敌人的技能
    for (let enemy of enemies) {
      const [skills] = await connection.execute(`
        SELECT 
          es.skill_id,
          es.skill_name,
          es.skill_description,
          esr.skill_attack,
          esr.skill_defense
        FROM enemy_skill_relation esr
        JOIN enemy_skills es ON esr.skill_id = es.skill_id
        WHERE esr.enemy_id = ?
      `, [enemy.enemy_id]);
      
      enemy.skills = skills;
    }
    
    // 获取副本奖励
    const [rewards] = await connection.execute(`
      SELECT reward_type, reward_quantity, drop_rate
      FROM dungeon_rewards
      WHERE dungeon_id = ?
      ORDER BY drop_rate DESC
    `, [dungeonId]);

    const dungeon = {
      ...dungeonInfo[0],
      enemies: enemies,
      rewards: rewards
    };

    res.json({
      success: true,
      data: dungeon
    });

  } catch (error) {
    console.error('获取副本详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取副本详情失败'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getDungeonList,
  getDungeonDetail
}; 