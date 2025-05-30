const { pool } = require('./config/db');

async function checkUsers() {
  try {
    console.log('连接数据库...');
    
    // 检查users表结构
    console.log('检查users表结构...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    `);
    
    console.log('users表结构:');
    columns.forEach(column => {
      console.log(`  ${column.COLUMN_NAME} (${column.DATA_TYPE}) ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${column.COLUMN_KEY === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });
    
    // 查询用户数据
    console.log('\n查询所有用户...');
    const [users] = await pool.query(`SELECT * FROM users`);
    
    console.log(`找到${users.length}个用户:`);
    users.forEach(user => {
      console.log(`  ID: ${user.user_id}, 用户名: ${user.username}, 邮箱: ${user.email || 'N/A'}, 钻石: ${user.diamonds || 0}, 金币: ${user.coins || 0}`);
    });
    
    if (users.length > 0) {
      // 检查第一个用户的密码哈希
      const firstUser = users[0];
      console.log(`\n用户 "${firstUser.username}" 的密码哈希: ${firstUser.password_hash}`);
    }
  } catch (error) {
    console.error('检查用户表出错:', error);
  } finally {
    process.exit();
  }
}

checkUsers(); 