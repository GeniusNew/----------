import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Cultivate.css';

function Cultivate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCard, setSelectedCard] = useState(null);
  
  useEffect(() => {
    // 从路由状态中获取选中的卡牌信息
    if (location.state && location.state.selectedCard) {
      setSelectedCard(location.state.selectedCard);
    } else {
      // 如果没有卡牌信息，返回仓库
      navigate('/inventory');
    }
  }, [location.state, navigate]);
  
  const goBack = () => {
    navigate('/inventory');
  };
  
  if (!selectedCard) {
    return (
      <div className="cultivate-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }
  
  return (
    <div className="cultivate-container">
      <div className="top-bar">
        <button className="back-button" onClick={goBack}>返回仓库</button>
        <div className="page-title">卡牌培养</div>
      </div>
      
      <div className="cultivate-content">
        <div className="card-display">
          <div className={`card-image rarity-${selectedCard.rarity}`}>
            {selectedCard.image_url ? (
              <img 
                src={selectedCard.image_url} 
                alt={selectedCard.name} 
                onError={(e) => {
                  e.target.src = '/images/cards/ex_card_1.png';
                  e.target.onerror = null;
                }}
              />
            ) : (
              selectedCard.name.charAt(0)
            )}
          </div>
          
          <div className="card-info">
            <h2>{selectedCard.name}</h2>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">等级：</span>
                <span className="stat-value">{selectedCard.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">攻击力：</span>
                <span className="stat-value">{selectedCard.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">防御力：</span>
                <span className="stat-value">{selectedCard.defense}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cultivate-options">
          <div className="section-title">培养选项</div>
          
          <div className="cultivate-section">
            <h3>卡牌等级提升</h3>
            <p>提升卡牌等级可以增加基础攻击力和防御力</p>
            <button className="cultivate-btn" disabled>
              升级卡牌 (功能开发中)
            </button>
          </div>
          
          {selectedCard.skill_name && (
            <div className="cultivate-section">
              <h3>技能强化</h3>
              <p>强化技能可以提升技能的额外攻击力和防御力</p>
              <div className="skill-info">
                <div className="skill-name">{selectedCard.skill_name}</div>
                <div className="skill-stats">
                  <span>技能攻击力：+{selectedCard.skill_base_attack || 0}</span>
                  <span>技能防御力：+{selectedCard.skill_base_defense || 0}</span>
                </div>
              </div>
              <button className="cultivate-btn" disabled>
                强化技能 (功能开发中)
              </button>
            </div>
          )}
          
          <div className="cultivate-section">
            <h3>属性增强</h3>
            <p>消耗特殊材料增强卡牌的基础属性</p>
            <button className="cultivate-btn" disabled>
              属性增强 (功能开发中)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cultivate; 