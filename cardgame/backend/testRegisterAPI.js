const axios = require('axios');

async function testRegister() {
  try {
    console.log('测试注册API...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser' + Date.now(),
      email: 'test' + Date.now() + '@test.com',
      password: 'password123'
    });
    
    console.log('注册API响应:', response.status, response.data);
  } catch (error) {
    console.error('注册API错误:', error.response ? error.response.data : error.message);
    console.error('完整错误:', error);
  }
}

testRegister(); 