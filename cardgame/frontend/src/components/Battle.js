import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Battle.css';

function Battle() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 从路由传递的状态获取选中的卡牌和副本信息
  const selectedCards = location.state?.selectedCards || [];
  const dungeon = location.state?.dungeon || {};
  
  // 基础游戏状态
  const [gameStarted, setGameStarted] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false); // 新增状态，跟踪实际战斗是否开始
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('player'); // 'player' 或 'enemy'
  
  // 卡牌状态
  const [playerCards, setPlayerCards] = useState([]);
  const [enemyCards, setEnemyCards] = useState([]);
  const [activePlayerCard, setActivePlayerCard] = useState(null);
  const [activeEnemyCard, setActiveEnemyCard] = useState(null);
  
  // 战斗控制
  const [isAttacking, setIsAttacking] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1000); // 毫秒
  
  // 卡牌排序
  const [selectedCardIndices, setSelectedCardIndices] = useState([]);
  
  // Refs
  const canvasRef = useRef(null);
  const logContainerRef = useRef(null);
  const autoAttackTimerRef = useRef(null);
  
  // 敌方卡牌资源
  const enemyNames = [
    '暗影魔灵', '烈焰巨兽', '深渊守卫', '雷霆使者', 
    '寒冰怨灵', '瘟疫主宰', '机械傀儡', '远古巨龙',
    '虚空行者', '山岳巨人', '幽灵刺客', '死亡骑士',
    '混沌使徒', '腐蚀伪神', '异界魔方', '无尽梦魇'
  ];
  
  const enemyImages = [
    '/images/cards/enemy_1.png',
    '/images/cards/enemy_2.png',
    '/images/cards/enemy_3.png',
    '/images/cards/enemy_4.png',
    '/images/cards/enemy_5.png',
    '/images/cards/ex_card_1.png',
    '/images/cards/ex_card_2.png'
  ];
  
  // 敌人类型定义
  const enemyTypes = {
    A: { health: 2500, attack: 250, name: '初级敌人', image: 0 },
    B: { health: 12000, attack: 1200, name: '中级敌人', image: 1 },
    C: { health: 22000, attack: 2500, name: '高级敌人', image: 2 },
    D: { health: 40000, attack: 5000, name: '终极敌人', image: 3 }
  };
  
  // 根据难度设置敌方数量和类型
  const getEnemyCount = (difficulty) => {
    switch(difficulty) {
      case 'easy':
        return 3;
      case 'normal':
        return 5;
      case 'hard':
        return 8;
      case 'expert':
        return 10;
      default:
        return 5;
    }
  };
  
  // 根据难度计算倍率 (不再需要这个函数，但保留它以避免修改其他代码)
  const getDifficultyMultiplier = (difficulty) => {
    return 1; // 现在直接使用预设值，忽略倍率
  };
  
  // 随机整数
  const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // 随机选择
  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };
  
  // 初始化游戏
  useEffect(() => {
    if (selectedCards.length > 0) {
      // 初始化玩家卡牌
      const preparedPlayerCards = selectedCards.map(card => ({
        ...card,
        health: card.defense,
        maxHealth: card.defense,
        isEnemy: false
      }));
      setPlayerCards(preparedPlayerCards);
    }
  }, [selectedCards]);
  
  // 生成敌人
  const generateEnemies = () => {
    const difficulty = dungeon.difficulty || 'normal';
    const enemies = [];
    
    // 根据难度设置敌人组成
    switch(difficulty) {
      case 'easy':
        // 简单副本：3个A类敌人
        for (let i = 0; i < 3; i++) {
          addEnemy('A', i, enemies);
        }
        break;
        
      case 'normal':
        // 普通副本：5个B类敌人
        for (let i = 0; i < 5; i++) {
          addEnemy('B', i, enemies);
        }
        break;
        
      case 'hard':
        // 困难副本：3个B类 + 5个C类
        for (let i = 0; i < 3; i++) {
          addEnemy('B', i, enemies);
        }
        for (let i = 0; i < 5; i++) {
          addEnemy('C', i + 3, enemies);
        }
        break;
        
      case 'expert':
        // 专家副本：3个B类 + 6个C类 + 1个D类
        for (let i = 0; i < 3; i++) {
          addEnemy('B', i, enemies);
        }
        for (let i = 0; i < 6; i++) {
          addEnemy('C', i + 3, enemies);
        }
        addEnemy('D', 9, enemies); // 最后一个是D类
        break;
        
      default:
        // 默认普通副本：5个B类敌人
        for (let i = 0; i < 5; i++) {
          addEnemy('B', i, enemies);
        }
    }
    
    return enemies;
  };
  
  // 添加特定类型的敌人
  const addEnemy = (type, index, enemyArray) => {
    const enemyType = enemyTypes[type];
    const imageIndex = enemyType.image % enemyImages.length;
    
    // 为不同类型敌人随机选择不同的名称
    const namePrefix = type === 'D' ? '史诗级' : 
                      type === 'C' ? '精英' : 
                      type === 'B' ? '强化' : '';
    
    // 基于类型选择合适的名称和图片
    const randomNameIndex = getRandomInt(0, enemyNames.length - 1);
    const name = `${namePrefix}${enemyNames[randomNameIndex]}`;
    
    enemyArray.push({
      id: `enemy-${type}-${index}-${Date.now()}`,
      name: name,
      image_url: enemyImages[imageIndex],
      attack: enemyType.attack,
      defense: enemyType.health,
      health: enemyType.health,
      maxHealth: enemyType.health,
      isEnemy: true,
      rarity: type === 'D' ? 'legendary' : type === 'C' ? 'epic' : type === 'B' ? 'rare' : 'common',
      type: type // 保存敌人类型信息，便于后续使用
    });
  };
  
  // 开始游戏
  const startGame = () => {
    // 生成敌人
    const enemies = generateEnemies();
    setEnemyCards(enemies);
    
    // 设置活跃卡牌
    setActivePlayerCard(playerCards[0]);
    setActiveEnemyCard(enemies[0]);
    
    // 重置游戏状态
    setBattleLog([`战斗准备开始！${playerCards[0].name} 将对阵 ${enemies[0].name}，请点击"攻击"按钮开始战斗。`]);
    setCurrentTurn('player');
    setGameStarted(true);
    setBattleStarted(false); // 战斗尚未真正开始
    setGameEnded(false);
    setWinner(null);
  };
  
  // 日志滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLog]);
  
  // 清理自动攻击定时器
  useEffect(() => {
    return () => {
      if (autoAttackTimerRef.current) {
        clearTimeout(autoAttackTimerRef.current);
      }
    };
  }, []);
  
  // 执行攻击
  const performAttack = () => {
    if (isAttacking || gameEnded || !activePlayerCard || !activeEnemyCard) return;
    
    // 如果这是第一次攻击，设置战斗已开始
    if (!battleStarted) {
      setBattleStarted(true);
      setBattleLog(prev => [...prev, `战斗开始！${activePlayerCard.name} 对阵 ${activeEnemyCard.name}`]);
    }
    
    setIsAttacking(true);
    
    if (currentTurn === 'player') {
      // 玩家攻击敌人
      const damage = activePlayerCard.attack;
      const newHealth = Math.max(0, activeEnemyCard.health - damage);
      
      // 更新UI和日志
      setBattleLog(prev => [...prev, `${activePlayerCard.name} 攻击了 ${activeEnemyCard.name}，造成 ${damage} 点伤害！`]);
      console.log(`玩家攻击: ${damage}点伤害, 敌方血量: ${activeEnemyCard.health} -> ${newHealth}`);
      
      // 更新敌人生命值
      const updatedEnemies = [...enemyCards];
      updatedEnemies[0] = {
        ...updatedEnemies[0],
        health: newHealth
      };
      
      // 延迟处理结果
      setTimeout(() => {
        if (newHealth <= 0) {
          // 敌人被击败
          setBattleLog(prev => [...prev, `${activeEnemyCard.name} 被击败了！`]);
          
          // 移除当前敌人
          const remainingEnemies = updatedEnemies.slice(1);
          setEnemyCards(remainingEnemies);
          
          if (remainingEnemies.length === 0) {
            // 所有敌人被击败，玩家胜利
            setGameEnded(true);
            setWinner('player');
            setBattleLog(prev => [...prev, `恭喜！你赢得了战斗！`]);
          } else {
            // 换下一个敌人
            setActiveEnemyCard(remainingEnemies[0]);
            setBattleLog(prev => [...prev, `新的敌人出现了：${remainingEnemies[0].name}`]);
            setCurrentTurn('enemy'); // 设置为敌方回合
          }
        } else {
          // 敌人未被击败
          setEnemyCards(updatedEnemies);
          setActiveEnemyCard({...updatedEnemies[0]});
          setCurrentTurn('enemy'); // 设置为敌方回合
        }
        
        setIsAttacking(false);
        
        // 如果是敌方回合且不是游戏结束，调度敌方攻击
        if (currentTurn === 'enemy' && !gameEnded) {
          scheduleEnemyAttack();
        }
      }, 500);
      
    } else {
      // 敌人攻击玩家
      const damage = Math.max(1, Math.floor(activeEnemyCard.attack));
      const newHealth = Math.max(0, activePlayerCard.health - damage);
      
      // 更新UI和日志
      setBattleLog(prev => [...prev, `${activeEnemyCard.name} 攻击了 ${activePlayerCard.name}，造成 ${damage} 点伤害！`]);
      console.log(`敌方攻击: ${damage}点伤害, 玩家血量: ${activePlayerCard.health} -> ${newHealth}`);
      
      // 更新玩家生命值
      const updatedPlayers = [...playerCards];
      updatedPlayers[0] = {
        ...updatedPlayers[0],
        health: newHealth
      };
      
      // 延迟处理结果
      setTimeout(() => {
        if (newHealth <= 0) {
          // 玩家卡牌被击败
          setBattleLog(prev => [...prev, `${activePlayerCard.name} 被击败了！`]);
          
          // 移除当前玩家卡牌
          const remainingPlayers = updatedPlayers.slice(1);
          setPlayerCards(remainingPlayers);
          
          if (remainingPlayers.length === 0) {
            // 所有玩家卡牌被击败，敌人胜利
            setGameEnded(true);
            setWinner('enemy');
            setBattleLog(prev => [...prev, `战斗失败！敌人获胜了。`]);
          } else {
            // 换下一个玩家卡牌
            setActivePlayerCard(remainingPlayers[0]);
            setBattleLog(prev => [...prev, `你的下一张卡牌上场：${remainingPlayers[0].name}`]);
            setCurrentTurn('player'); // 设置为玩家回合
          }
        } else {
          // 玩家未被击败
          setPlayerCards(updatedPlayers);
          setActivePlayerCard({...updatedPlayers[0]});
          setCurrentTurn('player'); // 设置为玩家回合
        }
        
        setIsAttacking(false);
      }, 500);
    }
  };
  
  // 排队敌方攻击
  const scheduleEnemyAttack = () => {
    // 清除可能存在的旧定时器
    if (autoAttackTimerRef.current) {
      clearTimeout(autoAttackTimerRef.current);
    }
    
    // 创建新的定时器
    autoAttackTimerRef.current = setTimeout(() => {
      if (currentTurn === 'enemy' && !isAttacking && !gameEnded) {
        console.log("执行敌方攻击");
        performAttack();
      }
    }, 800);
  };
  
  // 处理自动战斗
  useEffect(() => {
    if (!gameStarted || gameEnded) return;
    
    // 如果开启自动战斗，或者是敌方回合，安排攻击
    if ((autoPlayEnabled && battleStarted) || (currentTurn === 'enemy' && battleStarted)) {
      if (!isAttacking) {
        const delay = autoPlayEnabled ? gameSpeed : (currentTurn === 'enemy' ? 800 : 0);
        
        autoAttackTimerRef.current = setTimeout(() => {
          console.log(`执行${currentTurn === 'player' ? '玩家' : '敌方'}攻击，自动模式: ${autoPlayEnabled}`);
          performAttack();
        }, delay);
      }
    }
    
    return () => {
      if (autoAttackTimerRef.current) {
        clearTimeout(autoAttackTimerRef.current);
      }
    };
  }, [gameStarted, gameEnded, currentTurn, autoPlayEnabled, isAttacking, gameSpeed, battleStarted]);
  
  // 玩家手动攻击
  const handlePlayerAttack = () => {
    if (currentTurn === 'player' && !isAttacking && !gameEnded) {
      performAttack();
    }
  };
  
  // 交换卡牌顺序
  const selectCardForSwap = (index) => {
    // 不能选择当前战斗中的卡牌（索引0）
    if (index === 0 || gameEnded) return;
    
    if (selectedCardIndices.includes(index)) {
      // 取消选择
      setSelectedCardIndices(prev => prev.filter(i => i !== index));
    } else {
      // 新增选择
      const newIndices = [...selectedCardIndices, index];
      
      // 如果选择了两张牌，交换它们
      if (newIndices.length === 2) {
        const [idx1, idx2] = newIndices;
        const newCards = [...playerCards];
        const temp = newCards[idx1];
        newCards[idx1] = newCards[idx2];
        newCards[idx2] = temp;
        
        setPlayerCards(newCards);
        setBattleLog(prev => [...prev, `调整了卡牌顺序：${newCards[idx1].name} 和 ${newCards[idx2].name}`]);
        setSelectedCardIndices([]);
      } else {
        setSelectedCardIndices(newIndices);
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
    
    // 只有在战斗真正开始后才绘制卡牌
    if (battleStarted && activePlayerCard && activeEnemyCard) {
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
      drawCard(activePlayerCard, width * 0.2 - 75, height / 2 - 110, 'player');
      drawCard(activeEnemyCard, width * 0.8 - 75, height / 2 - 110, 'enemy');
      
      // 绘制回合指示器
      ctx.save();
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      
      if (currentTurn === 'player') {
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
    } else if (!battleStarted && gameStarted) {
      // 显示"等待战斗开始"的提示
      ctx.save();
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillText('点击"攻击"按钮开始战斗', width / 2, height / 2);
      ctx.restore();
    }
    
    // 如果战斗结束，显示胜利/失败信息
    if (gameEnded) {
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
  }, [gameStarted, activePlayerCard, activeEnemyCard, currentTurn, gameEnded, winner, isAttacking, battleStarted]);
  
  // 绘制单张卡牌
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
    const healthPercentage = Math.max(0, card.health / card.maxHealth);
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + 10, y + 190, 130, 20);
    ctx.fillStyle = side === 'player' ? '#00FF00' : '#FF0000';
    ctx.fillRect(x + 10, y + 190, 130 * healthPercentage, 20);
    
    // 绘制血量数值
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, card.health)}/${card.maxHealth}`, x + 75, y + 205);
    
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
      // 图片加载失败时显示占位符
      ctx.fillStyle = '#666666';
      ctx.fillRect(x + 15, y + 50, 120, 130);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', x + 75, y + 105);
    };
    
    // 根据当前回合高亮显示
    if ((side === 'player' && currentTurn === 'player') || (side === 'enemy' && currentTurn === 'enemy')) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 6;
      ctx.strokeRect(x - 5, y - 5, 160, 230);
    }
  };
  
  // 调整Canvas尺寸
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameStarted]);
  
  // 渲染开始界面
  if (!gameStarted) {
    return (
      <div className="battle-start-container">
        <div className="battle-title-container">
          <h1 className="battle-title">数据库猎人的奇妙冒险</h1>
          <div className="battle-subtitle">副本：{dungeon.dungeon_name || '未知副本'}</div>
          <div className="battle-subtitle">难度：{dungeon.difficulty || '未知难度'}</div>
          <button className="battle-start-btn" onClick={startGame}>
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
          
          {currentTurn === 'player' && !autoPlayEnabled && !gameEnded && (
            <button 
              className="battle-attack-btn" 
              onClick={handlePlayerAttack}
              disabled={isAttacking}
            >
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