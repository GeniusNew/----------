import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import CardPool from './components/CardPool';
import Inventory from './components/Inventory';
import Cultivate from './components/Cultivate';
import Shop from './components/Shop';
import Dungeons from './components/Dungeons';
import PlantSelection from './components/PlantSelection';
import Battle from './components/Battle';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 获取用户数据的函数
  const fetchUserData = useCallback(async () => {
    try {
      console.log('获取用户数据...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('未找到token，用户未登录');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/user/resources', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('用户数据获取成功:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化时检查登录状态
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // 登录处理函数
  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className={isAuthenticated ? "app-fullscreen" : "app"}>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login login={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register login={handleLogin} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Home user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/cardpool" 
          element={isAuthenticated ? <CardPool user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/inventory" 
          element={isAuthenticated ? <Inventory user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/cultivate" 
          element={isAuthenticated ? <Cultivate user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/shop" 
          element={isAuthenticated ? <Shop user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/dungeons" 
          element={isAuthenticated ? <Dungeons user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/plant-selection/:dungeonId" 
          element={isAuthenticated ? <PlantSelection user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/battle" 
          element={isAuthenticated ? <Battle user={user} refreshUserData={fetchUserData} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App; 