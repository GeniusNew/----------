import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GameHeader from './GameHeader';
import '../styles/Dungeons.css';

function Dungeons({ user, refreshUserData }) {
  const navigate = useNavigate();
  const [dungeons, setDungeons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // 获取副本列表
  useEffect(() => {
    const fetchDungeons = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/dungeons/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setDungeons(response.data.data);
        } else {
          setError('获取副本列表失败');
        }
      } catch (err) {
        console.error('获取副本列表失败:', err);
        setError('网络错误，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchDungeons();
  }, []);

  // 难度显示文本映射
  const difficultyText = {
    'easy': '简单',
    'normal': '普通', 
    'hard': '困难',
    'expert': '专家'
  };

  // 难度样式类映射
  const difficultyClass = {
    'easy': 'difficulty-easy',
    'normal': 'difficulty-normal',
    'hard': 'difficulty-hard', 
    'expert': 'difficulty-expert'
  };

  // 显示副本详情
  const showDungeonDetail = async (dungeon) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/dungeons/${dungeon.dungeon_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSelectedDungeon(response.data.data);
        setShowDetail(true);
      } else {
        alert('获取副本详情失败');
      }
    } catch (err) {
      console.error('获取副本详情失败:', err);
      alert('网络错误，请稍后再试');
    }
  };

  // 关闭详情界面
  const closeDetail = () => {
    setShowDetail(false);
    setSelectedDungeon(null);
  };

  // 进入副本（暂时只显示提示）
  const enterDungeon = (dungeon) => {
    alert(`即将进入副本：${dungeon.dungeon_name}\n此功能开发中...`);
  };

  // 返回主页
  const goBack = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="dungeons-container">
        <GameHeader user={user} refreshUserData={refreshUserData} />
        <div className="error-message">{error}</div>
        <button onClick={goBack} className="back-button">返回主页</button>
      </div>
    );
  }

  return (
    <div className="dungeons-container">
      <GameHeader user={user} refreshUserData={refreshUserData} />
      
      <div className="dungeons-content">
        <div className="dungeons-header">
          <button onClick={goBack} className="back-button">
            ← 返回主页
          </button>
          <h1>副本选择</h1>
        </div>

        <div className="dungeons-grid">
          {dungeons.map(dungeon => (
            <div key={dungeon.dungeon_id} className="dungeon-card">
              <div className="dungeon-header">
                <h3 className="dungeon-name">{dungeon.dungeon_name}</h3>
                <span className={`difficulty-badge ${difficultyClass[dungeon.difficulty]}`}>
                  {difficultyText[dungeon.difficulty]}
                </span>
              </div>
              
              <div className="dungeon-info">
                <p className="dungeon-description">{dungeon.dungeon_description}</p>
                <div className="dungeon-stats">
                  <span>敌人数量: {dungeon.enemy_count}</span>
                  <span>Boss数量: {dungeon.boss_count}</span>
                </div>
              </div>

              <div className="dungeon-rewards">
                <h4>奖励预览:</h4>
                <div className="rewards-list">
                  {dungeon.rewards.slice(0, 3).map((reward, index) => (
                    <div key={index} className="reward-item">
                      <span className="reward-icon">
                        {reward.reward_type === 'diamonds' ? '💎' : '🪙'}
                      </span>
                      <span className="reward-text">
                        {reward.reward_quantity} ({Math.round(reward.drop_rate * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dungeon-actions">
                <button 
                  onClick={() => showDungeonDetail(dungeon)} 
                  className="detail-button"
                >
                  查看详情
                </button>
                <button 
                  onClick={() => enterDungeon(dungeon)} 
                  className="enter-button"
                >
                  进入副本
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 副本详情弹窗 */}
      {showDetail && selectedDungeon && (
        <div className="modal-overlay">
          <div className="dungeon-detail-modal">
            <div className="modal-header">
              <h2>{selectedDungeon.dungeon_name}</h2>
              <button onClick={closeDetail} className="close-button">×</button>
            </div>
            
            <div className="modal-content">
              <div className="detail-section">
                <h3>副本描述</h3>
                <p>{selectedDungeon.dungeon_description}</p>
              </div>

              <div className="detail-section">
                <h3>敌人信息</h3>
                <div className="enemies-list">
                  {selectedDungeon.enemies.map(enemy => (
                    <div key={enemy.enemy_id} className="enemy-item">
                      <div className="enemy-info">
                        <span className="enemy-name">
                          {enemy.enemy_name} 
                          {enemy.is_boss && <span className="boss-tag">BOSS</span>}
                        </span>
                        <span className="enemy-level">Lv.{enemy.enemy_level}</span>
                      </div>
                      <div className="enemy-stats">
                        <span>攻击: {enemy.enemy_attack}</span>
                        <span>防御: {enemy.enemy_defense}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>奖励列表</h3>
                <div className="rewards-detail">
                  {selectedDungeon.rewards.map((reward, index) => (
                    <div key={index} className="reward-detail-item">
                      <span className="reward-icon">
                        {reward.reward_type === 'diamonds' ? '💎' : '🪙'}
                      </span>
                      <span className="reward-info">
                        {reward.reward_quantity} {reward.reward_type === 'diamonds' ? '钻石' : '金币'}
                        （{Math.round(reward.drop_rate * 100)}% 概率）
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => enterDungeon(selectedDungeon)} className="enter-button">
                进入副本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dungeons; 