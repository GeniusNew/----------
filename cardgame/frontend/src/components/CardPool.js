import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CardPool.css';

function CardPool({ user, updateUserResources }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [drawResults, setDrawResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  
  // 卡池费用
  const costs = {
    singleDraw: { gems: 100, coins: 0 },
    tenDraw: { gems: 950, coins: 0 }
  };
  
  // 处理图片URL，尝试不同扩展名
  const getImageUrl = (cardName) => {
    // 默认使用卡名作为图片名称的基础部分，优先尝试.png
    return `/images/cards/${cardName}.png`;
  };
  
  // 尝试不同扩展名加载图片
  const tryAlternateImageFormats = (e, cardName) => {
    const imgElement = e.target;
    const currentSrc = imgElement.src;
    
    console.log(`图片加载失败: ${currentSrc}`);
    
    // 如果当前URL包含.png，尝试.jpg
    if (currentSrc.endsWith('.png')) {
      imgElement.src = `/images/cards/${cardName}.jpg`;
      console.log(`尝试加载: ${imgElement.src}`);
      return;
    }
    
    // 如果当前URL包含.jpg，尝试无扩展名
    if (currentSrc.endsWith('.jpg')) {
      imgElement.src = `/images/cards/${cardName}`;
      console.log(`尝试加载: ${imgElement.src}`);
      return;
    }
    
    // 如果所有尝试都失败，显示首字母
    console.error(`所有图片格式加载失败，显示首字母`);
    imgElement.style.display = 'none';
    imgElement.parentNode.innerText = cardName.charAt(0);
  };
  
  // 返回主页
  const goToHome = () => {
    navigate('/');
  };
  
  // 单抽功能
  const singleDraw = async () => {
    if (user.gems < costs.singleDraw.gems) {
      alert('钻石不足，无法进行单抽！');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/cardpool/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ drawType: 'single' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDrawResults(data.cards);
        setShowResults(true);
        updateUserResources(data.updatedResources);
      } else {
        alert(data.message || '抽卡失败，请稍后再试');
      }
    } catch (error) {
      console.error('抽卡出错:', error);
      alert('网络错误，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 十连功能
  const tenDraw = async () => {
    if (user.gems < costs.tenDraw.gems) {
      alert('钻石不足，无法进行十连抽！');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/cardpool/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ drawType: 'ten' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setDrawResults(data.cards);
        setShowResults(true);
        updateUserResources(data.updatedResources);
      } else {
        alert(data.message || '抽卡失败，请稍后再试');
      }
    } catch (error) {
      console.error('抽卡出错:', error);
      alert('网络错误，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 关闭结果展示
  const closeResults = () => {
    setShowResults(false);
    setDrawResults([]);
  };

  return (
    <div className="card-pool-container">
      <div className="top-bar">
        <button className="back-button" onClick={goToHome}>返回</button>
        <div className="resources">
          <div className="resource">
            <span className="resource-icon">💎</span>
            <span className="resource-value">{user?.gems || 0}</span>
          </div>
          <div className="resource">
            <span className="resource-icon">🪙</span>
            <span className="resource-value">{user?.coins || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="card-pool-content">
        <h1 className="pool-title">卡池抽取</h1>
        
        <div className="draw-buttons">
          <button 
            className="draw-button single-draw" 
            onClick={singleDraw} 
            disabled={isLoading}
          >
            单抽 (💎 {costs.singleDraw.gems})
          </button>
          
          <button 
            className="draw-button ten-draw" 
            onClick={tenDraw} 
            disabled={isLoading}
          >
            十连抽 (💎 {costs.tenDraw.gems})
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>抽取中...</p>
        </div>
      )}
      
      {showResults && (
        <div className="results-container">
          <div className="results-content">
            <h2>抽卡结果</h2>
            <div className="cards-grid">
              {drawResults.map((card, index) => (
                <div 
                  key={index} 
                  className={`card-item rarity-${card.rarity.toLowerCase()}`}
                >
                  <div className="card-image">
                    {card.image_url ? (
                      <img 
                        src={getImageUrl(card.name)} 
                        alt={card.name} 
                        onError={(e) => tryAlternateImageFormats(e, card.name)}
                        onLoad={() => console.log(`图片加载成功: ${getImageUrl(card.name)}`)}
                      />
                    ) : (
                      card.name.charAt(0)
                    )}
                  </div>
                  <div className="card-info">
                    <div className="card-name">{card.name}</div>
                    <div className="card-rarity">{card.rarity}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="close-button" onClick={closeResults}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardPool; 