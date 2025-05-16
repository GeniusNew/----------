const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  try {
    console.log('开始执行数据库迁移...');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../migrations/add_resources_to_users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 执行SQL命令
    const connection = await pool.getConnection();
    try {
      console.log('执行SQL迁移...');
      
      // 分割SQL语句
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            await connection.query(stmt);
            console.log('成功执行SQL语句:', stmt.substring(0, 50) + '...');
          } catch (err) {
            // 忽略"列已存在"错误
            if (err.code === 'ER_DUP_FIELDNAME') {
              console.log('列已存在，忽略错误:', err.message);
            } else {
              console.error('执行SQL语句时出错:', err);
            }
          }
        }
      }
      
      console.log('数据库迁移成功完成!');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('执行迁移时出错:', error);
  } finally {
    process.exit();
  }
}

runMigration(); 