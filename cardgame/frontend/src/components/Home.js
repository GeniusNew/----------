import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home({ user, logout }) {
  const navigate = useNavigate();
  const defaultBackground = '/images/default-bg.jpg';
  const [backgroundImage, setBackgroundImage] = useState(defaultBackground);
  const [showSettings, setShowSettings] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  // 充值相关状态
  const [showRecharge, setShowRecharge] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 充值选项
  const rechargeOptions = [
    { amount: 60, gems: 60, label: '60钻石', price: '￥6' },
    { amount: 300, gems: 330, label: '300+30钻石', price: '￥30' },
    { amount: 980, gems: 1080, label: '980+100钻石', price: '￥98' },
    { amount: 1980, gems: 2280, label: '1980+300钻石', price: '￥198' },
    { amount: 3280, gems: 3880, label: '3280+600钻石', price: '￥328' },
    { amount: 6480, gems: 7980, label: '6480+1500钻石', price: '￥648' }
  ];

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

  // 打开充值界面
  const openRechargeModal = () => {
    setShowRecharge(true);
  };

  // 关闭充值界面
  const closeRechargeModal = () => {
    setShowRecharge(false);
    setShowPasswordModal(false);
    setSelectedAmount(0);
    setPassword('');
    setPasswordError('');
  };

  // 选择充值金额
  const selectRechargeAmount = (gems) => {
    setSelectedAmount(gems);
    setShowPasswordModal(true);
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
        const response = await fetch('http://localhost:5000/api/user/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ gems: newGems })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // 更新本地存储的用户数据
          const updatedUser = { 
            ...user, 
            gems: newGems 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // 页面提示
          alert(`充值成功！获得${selectedAmount}钻石`);
          
          // 关闭充值界面
          closeRechargeModal();
          
          // 刷新页面以显示更新后的钻石数量
          window.location.reload();
        } else {
          setPasswordError(data.message || '充值失败，请稍后再试');
        }
      } catch (error) {
        console.error('充值出错:', error);
        setPasswordError('网络错误，请稍后再试');
      }
    } else {
      setPasswordError('密码错误，请重试');
    }
  };

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
            <span className="resource-icon">💎</span>
            <span className="resource-value">{user?.gems || 0}</span>
            <button className="recharge-button" onClick={openRechargeModal}>+</button>
          </div>
          <div className="resource">
            <span className="resource-icon">🪙</span>
            <span className="resource-value">{user?.coins || 0}</span>
          </div>
        </div>
        <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
          ⚙️ 设置
        </button>
        <button onClick={logout} className="logout-button">
          退出
        </button>
      </div>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 功能按钮区 */}
        <div className="feature-buttons">
          <button className="feature-button card-pool" onClick={goToCardPool}>
            <div className="button-icon">🎴</div>
            <div className="button-text">卡池</div>
          </button>
          <button className="feature-button inventory">
            <div className="button-icon">📦</div>
            <div className="button-text">仓库</div>
          </button>
          <button className="feature-button quest">
            <div className="button-icon">🏆</div>
            <div className="button-text">副本</div>
          </button>
          <button className="feature-button shop">
            <div className="button-icon">🛒</div>
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
          <div className="recharge-modal">
            <h2>钻石充值</h2>
            {!showPasswordModal ? (
              <div className="recharge-options">
                {rechargeOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className="recharge-option" 
                    onClick={() => selectRechargeAmount(option.gems)}
                  >
                    <div className="option-gems">{option.label}</div>
                    <div className="option-price">{option.price}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="password-container">
                <p>请输入支付密码确认充值 {selectedAmount} 钻石</p>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="请输入支付密码"
                  className="password-input"
                  maxLength={6}
                />
                {passwordError && <p className="error-message">{passwordError}</p>}
                <div className="password-buttons">
                  <button onClick={verifyPasswordAndRecharge} className="confirm-button">确认支付</button>
                  <button onClick={() => setShowPasswordModal(false)} className="back-button">返回</button>
                </div>
              </div>
            )}
            <button onClick={closeRechargeModal} className="close-button">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home; 