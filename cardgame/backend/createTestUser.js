const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function createTestUser() {
  try {
    const username = 'testuser';
    const password = 'test123';
    const email = 'test@example.com';
    
    console.log(`创建测试用户: ${username}`);
    
    // 检查用户是否已存在
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      console.log('测试用户已存在，更新密码');
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [passwordHash, username]);
      console.log(`用户 ${username} 密码已更新`);
    } else {
      console.log('创建新测试用户');
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await pool.query(
        'INSERT INTO users (username, password_hash, email, user_level, diamonds, coins) VALUES (?, ?, ?, ?, ?, ?)',
        [username, passwordHash, email, 1, 2000, 1000]
      );
      
      console.log(`用户 ${username} 创建成功`);
    }
    
    // 为example用户重置密码
    console.log('重置example用户密码...');
    const examplePassword = 'password123';
    const exampleSalt = await bcrypt.genSalt(10);
    const exampleHash = await bcrypt.hash(examplePassword, exampleSalt);
    
    await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [exampleHash, 'example']);
    console.log('example用户密码已重置');
    
    console.log('测试用户信息:');
    console.log(`  用户名: ${username}`);
    console.log(`  密码: ${password}`);
    console.log(`  邮箱: ${email}`);
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit();
  }
}

createTestUser(); 