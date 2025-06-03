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
  const [selectedSlot, setSelectedSlot] = useState(null);

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
          setUserCards(response.data.cards);
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

  // 选择卡牌
  const selectCard = (card) => {
    if (selectedSlot !== null) {
      // 检查该卡牌是否已经在其他槽位中
      const isAlreadySelected = selectedCards.some((selectedCard, index) => 
        selectedCard && selectedCard.id === card.id && index !== selectedSlot
      );
      
      if (!isAlreadySelected) {
        const newSelectedCards = [...selectedCards];
        newSelectedCards[selectedSlot] = card;
        setSelectedCards(newSelectedCards);
        setSelectedSlot(null);
      } else {
        alert('该卡牌已被选择！');
      }
    } else {
      alert('请先选择一个槽位！');
    }
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
    
    // 这里可以导航到战斗界面或者发送战斗请求
    alert(`即将开始战斗！\n已选择 ${selectedCardCount} 张卡牌`);
  };

  // 返回副本选择
  const goBack = () => {
    navigate('/dungeons');
  };

  // 获取稀有度显示名称
  const getRarityName = (rarity) => {
    const rarityMap = {
      'normal': 'N',
      'common': 'R',
      'rare': 'SR',
      'epic': 'SSR'
    };
    return rarityMap[rarity] || rarity;
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
        <h1>选择你的植物</h1>
        <div className="dungeon-info">
          <span className="dungeon-name">{dungeon?.dungeon_name || '未知副本'}</span>
        </div>
      </div>

      {/* 上方槽位区域 */}
      <div className="slots-container">
        <div className="slots-grid">
          {selectedCards.map((card, index) => (
            <div 
              key={index}
              className={`card-slot ${selectedSlot === index ? 'selected' : ''} ${card ? 'filled' : ''}`}
              onClick={() => setSelectedSlot(index)}
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
                  <span className="slot-text">点击选择</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 开始战斗按钮 */}
        <div className="battle-controls">
          <button className="start-battle-btn" onClick={startBattle}>
            开始战斗
          </button>
        </div>
      </div>

      {/* 卡牌选择区域 */}
      <div className="cards-selection-area">
        <div className="cards-grid">
          {userCards.map(card => (
            <div 
              key={card.id}
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