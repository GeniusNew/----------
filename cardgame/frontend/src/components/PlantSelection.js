import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/PlantSelection.css';

function PlantSelection() {
  const navigate = useNavigate();
  const { dungeonId } = useParams();
  const location = useLocation();
  const dungeon = location.state?.dungeon;
  
  const [userCards, setUserCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState(Array(8).fill(null)); // 8个槽位
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState('rarity'); // 默认按稀有度排序
  
  // 定义排序选项
  const sortOptions = [
    { value: 'rarity', label: '稀有度' },
    { value: 'level', label: '等级' },
    { value: 'attack', label: '攻击' },
    { value: 'defense', label: '防御' },
    { value: 'name', label: '名称' }
  ];

  // 获取用户卡牌
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/user/cards', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          // 详细记录返回的数据结构，查看第一个卡牌的内容
          if(response.data.cards && response.data.cards.length > 0) {
            console.log('卡牌数据结构示例:', JSON.stringify(response.data.cards[0], null, 2));
          }
          console.log(`原始卡牌总数: ${response.data.cards.length}`);
          
          // 记录每张卡牌的稀有度，以帮助诊断排序问题
          if(response.data.cards && response.data.cards.length > 0) {
            console.log('所有卡牌的稀有度值：');
            response.data.cards.forEach(card => {
              console.log(`卡牌名称: ${card.name}, 稀有度: ${card.rarity}`);
            });
          }
          
          // 用一个对象来分析卡牌名称的分布情况
          const cardNameCounts = {};
          response.data.cards.forEach(card => {
            cardNameCounts[card.name] = (cardNameCounts[card.name] || 0) + 1;
          });
          console.log('卡牌名称分布:', cardNameCounts);
          
          // 更可靠的去重方式：确保名称、卡牌类型和稀有度都匹配为同一种卡牌
          const uniqueCards = [];
          const cardMap = new Map(); 
          
          // 按卡牌名称和类型分组
          response.data.cards.forEach(card => {
            // 使用更复杂的键来标识唯一卡牌：名称+类型+稀有度
            const cardKey = `${card.name}_${card.card_type || 'unknown'}_${card.rarity || 'unknown'}`;
            const existingCard = cardMap.get(cardKey);
            
            // 判断是否需要更新
            if (!existingCard || 
                existingCard.level < card.level ||
                (existingCard.level === card.level && existingCard.attack < card.attack) ||
                (existingCard.level === card.level && existingCard.attack === card.attack && existingCard.defense < card.defense)) {
              cardMap.set(cardKey, card);
            }
          });
          
          console.log(`去重后卡牌数量: ${cardMap.size}`);
          
          // 转换回数组
          cardMap.forEach((card) => {
            uniqueCards.push({
              ...card
            });
          });
          
          // 应用默认排序
          const sortedCards = sortCards(uniqueCards, sortOption);
          console.log('最终要展示的卡牌列表:', sortedCards.map(c => c.name));
          setUserCards(sortedCards);
        } else {
          setError('获取卡牌失败');
        }
      } catch (err) {
        console.error('获取卡牌失败:', err);
        setError('网络错误，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCards();
  }, []);

  // 根据选项排序卡牌
  const sortCards = (cards, option) => {
    // 调试日志，检查卡牌的稀有度值
    console.log('排序前的卡牌稀有度：', cards.map(card => `${card.name}: ${card.rarity}`));
    
    // 修复稀有度映射，确保SSR/epic排在最前面
    // 使用更可靠的排序方式，无论稀有度字段实际是什么值
    const getRarityOrder = (rarity) => {
      if (!rarity) return 99;
      
      const rarityLower = rarity.toLowerCase();
      
      if (rarityLower === 'ssr' || rarityLower === 'epic') return 0;
      if (rarityLower === 'sr' || rarityLower === 'rare') return 1;
      if (rarityLower === 'r' || rarityLower === 'common') return 2;
      if (rarityLower === 'n' || rarityLower === 'normal') return 3;
      
      return 99; // 未知稀有度排在最后
    };
    
    return [...cards].sort((a, b) => {
      switch(option) {
        case 'rarity':
          // 首先按稀有度排序
          const rarityCompare = getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
          // 稀有度相同则按等级排序
          if (rarityCompare === 0) {
            return b.level - a.level;
          }
          return rarityCompare;
          
        case 'level':
          // 按等级排序，等级相同则按稀有度
          const levelCompare = b.level - a.level;
          if (levelCompare === 0) {
            return getRarityOrder(a.rarity) - getRarityOrder(b.rarity);
          }
          return levelCompare;
          
        case 'attack':
          // 按攻击力排序
          return b.attack - a.attack;
          
        case 'defense':
          // 按防御力排序
          return b.defense - a.defense;
          
        case 'name':
          // 按名称字母顺序排序
          return a.name.localeCompare(b.name);
          
        default:
          return 0;
      }
    });
  };

  // 处理排序选项变更
  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);
    setUserCards(sortCards(userCards, option));
  };

  // 选择卡牌 - 自动填入下一个空槽位
  const selectCard = (card) => {
    // 检查该卡牌是否已经在槽位中
    const isAlreadySelected = selectedCards.some(selectedCard => 
      selectedCard && selectedCard.id === card.id
    );
    
    if (isAlreadySelected) {
      alert('该卡牌已被选择！');
      return;
    }

    // 找到第一个空槽位
    const emptySlotIndex = selectedCards.findIndex(slot => slot === null);
    
    if (emptySlotIndex === -1) {
      alert('所有槽位已满！');
      return;
    }

    // 将卡牌放入第一个空槽位
    const newSelectedCards = [...selectedCards];
    newSelectedCards[emptySlotIndex] = card;
    setSelectedCards(newSelectedCards);
  };

  // 移除卡牌
  const removeCard = (slotIndex) => {
    const newSelectedCards = [...selectedCards];
    newSelectedCards[slotIndex] = null;
    setSelectedCards(newSelectedCards);
  };
  
  // 开始战斗
  const startBattle = () => {
    const selectedCardCount = selectedCards.filter(card => card !== null).length;
    if (selectedCardCount === 0) {
      alert('请至少选择一张卡牌！');
      return;
    }
    
    // 导航到战斗界面并传递选中的卡牌
    navigate('/battle', { state: { selectedCards: selectedCards.filter(card => card !== null), dungeon } });
  };

  // 返回副本选择
  const goBack = () => {
    navigate('/dungeons');
  };

  // 获取稀有度显示名称
  const getRarityName = (rarity) => {
    if (!rarity) return 'N';
    
    // 统一转小写以便比较
    const rarityLower = rarity.toLowerCase();
    
    if (rarityLower === 'ssr' || rarityLower === 'epic') return 'SSR';
    if (rarityLower === 'sr' || rarityLower === 'rare') return 'SR';
    if (rarityLower === 'r' || rarityLower === 'common') return 'R';
    if (rarityLower === 'n' || rarityLower === 'normal') return 'N';
    
    // 如果没有匹配，返回原始值的大写形式
    return rarity.toUpperCase();
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="plant-selection-container">
        <div className="error-message">{error}</div>
        <button onClick={goBack} className="back-button">返回副本选择</button>
      </div>
    );
  }

  return (
    <div className="plant-selection-container">
      {/* 顶部信息栏 */}
      <div className="selection-header">
        <button onClick={goBack} className="back-button">
          ← 返回副本选择
        </button>
        <h1>选择你的卡牌</h1>
        <div className="dungeon-info">
          <span className="dungeon-name">{dungeon?.dungeon_name || '未知副本'}</span>
        </div>
      </div>

      {/* 上方槽位区域 */}
      <div className="slots-container">
        <div className="slots-grid">
          {selectedCards.map((card, index) => (
            <div 
              key={`slot-${index}`}
              className={`card-slot ${card ? 'filled' : ''}`}
            >
              {card ? (
                <div className="slot-card">
                  <img 
                    src={card.image_url} 
                    alt={card.name}
                    onError={(e) => {
                      e.target.src = '/images/cards/ex_card_1.png';
                      e.target.onerror = null;
                    }}
                  />
                  <div className="slot-card-name">{card.name}</div>
                  <button 
                    className="remove-card-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(index);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="empty-slot">
                  <span className="slot-number">{index + 1}</span>
                  <span className="slot-text">空槽位</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 修改控制区域，删除对已选卡牌排序按钮 */}
        <div className="battle-controls">
          <button className="start-battle-btn" onClick={startBattle}>
            开始战斗
          </button>
        </div>
      </div>

      {/* 排序控制区 */}
      <div className="sort-controls">
        <label htmlFor="sort-select">排序方式：</label>
        <select 
          id="sort-select" 
          value={sortOption} 
          onChange={handleSortChange}
          className="sort-select"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 卡牌选择区域 */}
      <div className="cards-selection-area">
        <div className="cards-grid">
          {userCards.map((card, index) => (
            <div 
              key={`${card.name}_${card.card_type || 'unknown'}_${card.rarity || 'unknown'}_${index}`}
              className={`selectable-card rarity-${card.rarity}`}
              onClick={() => selectCard(card)}
            >
              <div className="card-image">
                <img 
                  src={card.image_url} 
                  alt={card.name}
                  onError={(e) => {
                    e.target.src = '/images/cards/ex_card_1.png';
                    e.target.onerror = null;
                  }}
                />
              </div>
              <div className="card-info">
                <div className="card-name">{card.name}</div>
                <div className="card-type">{card.card_type || '未知类型'}</div>
                <div className="card-stats">
                  <span className="attack">攻击: {card.attack}</span>
                  <span className="defense">防御: {card.defense}</span>
                </div>
                <div className="card-rarity">{getRarityName(card.rarity)}</div>
                <div className="card-level">Lv.{card.level}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlantSelection; 