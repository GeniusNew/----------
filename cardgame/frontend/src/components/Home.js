import React, { useState, useEffect } from 'react';
import '../styles/Home.css';

function Home({ user, logout }) {
  const defaultBackground = '/images/default-bg.jpg';
  const [backgroundImage, setBackgroundImage] = useState(defaultBackground);
  const [showSettings, setShowSettings] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

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
          <button className="feature-button card-pool">
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
    </div>
  );
}

export default Home; 