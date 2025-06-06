import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import axios from 'axios';

function Home() {
  const navigate = useNavigate();
  const defaultBackground = '/images/default-bg.jpg';
  const [backgroundImage, setBackgroundImage] = useState(defaultBackground);
  const [showSettings, setShowSettings] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 充值相关状态
  const [showRecharge, setShowRecharge] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordInputs, setPasswordInputs] = useState(['', '', '', '', '', '']);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  // 充值选项
  const rechargeOptions = [
    { amount: 60, gems: 60, label: '60钻石', price: '￥6', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
    { amount: 300, gems: 330, label: '300+30钻石', price: '￥30', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { amount: 980, gems: 1080, label: '980+100钻石', price: '￥98', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { amount: 1980, gems: 2280, label: '1980+300钻石', price: '￥198', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { amount: 3280, gems: 3880, label: '3280+600钻石', price: '￥328', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { amount: 6480, gems: 7980, label: '6480+1500钻石', price: '￥648', icon: <i className="fas fa-gem"></i>, bgColor: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }
  ];

  // 当组件挂载时，检查用户登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // 获取用户资源信息
        const response = await axios.get('/api/user/resources', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUser(response.data);
      } catch (err) {
        console.error('获取用户信息失败:', err);
        setError('获取用户信息失败，请重新登录');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [navigate]);

  // 从本地存储加载背景图片
  useEffect(() => {
    const savedImage = localStorage.getItem('customBackground');
    if (savedImage) {
      setBackgroundImage(savedImage);
    }
  }, []);

  // 处理自定义背景图片
  const handleBackgroundChange = () => {
    if (imageUrl) {
      setBackgroundImage(imageUrl);
      localStorage.setItem('customBackground', imageUrl);
      setShowSettings(false);
      setImageUrl('');
    }
  };

  // 重置为默认背景
  const resetToDefaultBackground = () => {
    setBackgroundImage(defaultBackground);
    localStorage.removeItem('customBackground');
    setShowSettings(false);
  };

  // 打开文件选择器
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        setBackgroundImage(url);
        localStorage.setItem('customBackground', url);
      };
      reader.readAsDataURL(file);
    }
  };

  // 导航到卡池页面
  const goToCardPool = () => {
    navigate('/cardpool');
  };
  
  // 导航到仓库页面
  const goToInventory = () => {
    navigate('/inventory');
  };
  
  // 导航到商店页面
  const goToShop = () => {
    navigate('/shop');
  };
  
  // 导航到副本页面
  const goToDungeons = () => {
    navigate('/dungeons');
  };
  
  // 打开充值界面
  const openRechargeModal = () => {
    setShowRecharge(true);
  };
  
  // 关闭充值界面
  const closeRechargeModal = () => {
    setShowRecharge(false);
    setShowPasswordModal(false);
    setSelectedAmount(0);
    setSelectedOption(null);
    setPassword('');
    setPasswordError('');
    setPasswordInputs(['', '', '', '', '', '']);
    setActiveInputIndex(0);
  };

  // 选择充值金额
  const selectRechargeAmount = (option) => {
    setSelectedAmount(option.gems);
    setSelectedOption(option);
    setShowPasswordModal(true);
  };

  // 处理密码输入
  const handlePasswordInput = (e, index) => {
    const value = e.target.value;
    if (value === '' || /^\d$/.test(value)) {
      const newInputs = [...passwordInputs];
      newInputs[index] = value;
      setPasswordInputs(newInputs);
      
      // 更新完整密码
      const newPassword = newInputs.join('');
      setPassword(newPassword);
      
      // 自动聚焦下一个输入框
      if (value !== '' && index < 5) {
        setActiveInputIndex(index + 1);
      }
    }
  };

  // 处理密码输入框的键盘事件
  const handlePasswordKeyDown = (e, index) => {
    if (e.key === 'Backspace' && passwordInputs[index] === '' && index > 0) {
      setActiveInputIndex(index - 1);
    }
  };

  // 验证密码并充值
  const verifyPasswordAndRecharge = async () => {
    const correctPassword = '123456';
    
    if (password === correctPassword) {
      try {
        setPasswordError('');
        // 计算新的钻石数量
        const newGems = (user.gems || 0) + selectedAmount;
        
        // 调用后端API更新用户钻石
        const response = await axios.post('/api/user/resources', 
          { gems: newGems },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.data) {
          // 更新本地用户数据
          setUser(prevUser => ({
            ...prevUser,
            gems: newGems
          }));
          
          // 页面提示
          alert(`充值成功！获得${selectedAmount}钻石`);
          
          // 关闭充值界面
          closeRechargeModal();
        } else {
          setPasswordError(response.data.message || '充值失败，请稍后再试');
        }
      } catch (error) {
        console.error('充值出错:', error);
        setPasswordError('网络错误，请稍后再试');
      }
    } else {
      setPasswordError('密码错误，请重试');
      // 清空密码输入
      setPasswordInputs(['', '', '', '', '', '']);
      setActiveInputIndex(0);
    }
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="game-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* 顶部信息栏 */}
      <div className="top-bar">
        <div className="user-info">
          <span className="username">{user?.username || '玩家'}</span>
          <div className="level-container">
            <span className="level">等级: {user?.level || 1}</span>
          </div>
        </div>
        <div className="resources">
          <div className="resource">
            <span className="resource-icon"><i className="fas fa-gem"></i></span>
            <span className="resource-value">{user?.gems || 0}</span>
            <button className="recharge-button" onClick={openRechargeModal}>+</button>
          </div>
          <div className="resource">
            <span className="resource-icon"><i className="fas fa-coins"></i></span>
            <span className="resource-value">{user?.coins || 0}</span>
          </div>
        </div>
        <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
          <i className="fas fa-cog"></i> 设置
        </button>
        <button onClick={handleLogout} className="logout-button">
          退出
        </button>
      </div>
      
      {/* 主内容区 */}
      <div className="main-content">
        {/* 功能按钮区 */}
        <div className="feature-buttons">
          <button className="feature-button card-pool" onClick={goToCardPool}>
            <div className="button-icon"><i className="fas fa-clone"></i></div>
            <div className="button-text">卡池</div>
          </button>
          <button className="feature-button inventory" onClick={goToInventory}>
            <div className="button-icon"><i className="fas fa-box-open"></i></div>
            <div className="button-text">仓库</div>
          </button>
          <button className="feature-button quest" onClick={goToDungeons}>
            <div className="button-icon"><i className="fas fa-trophy"></i></div>
            <div className="button-text">副本</div>
          </button>
          <button className="feature-button shop" onClick={goToShop}>
            <div className="button-icon"><i className="fas fa-shopping-cart"></i></div>
            <div className="button-text">商店</div>
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-panel">
          <h3>设置背景图片</h3>
          <div className="setting-option">
            <label>输入图片URL:</label>
            <input 
              type="text" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="输入图片URL"
            />
            <button onClick={handleBackgroundChange}>应用</button>
          </div>
          <div className="setting-option">
            <label>上传图片文件:</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="setting-option">
            <button onClick={resetToDefaultBackground} className="reset-button">恢复默认背景</button>
          </div>
          <button onClick={() => setShowSettings(false)} className="close-button">关闭</button>
        </div>
      )}

      {/* 充值界面 */}
      {showRecharge && (
        <div className="modal-overlay">
          <div className="anime-recharge-modal">
            <div className="modal-header">
              <h2>钻石充值</h2>
              <button onClick={closeRechargeModal} className="close-button">
                <span className="close-icon">×</span>
              </button>
            </div>
            
            {!showPasswordModal ? (
              <div className="anime-content">
                <div className="gem-illustration">
                  <img src="/images/anime-gems.png" alt="钻石" className="gem-image" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAgMTBMOTAgNTAgNTAgOTAgMTAgNTB6IiBzdHJva2U9IiM4ODhmZmYiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0iIzY2NmZmZiIvPjwvc3ZnPg==';
                    }}
                  />
                </div>
                <div className="recharge-description">
                  <p>购买钻石可以用于抽取稀有卡牌和购买游戏内道具！现在充值还有额外赠送！</p>
                </div>
                <div className="anime-recharge-options">
                  {rechargeOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className="anime-recharge-option" 
                      onClick={() => selectRechargeAmount(option)}
                      style={{ background: option.bgColor }}
                    >
                      <div className="option-icon">{option.icon}</div>
                      <div className="option-content">
                        <div className="option-gems">{option.label}</div>
                        <div className="option-price">{option.price}</div>
                      </div>
                      <div className="option-shine"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="anime-password-container">
                <div className="selected-package">
                  <div className="selected-icon" style={{ background: selectedOption?.bgColor }}>{selectedOption?.icon}</div>
                  <div className="selected-details">
                    <p className="selected-gems">{selectedOption?.label}</p>
                    <p className="selected-price">{selectedOption?.price}</p>
                  </div>
                </div>
                
                <div className="password-title">
                  <p>请输入支付密码确认充值</p>
                </div>
                
                <div className="anime-password-inputs">
                  {passwordInputs.map((value, index) => (
                    <input
                      key={index}
                      type="password"
                      maxLength="1"
                      className="anime-password-digit"
                      value={value}
                      onChange={(e) => handlePasswordInput(e, index)}
                      onKeyDown={(e) => handlePasswordKeyDown(e, index)}
                      ref={el => {
                        if (el && index === activeInputIndex) {
                          el.focus();
                        }
                      }}
                    />
                  ))}
                </div>
                
                {passwordError && <p className="anime-error-message">{passwordError}</p>}
                
                <div className="anime-password-buttons">
                  <button onClick={() => setShowPasswordModal(false)} className="anime-back-button">
                    返回
                  </button>
                  <button 
                    onClick={verifyPasswordAndRecharge} 
                    className="anime-confirm-button"
                    disabled={password.length !== 6}
                  >
                    确认支付
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home; 