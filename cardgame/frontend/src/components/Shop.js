import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Shop.css';

function Shop({ user, refreshUserData }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [shopItems, setShopItems] = useState([]);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userData, setUserData] = useState(user || { gems: 0, coins: 0 });
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // 商品分类选项
  const categoryOptions = [
    { value: 'all', label: '全部' },
    { value: 'gold', label: '金币包' },
    { value: 'enhancement', label: '强化石' },
    { value: 'consumable', label: '消耗品' },
    { value: 'material', label: '材料' }
  ];
  
  // 加载用户数据
  useEffect(() => {
    if (user) {
      setUserData(user);
    } else {
      const fetchUserData = async () => {
        try {
          const response = await axios.get('/api/user/resources', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          setUserData(response.data);
        } catch (err) {
          console.error('获取用户数据失败:', err);
        }
      };
      fetchUserData();
    }
  }, [user]);
  
  // 加载商店商品
  useEffect(() => {
    const fetchShopItems = async () => {
      try {
        setIsLoading(true);
        console.log('正在获取商店商品...');
        const response = await axios.get('/api/shop/items', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('商店商品响应:', response.data);
        
        if (response.data.success) {
          setShopItems(response.data.items);
          console.log('获取到商品:', response.data.items.length, '个');
        } else {
          console.error('获取商品失败:', response.data.message);
          setError(response.data.message || '获取商品失败');
        }
      } catch (err) {
        console.error('获取商品错误:', err);
        setError(err.response?.data?.message || '获取商品失败，请稍后再试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShopItems();
  }, []);
  
  const goToHome = () => {
    navigate('/');
  };
  
  // 显示购买确认对话框
  const showPurchaseConfirm = (item) => {
    setSelectedItem(item);
    setPurchaseQuantity(1);
    setShowPurchaseDialog(true);
  };
  
  // 关闭购买对话框
  const closePurchaseDialog = () => {
    setShowPurchaseDialog(false);
    setSelectedItem(null);
    setPurchaseQuantity(1);
  };
  
  // 执行购买
  const confirmPurchase = async () => {
    if (!selectedItem || isPurchasing) return;
    
    setIsPurchasing(true);
    try {
      console.log('发送购买请求:', {
        itemId: selectedItem.id,
        quantity: purchaseQuantity
      });
      
      const response = await axios.post('/api/shop/purchase', {
        itemId: selectedItem.id,
        quantity: purchaseQuantity
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('购买响应:', response.data);

      if (response.data.success) {
        // 更新用户资源
        setUserData(prev => ({
          ...prev,
          gems: response.data.newUserResources.gems,
          coins: response.data.newUserResources.coins
        }));

        // 如果有refreshUserData回调，调用它
        if (refreshUserData) {
          refreshUserData();
        }

        alert(response.data.message);
        closePurchaseDialog();
      } else {
        console.error('购买失败:', response.data);
        alert(response.data.message || '购买失败');
      }
    } catch (err) {
      console.error('购买失败:', err);
      console.error('错误详情:', err.response?.data);
      alert(err.response?.data?.message || '购买失败，请稍后再试');
    } finally {
      setIsPurchasing(false);
    }
  };
  
  // 根据分类过滤商品
  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);
  
  // 计算总价
  const getTotalCost = (item, quantity) => {
    return item.gems_cost * quantity;
  };
  
  // 获取商品的奖励描述
  const getRewardDescription = (item, quantity = 1) => {
    if (item.reward_type === 'coins') {
      return `${item.reward_amount * quantity} 金币`;
    } else if (item.reward_type === 'enhancement_item') {
      return `${item.reward_amount * quantity}个 ${item.reward_item}`;
    }
    return '未知奖励';
  };

  return (
    <div className="shop-container">
      {/* Material图标库CDN */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <div className="hexagon-bg"></div>
      
      <div className="top-bar">
        <button className="back-button" onClick={goToHome}>
          <i className="material-icons">arrow_back</i> 返回
        </button>
        <div className="page-title">商店</div>
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
      
      <div className="shop-content">
        <div className="filter-bar">
          <div className="filter-group">
            <label>分类：</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="item-count">
            {filteredItems.length} 个商品
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-message">
            <i className="material-icons">hourglass_top</i> 加载中...
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="material-icons">error</i> {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-message">
            <i className="material-icons">info</i>
            {selectedCategory === 'all' 
              ? '商店暂时没有商品' 
              : `该分类下暂无商品`}
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`shop-item category-${item.category}`}
              >
                <div className="item-icon">{item.icon}</div>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-description">{item.description}</div>
                  <div className="item-reward">
                    <i className="material-icons">card_giftcard</i> 
                    {getRewardDescription(item)}
                  </div>
                </div>
                <div className="item-footer">
                  <div className="item-price">
                    <span className="price-icon">💎</span>
                    <span className="price-value">{item.gems_cost}</span>
                  </div>
                  <button 
                    className="purchase-button"
                    onClick={() => showPurchaseConfirm(item)}
                    disabled={userData.gems < item.gems_cost}
                  >
                    {userData.gems >= item.gems_cost ? 
                      <><i className="material-icons">shopping_cart</i> 购买</> : 
                      <><i className="material-icons">money_off</i> 钻石不足</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPurchaseDialog && selectedItem && (
        <div className="purchase-dialog-overlay">
          <div className="purchase-dialog">
            <h3>购买确认</h3>
            <div className="purchase-info">
              <div className="item-preview">
                <span className="item-icon-large">{selectedItem.icon}</span>
                <div className="item-details">
                  <div className="item-name">{selectedItem.name}</div>
                  <div className="item-description">{selectedItem.description}</div>
                </div>
              </div>
            </div>
            
            <div className="purchase-controls">
              <label>购买数量：</label>
              <div className="quantity-input">
                <button 
                  onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                  disabled={purchaseQuantity <= 1}
                >
                  <i className="material-icons">remove</i>
                </button>
                <input 
                  type="number" 
                  value={purchaseQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setPurchaseQuantity(Math.max(1, value));
                  }}
                  min="1"
                />
                <button 
                  onClick={() => setPurchaseQuantity(purchaseQuantity + 1)}
                  disabled={userData.gems < getTotalCost(selectedItem, purchaseQuantity + 1)}
                >
                  <i className="material-icons">add</i>
                </button>
              </div>
            </div>
            
            <div className="purchase-summary">
              <div className="summary-row">
                <span>获得奖励：</span>
                <span className="reward-text">
                  <i className="material-icons">card_giftcard</i>
                  {getRewardDescription(selectedItem, purchaseQuantity)}
                </span>
              </div>
              <div className="summary-row">
                <span>总花费：</span>
                <span className="cost-text">
                  💎 {getTotalCost(selectedItem, purchaseQuantity)}
                </span>
              </div>
              <div className="summary-row">
                <span>剩余钻石：</span>
                <span className={userData.gems >= getTotalCost(selectedItem, purchaseQuantity) ? 'sufficient' : 'insufficient'}>
                  💎 {userData.gems - getTotalCost(selectedItem, purchaseQuantity)}
                </span>
              </div>
            </div>
            
            <div className="purchase-actions">
              <button 
                className="cancel-button"
                onClick={closePurchaseDialog}
                disabled={isPurchasing}
              >
                <i className="material-icons">cancel</i> 取消
              </button>
              <button 
                className="confirm-button"
                onClick={confirmPurchase}
                disabled={
                  isPurchasing || 
                  userData.gems < getTotalCost(selectedItem, purchaseQuantity)
                }
              >
                {isPurchasing ? 
                  <><i className="material-icons">hourglass_top</i> 购买中...</> : 
                  <><i className="material-icons">check_circle</i> 确认购买</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shop; 