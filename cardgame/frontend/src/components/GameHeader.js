import React from 'react';
import '../styles/GameHeader.css';

function GameHeader({ user, onLogout }) {
  return (
    <div className="game-header">
      <div className="user-profile">
        <div className="avatar">
          {user?.username?.charAt(0) || '?'}
        </div>
        <div className="user-info">
          <div className="username">{user?.username || '玩家'}</div>
          <div className="level">等级: {user?.level || 1}</div>
        </div>
      </div>
      
      <div className="resources">
        <div className="resource">
          <div className="resource-icon">💎</div>
          <div className="resource-value">{user?.gems || 0}</div>
        </div>
        <div className="resource">
          <div className="resource-icon">🪙</div>
          <div className="resource-value">{user?.coins || 0}</div>
        </div>
      </div>
      
      <button className="logout-button" onClick={onLogout}>
        退出登录
      </button>
    </div>
  );
}

export default GameHeader; 