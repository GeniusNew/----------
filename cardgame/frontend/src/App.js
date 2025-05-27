import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import CardPool from './components/CardPool';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从服务器获取最新的用户资源信息
  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('/api/user/resources', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // 更新本地用户数据
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        const updatedUser = { 
          ...storedUser, 
          gems: response.data.gems,
          coins: response.data.coins,
          level: response.data.level
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('获取用户资源信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // You could also fetch user data here with the token
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      // 获取最新的用户资源信息
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    
    // 登录后获取最新的用户资源信息
    await fetchUserData(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUserResources = (updatedResources) => {
    if (user && updatedResources) {
      const updatedUser = { ...user, ...updatedResources };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className={isAuthenticated ? "app-fullscreen" : "app"}>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Home user={user} logout={logout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <Login login={login} />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/" /> : <Register login={login} />} 
        />
        <Route 
          path="/cardpool" 
          element={isAuthenticated ? 
            <CardPool user={user} updateUserResources={updateUserResources} /> : 
            <Navigate to="/login" />
          } 
        />
      </Routes>
    </div>
  );
}

export default App; 