import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CardPool.css';

function CardPool({ user: userProp, refreshUserData }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [drawResults, setDrawResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(userProp || { gems: 0, coins: 0 });
  const [cardPool, setCardPool] = useState(null);
  const [rates, setRates] = useState({ common: 0, rare: 0, epic: 0 });
  const [error, setError] = useState('');
  
  // 卡池费用
  const costs = {
    singleDraw: { gems: 100, coins: 0 },
    tenDraw: { gems: 950, coins: 0 }
  };
  
  // 加载用户数据和卡池信息
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // 如果没有从props获取到用户数据，从API获取
        if (!userProp) {
          console.log('从API获取用户数据');
          // 获取用户资源
          const userResponse = await axios.get('/api/user/resources', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setUser(userResponse.data);
          console.log('用户数据加载成功:', userResponse.data);
        } else {
          console.log('从props获取用户数据:', userProp);
          setUser(userProp);
        }
        
        // 获取卡池信息
        console.log('开始获取卡池信息...');
        const poolResponse = await axios.get('/api/cardpool/info', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('卡池数据响应:', poolResponse.data);
        
        if (poolResponse.data && poolResponse.data.success) {
          console.log('成功获取卡池数据:', poolResponse.data.cardPool);
          setCardPool(poolResponse.data.cardPool);
          setRates(poolResponse.data.rates);
          console.log('卡池数据设置完成');
          setError(''); // 清除错误信息
        } else {
          console.error('卡池数据响应格式错误:', poolResponse.data);
          setError('卡池数据格式错误');
        }
      } catch (err) {
        console.error('加载数据失败详情:', err);
        if (err.response) {
          console.error('错误响应状态:', err.response.status);
          console.error('错误响应数据:', err.response.data);
          
          // 检查是否是身份验证错误
          if (err.response.status === 401) {
            setError('身份验证失败，请重新登录');
          } else if (err.response.status === 403) {
            setError('访问被拒绝，请检查登录状态');
          } else if (err.response.status === 500) {
            setError('服务器错误，请稍后再试');
          } else {
            setError(`请求失败: ${err.response.status}`);
          }
        } else if (err.request) {
          console.error('网络请求失败:', err.request);
          setError('网络连接失败，请检查网络或稍后再试');
        } else {
          console.error('请求设置错误:', err.message);
          setError('请求设置错误');
        }
        
        // 不再使用默认值掩盖错误，保持卡池为null状态
        console.log('卡池数据加载失败，不使用默认数据');
        setCardPool(null);
        setRates({ common: 0, rare: 0, epic: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userProp]);
  
  // 稀有度中文名
  const getRarityName = (rarity) => {
    switch(rarity) {
      case 'normal': return '普通 (N)';
      case 'common': return '常见 (R)';
      case 'rare': return '稀有 (SR)';
      case 'epic': return '史诗 (SSR)';
      default: return rarity;
    }
  };
  
  // 返回主页
  const goToHome = () => {
    navigate('/');
  };
  
  // 去仓库页面
  const goToInventory = () => {
    navigate('/inventory');
  };
  
  // 单抽功能
  const singleDraw = async () => {
    if (user.gems < costs.singleDraw.gems) {
      alert('钻石不足，无法进行单抽！');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.post('/api/cardpool/draw', 
        { drawType: 'single' },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setDrawResults(response.data.cards);
        setShowResults(true);
        setUser(prevUser => ({
          ...prevUser,
          gems: response.data.updatedResources.gems,
          coins: response.data.updatedResources.coins
        }));
        
        // 刷新App组件中的用户数据
        if (refreshUserData) refreshUserData();
      } else {
        setError(response.data.message || '抽卡失败，请稍后再试');
      }
    } catch (error) {
      console.error('抽卡出错:', error);
      setError(error.response?.data?.message || '网络错误，请稍后再试');
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
      setError('');
      
      const response = await axios.post('/api/cardpool/draw', 
        { drawType: 'ten' },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setDrawResults(response.data.cards);
        setShowResults(true);
        setUser(prevUser => ({
          ...prevUser,
          gems: response.data.updatedResources.gems,
          coins: response.data.updatedResources.coins
        }));
        
        // 刷新App组件中的用户数据
        if (refreshUserData) refreshUserData();
      } else {
        setError(response.data.message || '抽卡失败，请稍后再试');
      }
    } catch (error) {
      console.error('抽卡出错:', error);
      setError(error.response?.data?.message || '网络错误，请稍后再试');
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
        <div className="page-title">卡池抽取</div>
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
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="card-pool-content">
        {cardPool ? (
          <>
            <div className="card-pool-info">
              <h2>{cardPool.name}</h2>
              <p>{cardPool.description}</p>
              
              <div className="rates-info">
                <div className="rate-item">
                  <div className="rate-label">普通 (N):</div>
                  <div className="rate-value">{rates.normal || 59}%</div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">常见 (R):</div>
                  <div className="rate-value">{rates.common || 30}%</div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">稀有 (SR):</div>
                  <div className="rate-value">{rates.rare || 10}%</div>
                </div>
                <div className="rate-item">
                  <div className="rate-label">史诗 (SSR):</div>
                  <div className="rate-value">{rates.epic || 1}%</div>
                </div>
              </div>
            </div>
            
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
            
            <button className="inventory-button" onClick={goToInventory}>
              查看仓库
            </button>
          </>
        ) : (
          <div className="card-pool-unavailable">
            <h2>卡池暂时不可用</h2>
            <p>无法加载卡池数据，请稍后再试</p>
            <button className="inventory-button" onClick={goToInventory}>
              查看仓库
            </button>
          </div>
        )}
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
                  className={`card-item rarity-${card.rarity}`}
                >
                  <div className="card-image">
                    <img 
                      src={card.image_url} 
                      alt={card.name} 
                      onError={(e) => {
                        console.log(`图片加载失败: ${card.image_url}, 使用默认图片`);
                        e.target.src = '/images/cards/ex_card_1.png';
                        e.target.onerror = null; // 防止无限循环
                      }}
                    />
                  </div>
                  <div className="card-info">
                    <div className="card-name">{card.name}</div>
                    <div className="card-rarity">{getRarityName(card.rarity)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="results-actions">
              <button className="close-results" onClick={closeResults}>关闭</button>
              <button className="view-inventory" onClick={goToInventory}>查看仓库</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardPool; 