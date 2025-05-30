import React from 'react';
import { useNavigate } from 'react-router-dom';

function Shop() {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>商店功能开发中</h1>
      <p>商店功能将在未来版本推出，敬请期待！</p>
      <button 
        onClick={goToHome}
        style={{
          padding: '10px 20px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        返回首页
      </button>
    </div>
  );
}

export default Shop; 