import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Battle.css';

function Battle() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从路由传递的状态获取选中的卡牌和副本信息
  const selectedCards = location.state?.selectedCards || [];
  const dungeon = location.state?.dungeon || {};
  
  // 游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCards, setPlayerCards] = useState([...selectedCards]);
  const [currentPlayerCard, setCurrentPlayerCard] = useState(null);
  const [currentEnemyCard, setCurrentEnemyCard] = useState(null);
  const [enemyCards, setEnemyCards] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [animatingAttack, setAnimatingAttack] = useState(false);
  
  // 游戏自动流程控制
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1000); // 战斗速度，毫秒
  
  // 参考用于访问Canvas元素
  const canvasRef = useRef(null);
  const logContainerRef = useRef(null);
  
  // 选定的卡牌索引，用于交换顺序
  const [selectedCardIndices, setSelectedCardIndices] = useState([]);
  
  // 敌方卡牌图片库 - 当无法加载图片时使用这些预设图片
  const enemyImagePool = [
    '/images/cards/enemy_1.png',
    '/images/cards/enemy_2.png',
    '/images/cards/enemy_3.png',
    '/images/cards/enemy_4.png',
    '/images/cards/enemy_5.png',
    '/images/cards/ex_card_1.png',
    '/images/cards/ex_card_2.png',
  ];
  
  // 敌方卡牌名称库
  const enemyNamePool = [
    '暗影魔灵', '烈焰巨兽', '深渊守卫', '雷霆使者',
    '寒冰怨灵', '瘟疫主宰', '机械傀儡', '远古巨龙',
    '虚空行者', '山岳巨人', '幽灵刺客', '死亡骑士',
    '混沌使徒', '腐蚀伪神', '异界魔方', '无尽梦魇'
  ];
  
  // 根据难度计算敌人数量
  const getEnemyCount = (difficulty) => {
    const difficultyMap = {
      'easy': 3,
      'normal': 5,
      'hard': 8,
      'expert': 10
    };
    return difficultyMap[difficulty] || 5; // 默认为5个敌人
  };
  
  // 根据难度系数计算强度倍率
  const getDifficultyMultiplier = (difficulty) => {
    const difficultyMap = {
      'easy': 1,
      'normal': 2,
      'hard': 3,
      'expert': 4
    };
    const d = difficultyMap[difficulty] || 2;
    return Math.log(d + 1);
  };
  
  // 生成随机整数
  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // 生成敌方卡牌
  useEffect(() => {
    if (selectedCards.length > 0 && !gameStarted) {
      const difficulty = dungeon.difficulty || 'normal';
      const enemyCount = getEnemyCount(difficulty);
      const difficultyMultiplier = getDifficultyMultiplier(difficulty);
      
      // 生成敌方卡牌
      const enemies = [];
      for (let i = 0; i < enemyCount; i++) {
        // 随机选择名称和图片
        const randomNameIndex = Math.floor(Math.random() * enemyNamePool.length);
        const randomImageIndex = Math.floor(Math.random() * enemyImagePool.length);
        
        // 随机生成攻击力和生命值
        const attack = Math.floor(getRandomInt(1, 10000) * difficultyMultiplier);
        const defense = Math.floor(getRandomInt(1, 10000) * difficultyMultiplier);
        
        enemies.push({
          id: `enemy-${Math.random().toString(36).substr(2, 9)}`,
          name: enemyNamePool[randomNameIndex],
          image_url: enemyImagePool[randomImageIndex],
          attack: attack,
          defense: defense,
          health: defense, // 初始生命值等于防御力
          rarity: 'epic',  // 敌人卡牌默认为最高稀有度
          isEnemy: true    // 标记为敌方卡牌
        });
      }
      setEnemyCards(enemies);
      
      // 为玩家卡牌设置初始生命值
      const updatedPlayerCards = selectedCards.map(card => ({
        ...card,
        health: card.defense, // 初始生命值等于防御力
        isEnemy: false       // 标记为己方卡牌
      }));
      setPlayerCards(updatedPlayerCards);
    }
  }, [selectedCards, dungeon, gameStarted]);
  
  // 开始战斗，设置第一张卡牌
  useEffect(() => {
    if (gameStarted && playerCards.length > 0 && enemyCards.length > 0) {
      setCurrentPlayerCard(playerCards[0]);
      setCurrentEnemyCard(enemyCards[0]);
      setBattleLog(prev => [...prev, `战斗开始！${playerCards[0].name} 对阵 ${enemyCards[0].name}`]);
      
      // 初始轮回，玩家先攻
      setIsPlayerTurn(true);
    }
  }, [gameStarted, playerCards, enemyCards]);
  
  // 自动战斗
  useEffect(() => {
    let attackTimer;
    
    // 只有在游戏已开始、有当前卡片、非动画中、不在战斗结束状态才执行攻击
    if (gameStarted && currentPlayerCard && currentEnemyCard && !animatingAttack && !battleEnded) {
      if (autoPlayEnabled || isPlayerTurn) {
        attackTimer = setTimeout(() => {
          performAttack();
        }, autoPlayEnabled ? gameSpeed : 0); // 如果启用自动战斗，使用设定的速度；否则，如果是玩家回合，立即执行
      }
    }
    
    return () => {
      if (attackTimer) clearTimeout(attackTimer);
    };
  }, [gameStarted, currentPlayerCard, currentEnemyCard, isPlayerTurn, autoPlayEnabled, animatingAttack, battleEnded, gameSpeed]);
  
  // 战斗日志滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);

  // 执行攻击
  const performAttack = () => {
    if (animatingAttack || battleEnded) return;
    
    setAnimatingAttack(true);
    
    if (isPlayerTurn) {
      // 玩家攻击敌人
      const damage = currentPlayerCard.attack;
      const newHealth = currentEnemyCard.health - damage;
      
      setBattleLog(prev => [...prev, `${currentPlayerCard.name} 攻击了 ${currentEnemyCard.name}，造成 ${damage} 点伤害！`]);
      
      // 更新敌人生命值
      const updatedEnemyCards = [...enemyCards];
      updatedEnemyCards[0] = {
        ...updatedEnemyCards[0],
        health: newHealth
      };
      
      setTimeout(() => {
        // 检查敌人是否被击败
        if (newHealth <= 0) {
          setBattleLog(prev => [...prev, `${currentEnemyCard.name} 被击败了！`]);
          
          // 移除第一个敌人
          const remainingEnemies = updatedEnemyCards.slice(1);
          setEnemyCards(remainingEnemies);
          
          // 检查是否所有敌人都被击败
          if (remainingEnemies.length === 0) {
            setBattleEnded(true);
            setWinner('player');
            setBattleLog(prev => [...prev, `恭喜！你赢得了战斗！`]);
            setAnimatingAttack(false);
            return;
          } else {
            // 设置下一个敌人
            setCurrentEnemyCard(remainingEnemies[0]);
            setBattleLog(prev => [...prev, `新的敌人出现了：${remainingEnemies[0].name}`]);
          }
        } else {
          // 敌人未被击败，更新状态
          setEnemyCards(updatedEnemyCards);
          setCurrentEnemyCard({...updatedEnemyCards[0]});
          // 敌人回合
          setIsPlayerTurn(false);
        }
        setAnimatingAttack(false);
      }, 500); // 攻击动画时间
      
    } else {
      // 敌人攻击玩家
      const damage = currentEnemyCard.attack;
      const newHealth = currentPlayerCard.health - damage;
      
      setBattleLog(prev => [...prev, `${currentEnemyCard.name} 攻击了 ${currentPlayerCard.name}，造成 ${damage} 点伤害！`]);
      
      // 更新玩家生命值
      const updatedPlayerCards = [...playerCards];
      updatedPlayerCards[0] = {
        ...updatedPlayerCards[0],
        health: newHealth
      };
      
      setTimeout(() => {
        // 检查玩家是否被击败
        if (newHealth <= 0) {
          setBattleLog(prev => [...prev, `${currentPlayerCard.name} 被击败了！`]);
          
          // 移除第一个玩家卡牌
          const remainingCards = updatedPlayerCards.slice(1);
          setPlayerCards(remainingCards);
          
          // 检查是否所有玩家卡牌都被击败
          if (remainingCards.length === 0) {
            setBattleEnded(true);
            setWinner('enemy');
            setBattleLog(prev => [...prev, `战斗失败！敌人获胜了。`]);
            setAnimatingAttack(false);
            return;
          } else {
            // 设置下一个玩家卡牌
            setCurrentPlayerCard(remainingCards[0]);
            setBattleLog(prev => [...prev, `你的下一张卡牌上场：${remainingCards[0].name}`]);
          }
        } else {
          // 玩家未被击败，更新状态
          setPlayerCards(updatedPlayerCards);
          setCurrentPlayerCard({...updatedPlayerCards[0]});
          // 玩家回合
          setIsPlayerTurn(true);
        }
        setAnimatingAttack(false);
      }, 500); // 攻击动画时间
    }
  };
  
  // 选择卡牌以交换顺序
  const selectCardForSwap = (index) => {
    // 如果战斗已经开始，不能再交换卡牌
    if (!gameStarted || battleEnded) return;
    
    // 不能选择当前战斗中的卡牌（索引0）
    if (index === 0) return;
    
    if (selectedCardIndices.includes(index)) {
      // 如果已经选中，则取消选择
      setSelectedCardIndices(selectedCardIndices.filter(i => i !== index));
    } else {
      // 添加到选中列表
      const newSelectedIndices = [...selectedCardIndices, index];
      
      // 如果已经选中了两张卡牌，则交换它们的顺序
      if (newSelectedIndices.length === 2) {
        const [firstIndex, secondIndex] = newSelectedIndices;
        const newPlayerCards = [...playerCards];
        const temp = newPlayerCards[firstIndex];
        newPlayerCards[firstIndex] = newPlayerCards[secondIndex];
        newPlayerCards[secondIndex] = temp;
        
        setPlayerCards(newPlayerCards);
        setBattleLog(prev => [...prev, `调整了卡牌顺序：${newPlayerCards[firstIndex].name} 和 ${newPlayerCards[secondIndex].name}`]);
        setSelectedCardIndices([]);
      } else {
        setSelectedCardIndices(newSelectedIndices);
      }
    }
  };
  
  // 返回副本选择
  const goBack = () => {
    navigate('/plant-selection/' + dungeon.id, { state: { dungeon } });
  };
  
  // 绘制游戏画面
  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    ctx.fillStyle = '#0f2027';
    ctx.fillRect(0, 0, width, height);
    
    // 添加渐变背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(46, 125, 50, 0.2)');
    gradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.2)');
    gradient.addColorStop(1, 'rgba(46, 125, 50, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 如果有活跃的卡片，绘制卡片和VS标志
    if (currentPlayerCard && currentEnemyCard) {
      // 绘制中央VS
      ctx.save();
      ctx.font = 'bold 72px Impact';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFFFFF';
      
      // 垂直绘制V和S
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.fillText('V', centerX, centerY - 50);
      ctx.fillText('S', centerX, centerY + 50);
      ctx.restore();
      
      // 绘制玩家和敌人的卡牌
      drawCard(currentPlayerCard, width * 0.2 - 75, height / 2 - 110, 'player');
      drawCard(currentEnemyCard, width * 0.8 - 75, height / 2 - 110, 'enemy');
      
      // 绘制回合指示器
      ctx.save();
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      
      if (isPlayerTurn) {
        ctx.fillStyle = '#00FF00';
        ctx.fillText('玩家回合', width * 0.2, height / 2 - 140);
        
        // 绘制攻击指示箭头
        ctx.beginPath();
        ctx.moveTo(width * 0.3, height / 2);
        ctx.lineTo(width * 0.7, height / 2);
        ctx.lineTo(width * 0.6, height / 2 - 20);
        ctx.moveTo(width * 0.7, height / 2);
        ctx.lineTo(width * 0.6, height / 2 + 20);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 5;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FF0000';
        ctx.fillText('敌方回合', width * 0.8, height / 2 - 140);
        
        // 绘制攻击指示箭头
        ctx.beginPath();
        ctx.moveTo(width * 0.7, height / 2);
        ctx.lineTo(width * 0.3, height / 2);
        ctx.lineTo(width * 0.4, height / 2 - 20);
        ctx.moveTo(width * 0.3, height / 2);
        ctx.lineTo(width * 0.4, height / 2 + 20);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // 如果战斗结束，显示胜利/失败信息
    if (battleEnded) {
      ctx.save();
      ctx.font = 'bold 64px Impact';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = winner === 'player' ? '#00FF00' : '#FF0000';
      ctx.shadowBlur = 20;
      ctx.fillStyle = winner === 'player' ? '#00FF00' : '#FF0000';
      
      ctx.fillText(
        winner === 'player' ? '胜利！' : '失败！', 
        width / 2, 
        height / 2
      );
      ctx.restore();
    }
    
  }, [gameStarted, currentPlayerCard, currentEnemyCard, isPlayerTurn, battleEnded, winner, animatingAttack]);
  
  // 加载卡牌图片并绘制
  const drawCard = (card, x, y, side) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 绘制卡牌框架
    ctx.fillStyle = side === 'player' ? 'rgba(34, 139, 34, 0.7)' : 'rgba(139, 0, 0, 0.7)';
    ctx.fillRect(x, y, 150, 220);
    ctx.strokeStyle = side === 'player' ? '#32CD32' : '#FF0000';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 150, 220);
    
    // 绘制卡牌名称
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + 75, y + 20);
    
    // 绘制血量条
    const healthPercentage = Math.max(0, card.health / card.defense);
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 10, y + 190, 130, 20);
    ctx.fillStyle = side === 'player' ? '#00FF00' : '#FF0000';
    ctx.fillRect(x + 10, y + 190, 130 * healthPercentage, 20);
    
    // 绘制血量数值
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, card.health)}/${card.defense}`, x + 75, y + 205);
    
    // 绘制攻击力
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`攻击: ${card.attack}`, x + 10, y + 40);
    
    // 在卡牌中央加载图片
    const img = new Image();
    img.src = card.image_url || '/images/cards/ex_card_1.png';
    img.onload = () => {
      ctx.drawImage(img, x + 15, y + 50, 120, 130);
    };
    img.onerror = () => {
      // 如果图片加载失败，绘制一个占位符
      ctx.fillStyle = '#666666';
      ctx.fillRect(x + 15, y + 50, 120, 130);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', x + 75, y + 105);
    };
    
    // 根据是否是当前回合显示高亮边框
    if ((side === 'player' && isPlayerTurn) || (side === 'enemy' && !isPlayerTurn)) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 6;
      ctx.strokeRect(x - 5, y - 5, 160, 230);
    }
  };
  
  // 调整Canvas尺寸以匹配容器
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // 重新绘制画布
      if (gameStarted) {
        // 触发重绘
        const forceRedraw = Date.now();
        setForceUpdate(forceRedraw);
      }
    };
    
    // 初始化尺寸
    resizeCanvas();
    
    // 监听窗口尺寸变化
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameStarted]);
  
  // 强制更新的状态
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // 渲染开始界面
  if (!gameStarted) {
    return (
      <div className="battle-start-container">
        <div className="battle-title-container">
          <h1 className="battle-title">数据库猎人的奇妙冒险</h1>
          <div className="battle-subtitle">副本：{dungeon.dungeon_name || '未知副本'}</div>
          <div className="battle-subtitle">难度：{dungeon.difficulty || '未知难度'}</div>
          <button className="battle-start-btn" onClick={() => setGameStarted(true)}>
            点击开始战斗
          </button>
          <button className="battle-back-btn" onClick={goBack}>
            返回卡牌选择
          </button>
        </div>
      </div>
    );
  }
  
  // 渲染游戏界面
  return (
    <div className="battle-container">
      {/* 左侧UI控制面板 */}
      <div className="battle-ui-panel">
        <h2 className="ui-panel-title">我方卡牌</h2>
        <div className="remaining-cards-grid">
          {playerCards.map((card, index) => (
            <div 
              key={`player-card-${index}`}
              className={`remaining-card ${selectedCardIndices.includes(index) ? 'selected' : ''} ${index === 0 ? 'active-card' : ''}`}
              onClick={() => selectCardForSwap(index)}
            >
              <div className="card-order-number">{index + 1}</div>
              <img 
                src={card.image_url} 
                alt={card.name}
                onError={(e) => {
                  e.target.src = '/images/cards/ex_card_1.png';
                  e.target.onerror = null;
                }}
              />
              <div className="card-name">{card.name}</div>
              <div className="card-stats">
                <span className="card-health">♥ {card.health}</span>
                <span className="card-attack">⚔ {card.attack}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="battle-controls">
          <div className="auto-battle-controls">
            <label className="auto-battle-label">
              <input 
                type="checkbox" 
                checked={autoPlayEnabled} 
                onChange={() => setAutoPlayEnabled(!autoPlayEnabled)} 
              />
              自动战斗
            </label>
            {autoPlayEnabled && (
              <div className="speed-control">
                <span>速度:</span>
                <input 
                  type="range" 
                  min="200" 
                  max="2000" 
                  step="200" 
                  value={gameSpeed} 
                  onChange={(e) => setGameSpeed(parseInt(e.target.value))} 
                />
              </div>
            )}
          </div>
          
          {!autoPlayEnabled && !battleEnded && isPlayerTurn && (
            <button className="battle-attack-btn" onClick={performAttack}>
              攻击
            </button>
          )}
          
          <button className="battle-exit-btn" onClick={goBack}>
            退出战斗
          </button>
        </div>
        
        <div className="battle-log-container" ref={logContainerRef}>
          <h3>战斗日志</h3>
          <div className="battle-log">
            {battleLog.map((log, index) => (
              <div key={index} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 游戏画布 */}
      <div className="battle-canvas-container">
        <canvas ref={canvasRef} className="battle-canvas"/>
      </div>
      
      {/* 右侧敌方卡牌列表 */}
      <div className="enemy-ui-panel">
        <h2 className="ui-panel-title">敌方卡牌</h2>
        <div className="remaining-cards-grid">
          {enemyCards.map((card, index) => (
            <div 
              key={`enemy-card-${index}`}
              className={`remaining-card enemy-card ${index === 0 ? 'active-card' : ''}`}
            >
              <div className="card-order-number">{index + 1}</div>
              <img 
                src={card.image_url} 
                alt={card.name}
                onError={(e) => {
                  e.target.src = '/images/cards/ex_card_1.png';
                  e.target.onerror = null;
                }}
              />
              <div className="card-name">{card.name}</div>
              <div className="card-stats">
                <span className="card-health">♥ {card.health}</span>
                <span className="card-attack">⚔ {card.attack}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Battle; 