const { pool } = require('./config/db');
const { drawCards } = require('./controllers/cardPoolController');

async function testDrawCardSync() {
  try {
    console.log('=== 测试通过抽卡API的卡牌等级同步 ===\n');
    
    // 1. 获取测试用户
    const [users] = await pool.query('SELECT user_id, username, diamonds FROM users WHERE username = "example"');
    if (users.length === 0) {
      console.log('❌ 找不到example用户');
      return;
    }
    
    const testUser = users[0];
    console.log(`1. 测试用户: ${testUser.username} (ID: ${testUser.user_id}), 钻石: ${testUser.diamonds}`);
    
    // 2. 查看当前高等级卡牌
    console.log('\n2. 查看当前已升级的卡牌:');
    const [highLevelCards] = await pool.query(`
      SELECT 
        uc.card_id,
        c.card_name,
        c.rarity,
        COUNT(*) as count,
        MAX(uc.level) as max_level
      FROM user_cards uc
      JOIN cards c ON uc.card_id = c.card_id
      WHERE uc.user_id = ? AND uc.level > 1
      GROUP BY uc.card_id, c.card_name, c.rarity
      ORDER BY MAX(uc.level) DESC
    `, [testUser.user_id]);
    
    if (highLevelCards.length > 0) {
      console.log('找到高等级卡牌:');
      highLevelCards.forEach(card => {
        console.log(`  ${card.card_name} (${card.rarity}): ${card.count}张, 最高等级${card.max_level}`);
      });
    } else {
      console.log('没有找到高等级卡牌');
    }
    
    // 3. 模拟抽卡请求
    console.log('\n3. 模拟单抽请求...');
    
    // 创建模拟的请求和响应对象
    const mockReq = {
      user: { userId: testUser.user_id },
      body: { drawType: 'single' }
    };
    
    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          console.log(`API响应状态: ${code}`);
          return data;
        }
      })
    };
    
    // 记录抽卡前的卡牌数量
    const [beforeCount] = await pool.query(
      'SELECT COUNT(*) as total FROM user_cards WHERE user_id = ?',
      [testUser.user_id]
    );
    console.log(`抽卡前总卡牌数: ${beforeCount[0].total}张`);
    
    // 执行抽卡
    try {
      await drawCards(mockReq, mockRes);
      
      if (responseData && responseData.success) {
        console.log('✅ 抽卡成功!');
        console.log(`抽到卡牌: ${responseData.cards[0].name} (${responseData.cards[0].rarity})`);
        
        // 4. 检查新抽取的卡牌等级
        console.log('\n4. 检查新抽取卡牌的等级:');
        
        // 获取刚抽到的卡牌ID
        const drawnCardId = responseData.cards[0].id;
        
        // 查询该卡牌的所有副本
        const [allCopies] = await pool.query(`
          SELECT 
            uc.user_card_id,
            uc.level,
            uc.current_attack,
            uc.current_defense,
            uc.acquired_time
          FROM user_cards uc
          WHERE uc.user_id = ? AND uc.card_id = ?
          ORDER BY uc.acquired_time DESC
        `, [testUser.user_id, drawnCardId]);
        
        if (allCopies.length > 0) {
          console.log(`${responseData.cards[0].name} 的所有副本:`);
          let allSameLevel = true;
          const expectedLevel = allCopies[0].level;
          
          allCopies.forEach((card, index) => {
            const isNewCard = index === 0 ? ' (新抽取)' : '';
            const status = card.level === expectedLevel ? '✅' : '❌';
            console.log(`  [${card.user_card_id}] 等级:${card.level} 攻击:${card.current_attack} 防御:${card.current_defense}${isNewCard} ${status}`);
            if (card.level !== expectedLevel) allSameLevel = false;
          });
          
          // 5. 验证修复效果
          console.log('\n5. 验证修复效果:');
          if (allSameLevel) {
            if (allCopies.length > 1) {
              console.log('🎉 完美！新抽取的卡牌成功同步到已有卡牌的等级！');
            } else {
              console.log('ℹ️  首次获得该卡牌，等级为1级（正常）');
            }
          } else {
            console.log('❌ 失败！新抽取的卡牌等级未能正确同步！');
          }
        }
        
        // 6. 显示资源变化
        console.log('\n6. 资源变化:');
        console.log(`钻石: ${testUser.diamonds} → ${responseData.updatedResources.gems}`);
        
        const [afterCount] = await pool.query(
          'SELECT COUNT(*) as total FROM user_cards WHERE user_id = ?',
          [testUser.user_id]
        );
        console.log(`卡牌总数: ${beforeCount[0].total} → ${afterCount[0].total}张`);
        
      } else {
        console.log('❌ 抽卡失败:', responseData);
      }
    } catch (error) {
      console.error('❌ 抽卡过程出错:', error.message);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testDrawCardSync(); 