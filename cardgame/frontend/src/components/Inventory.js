import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Inventory.css';

function Inventory({ user, refreshUserData }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [filterRarity, setFilterRarity] = useState('all');
  const [userData, setUserData] = useState(user || { gems: 0, coins: 0 });
  
  // 稀有度过滤选项
  const rarityOptions = [
    { value: 'all', label: '全部' },
    { value: 'common', label: '普通 (R)' },
    { value: 'rare', label: '稀有 (SR)' },
    { value: 'epic', label: '史诗 (SSR)' }
  ];
  
  // 加载用户数据
  useEffect(() => {
    // 如果从props传入了用户数据，直接使用
    if (user) {
      console.log('从props获取用户数据:', user);
      setUserData(user);
    } else {
      console.log('从API获取用户数据');
      // 否则从API获取
      const fetchUserData = async () => {
        try {
          const response = await axios.get('/api/user/resources', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('用户数据获取成功:', response.data);
          setUserData(response.data);
        } catch (err) {
          console.error('获取用户数据失败:', err);
        }
      };
      
      fetchUserData();
    }
  }, [user]);
  
  // 加载用户卡牌数据
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        setIsLoading(true);
        console.log('正在获取用户卡牌...');
        const response = await axios.get('/api/user/cards', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('卡牌数据响应:', response.data);
        
        if (response.data.success) {
          setCards(response.data.cards);
          console.log('获取到卡牌:', response.data.cards.length, '张');
        } else {
          console.error('获取卡牌失败:', response.data.message);
          setError(response.data.message || '获取卡牌失败');
        }
      } catch (err) {
        console.error('获取卡牌错误:', err);
        if (err.response) {
          console.error('错误状态:', err.response.status);
          console.error('错误数据:', err.response.data);
        }
        setError(err.response?.data?.message || '获取卡牌失败，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserCards();
  }, []);
  
  // 返回主页
  const goToHome = () => {
    navigate('/');
  };
  
  // 查看卡牌详情
  const viewCardDetails = (card) => {
    setSelectedCard(card);
    setShowCardDetails(true);
  };
  
  // 关闭卡牌详情
  const closeCardDetails = () => {
    setShowCardDetails(false);
    setSelectedCard(null);
  };
  
  // 根据稀有度过滤卡牌
  const filteredCards = filterRarity === 'all' 
    ? cards 
    : cards.filter(card => card.rarity === filterRarity);
  
  // 稀有度中文名
  const getRarityName = (rarity) => {
    switch(rarity) {
      case 'common': return '普通 (R)';
      case 'rare': return '稀有 (SR)';
      case 'epic': return '史诗 (SSR)';
      default: return rarity;
    }
  };
  
  return (
    <div className="inventory-container">
      <div className="top-bar">
        <button className="back-button" onClick={goToHome}>返回</button>
        <div className="page-title">卡牌仓库</div>
        <div className="resources">
          <div className="resource">
            <span className="resource-icon">💎</span>
            <span className="resource-value">{userData?.gems || 0}</span>
          </div>
          <div className="resource">
            <span className="resource-icon">🪙</span>
            <span className="resource-value">{userData?.coins || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="inventory-content">
        <div className="filter-bar">
          <div className="filter-group">
            <label>稀有度：</label>
            <select 
              value={filterRarity} 
              onChange={(e) => setFilterRarity(e.target.value)}
              className="rarity-filter"
            >
              {rarityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="card-count">
            {filteredCards.length} / {cards.length} 张卡牌
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-message">加载中...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredCards.length === 0 ? (
          <div className="empty-message">
            {filterRarity === 'all' 
              ? '你的仓库中还没有卡牌，去抽卡获取卡牌吧！' 
              : `你的仓库中没有${getRarityName(filterRarity)}卡牌`}
          </div>
        ) : (
          <div className="cards-grid">
            {filteredCards.map(card => (
              <div 
                key={card.id} 
                className={`card-item rarity-${card.rarity}`}
                onClick={() => viewCardDetails(card)}
              >
                <div className="card-image">
                  {card.image_url ? (
                    <img 
                      src={card.image_url} 
                      alt={card.name} 
                      onError={(e) => {
                        console.log(`图片加载失败: ${card.image_url}, 使用默认图片`);
                        e.target.src = '/images/cards/ex_card_1.png';
                        e.target.onerror = null; // 防止无限循环
                      }}
                    />
                  ) : (
                    card.name.charAt(0)
                  )}
                </div>
                <div className="card-info">
                  <div className="card-name">{card.name}</div>
                  <div className="card-rarity">{getRarityName(card.rarity)}</div>
                  <div className="card-level">等级：{card.level}</div>
                  {card.quantity > 1 && (
                    <div className="card-quantity">x{card.quantity}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showCardDetails && selectedCard && (
        <div className="card-details-overlay">
          <div className="card-details-container">
            <button 
              className="close-button" 
              onClick={closeCardDetails}
            >
              关闭
            </button>
            
            <div className="card-details-content">
              <div className={`card-detail-image rarity-${selectedCard.rarity}`}>
                {selectedCard.image_url ? (
                  <img 
                    src={selectedCard.image_url} 
                    alt={selectedCard.name} 
                    onError={(e) => {
                      console.log(`图片加载失败: ${selectedCard.image_url}, 使用默认图片`);
                      e.target.src = '/images/cards/ex_card_1.png';
                      e.target.onerror = null; // 防止无限循环
                    }}
                  />
                ) : (
                  selectedCard.name.charAt(0)
                )}
              </div>
              
              <div className="card-detail-info">
                <h2>{selectedCard.name}</h2>
                <div className="detail-row">
                  <span className="detail-label">稀有度：</span>
                  <span className={`detail-value rarity-text-${selectedCard.rarity}`}>
                    {getRarityName(selectedCard.rarity)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">类型：</span>
                  <span className="detail-value">{selectedCard.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">等级：</span>
                  <span className="detail-value">{selectedCard.level}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">攻击力：</span>
                  <span className="detail-value">{selectedCard.attack}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">防御力：</span>
                  <span className="detail-value">{selectedCard.defense}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">数量：</span>
                  <span className="detail-value">{selectedCard.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">获得时间：</span>
                  <span className="detail-value">
                    {new Date(selectedCard.acquired_time).toLocaleString()}
                  </span>
                </div>
                
                <div className="card-description">
                  <h3>卡牌描述</h3>
                  <p>{selectedCard.description || '暂无描述'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory; 