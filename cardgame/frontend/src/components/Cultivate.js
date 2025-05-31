import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Cultivate.css';

function Cultivate({ user, refreshUserData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCard, setSelectedCard] = useState(null);
  const [enhancementItems, setEnhancementItems] = useState([]);
  const [targetLevel, setTargetLevel] = useState(1);
  const [upgradePreview, setUpgradePreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userData, setUserData] = useState(user || { gems: 0, coins: 0 });
  
  // 获取最新用户资源
  useEffect(() => {
    const fetchUserResources = async () => {
      try {
        const response = await axios.get('/api/user/resources', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUserData(response.data);
      } catch (error) {
        console.error('获取用户资源失败:', error);
        // 如果获取失败，使用传入的user数据作为备用
        if (user) {
          setUserData(user);
        }
      }
    };
    
    fetchUserResources();
  }, [user]);
  
  useEffect(() => {
    // 从路由状态中获取选中的卡牌信息
    if (location.state && location.state.selectedCard) {
      const card = location.state.selectedCard;
      setSelectedCard(card);
      setTargetLevel(card.level + 1);
    } else {
      // 如果没有卡牌信息，返回仓库
      navigate('/inventory');
    }
  }, [location.state, navigate]);
  
  // 获取用户强化物品
  const fetchEnhancementItems = async () => {
    try {
      const response = await axios.get('/api/user/enhancement-items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setEnhancementItems(response.data.items);
      }
    } catch (error) {
      console.error('获取强化物品失败:', error);
    }
  };

  useEffect(() => {
    fetchEnhancementItems();
  }, []);
  
  // 获取升级预览
  useEffect(() => {
    if (selectedCard && targetLevel > selectedCard.level) {
      fetchUpgradePreview();
    }
  }, [selectedCard, targetLevel]);
  
  const fetchUpgradePreview = async () => {
    try {
      setIsLoadingPreview(true);
      const response = await axios.get('/api/user/cards/upgrade-preview', {
        params: {
          userCardId: selectedCard.user_card_id,
          targetLevel: targetLevel
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setUpgradePreview(response.data.preview);
      }
    } catch (error) {
      console.error('获取升级预览失败:', error);
      setUpgradePreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const executeUpgrade = async () => {
    if (!upgradePreview || isUpgrading) return;
    
    try {
      setIsUpgrading(true);
      
      console.log('=== 执行卡牌升级 ===');
      console.log('当前用户资源:', userData);
      console.log('升级预览:', upgradePreview);
      console.log('发送升级请求:', {
        userCardId: selectedCard.user_card_id,
        targetLevel: targetLevel
      });
      
      const response = await axios.post('/api/user/cards/upgrade', {
        userCardId: selectedCard.user_card_id,
        targetLevel: targetLevel
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('升级响应:', response.data);

      if (response.data.success) {
        alert(response.data.message);
        
        // 更新卡牌信息
        setSelectedCard(prev => ({
          ...prev,
          level: response.data.newStats.level,
          attack: response.data.newStats.attack,
          defense: response.data.newStats.defense
        }));
        
        // 更新用户资源
        console.log('更新用户资源:', response.data.newUserResources);
        setUserData(response.data.newUserResources);
        
        // 设置新的目标等级
        setTargetLevel(response.data.newStats.level + 1);
        
        // 刷新强化物品
        fetchEnhancementItems();
        
        // 刷新父组件的用户数据
        if (refreshUserData) {
          refreshUserData();
        }
      } else {
        console.error('升级失败响应:', response.data);
        alert(response.data.message);
      }
    } catch (error) {
      console.error('升级请求异常:', error);
      console.error('错误详情:', error.response?.data);
      alert(error.response?.data?.message || '升级失败，请稍后再试');
    } finally {
      setIsUpgrading(false);
    }
  };
  
  // 使用道具
  const handleUseItem = async (itemName) => {
    try {
      const response = await axios.post('/api/user/cards/use-item', {
        userCardId: selectedCard.user_card_id,
        itemName: itemName
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = response.data;
      
      if (data.success) {
        alert(data.message);
        
        // 更新卡牌信息
        setSelectedCard(prev => ({
          ...prev,
          level: data.newStats.level,
          attack: data.newStats.attack,
          defense: data.newStats.defense
        }));
        
        // 刷新强化材料列表
        fetchEnhancementItems();
        
        // 如果有升级预览，重新获取
        if (upgradePreview) {
          fetchUpgradePreview();
        }
      } else {
        alert(data.message || '使用道具失败');
      }
    } catch (error) {
      console.error('使用道具失败:', error);
      alert('使用道具失败，请稍后再试');
    }
  };
  
  const goBack = () => {
    navigate('/inventory');
  };
  
  const getRarityName = (rarity) => {
    switch(rarity) {
      case 'common': return '普通 (R)';
      case 'rare': return '稀有 (SR)';
      case 'epic': return '史诗 (SSR)';
      default: return rarity;
    }
  };
  
  const getItemRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#a0a0a0';
      case 'rare': return '#4da6ff';
      case 'epic': return '#c642d8';
      case 'legendary': return '#ff8c00';
      default: return '#666';
    }
  };
  
  if (!selectedCard) {
    return (
      <div className="cultivate-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }
  
  const canUpgrade = selectedCard.level < 100;
  const maxTargetLevel = Math.min(100, selectedCard.level + 20); // 一次最多升20级
  
  return (
    <div className="cultivate-container">
      <div className="top-bar">
        <button className="back-button" onClick={goBack}>返回仓库</button>
        <div className="page-title">卡牌培养</div>
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
            <div className="card-rarity">{getRarityName(selectedCard.rarity)}</div>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-label">等级：</span>
                <span className="stat-value">{selectedCard.level}/100</span>
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
        
        <div className="upgrade-panel">
          {canUpgrade ? (
            <>
              <div className="section-title">卡牌升级</div>
              
              <div className="level-selector">
                <label>目标等级：</label>
                <input 
                  type="range" 
                  min={selectedCard.level + 1} 
                  max={maxTargetLevel}
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(parseInt(e.target.value))}
                  className="level-slider"
                />
                <div className="level-display">
                  <span>{selectedCard.level}</span>
                  <span>→</span>
                  <span className="target-level">{targetLevel}</span>
                </div>
              </div>
              
              {isLoadingPreview ? (
                <div className="preview-loading">计算升级消耗中...</div>
              ) : upgradePreview ? (
                <div className="upgrade-preview">
                  <div className="stat-changes">
                    <h3>属性提升</h3>
                    <div className="stat-change">
                      <span>攻击力：{upgradePreview.currentAttack}</span>
                      <span className="arrow">→</span>
                      <span className="new-value">{upgradePreview.newAttack}</span>
                      <span className="increase">(+{upgradePreview.attackIncrease})</span>
                    </div>
                    <div className="stat-change">
                      <span>防御力：{upgradePreview.currentDefense}</span>
                      <span className="arrow">→</span>
                      <span className="new-value">{upgradePreview.newDefense}</span>
                      <span className="increase">(+{upgradePreview.defenseIncrease})</span>
                    </div>
                  </div>
                  
                  <div className="upgrade-costs">
                    <h3>升级消耗</h3>
                    <div className="cost-item">
                      <span className="cost-icon">🪙</span>
                      <span>金币：{upgradePreview.goldCost}</span>
                      <span className={userData.coins >= upgradePreview.goldCost ? 'sufficient' : 'insufficient'}>
                        ({userData.coins >= upgradePreview.goldCost ? '充足' : '不足'})
                      </span>
                    </div>
                    
                    {upgradePreview.requiredItems.length > 0 && (
                      <div className="required-items">
                        <div className="items-title">需要材料：</div>
                        {upgradePreview.requiredItems.map((item, index) => {
                          const userItem = enhancementItems.find(ei => ei.item_name === item.itemName);
                          const hasEnough = userItem && userItem.quantity >= item.quantity;
                          
                          return (
                            <div key={index} className="item-requirement">
                              <span 
                                className="item-name"
                                style={{ color: getItemRarityColor(userItem?.rarity) }}
                              >
                                {item.itemName}
                              </span>
                              <span>：{item.quantity}</span>
                              <span className={hasEnough ? 'sufficient' : 'insufficient'}>
                                ({hasEnough ? '充足' : '不足'})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="upgrade-actions">
                    <button 
                      className="upgrade-button"
                      onClick={executeUpgrade}
                      disabled={
                        isUpgrading || 
                        userData.coins < upgradePreview.goldCost ||
                        upgradePreview.requiredItems.some(item => {
                          const userItem = enhancementItems.find(ei => ei.item_name === item.itemName);
                          return !userItem || userItem.quantity < item.quantity;
                        })
                      }
                    >
                      {isUpgrading ? '升级中...' : `升级到 ${targetLevel} 级`}
                    </button>
                  </div>
                </div>
              ) : null}
              
              <div className="enhancement-items-display">
                <h3>拥有的强化材料</h3>
                {enhancementItems.length > 0 ? (
                  <div className="items-grid">
                    {enhancementItems.map(item => {
                      // 检查是否是可使用的道具
                      const isUsableItem = item.item_name === '红专并进' || item.item_name === '数理基础';
                      const canUse = isUsableItem && item.quantity > 0;
                      
                      // 红专并进的特殊检查（等级是否已满）
                      const isExpPotion = item.item_name === '红专并进';
                      const isMaxLevel = selectedCard.level >= 100;
                      const shouldDisable = isExpPotion && isMaxLevel;
                      
                      return (
                        <div key={item.item_id} className="item-card">
                          <div 
                            className="item-name"
                            style={{ color: getItemRarityColor(item.rarity) }}
                          >
                            {item.item_name}
                          </div>
                          <div className="item-quantity">x{item.quantity}</div>
                          <div className="item-description">{item.item_description}</div>
                          
                          {isUsableItem && (
                            <div className="item-actions">
                              <button
                                className="use-item-button"
                                onClick={() => handleUseItem(item.item_name)}
                                disabled={!canUse || shouldDisable}
                                title={
                                  shouldDisable ? '卡牌已达到最高等级' :
                                  !canUse ? '数量不足' : 
                                  isExpPotion ? '提升1级' : '攻击防御各+5'
                                }
                              >
                                {shouldDisable ? '无法使用' : 
                                 !canUse ? '数量不足' : '使用'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-items">暂无强化材料</div>
                )}
              </div>
            </>
          ) : (
            <div className="max-level-message">
              <h3>🎉 恭喜！</h3>
              <p>该卡牌已达到最高等级 (100级)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cultivate; 