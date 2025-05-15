# 卡牌游戏网页应用

这是一个基于网页的卡牌游戏应用，具有用户注册、登录和FGO风格的游戏界面。

## 项目结构

项目分为两个主要部分：
- **后端**：基于Node.js/Express的API服务器，集成MySQL数据库
- **前端**：React.js应用程序，具有用户认证和游戏功能

## 开始使用

### 前提条件

- Node.js (推荐v14+)
- MySQL服务器
- npm或yarn

### 数据库设置

1. 确保MySQL服务器正在运行
2. 创建名为`CardGameDB`的数据库（或在backend/.env中更新数据库名称）
3. 运行`数据库模式/cardgamedb.sql`中的数据库模式脚本以创建表

### 后端设置

1. 导航到后端目录：
   ```
   cd cardgame/backend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 创建一个包含以下变量的`.env`文件：
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=CardGameDB
   JWT_SECRET=your_secret_key_replace_this_in_production
   ```

4. 启动服务器：
   ```
   npm run dev
   ```

### 前端设置

1. 导航到前端目录：
   ```
   cd cardgame/frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动React开发服务器：
   ```
   npm start
   ```

4. 打开浏览器并访问`http://localhost:3000`

## 功能特性

### 用户系统
- 用户注册和登录
- 基于JWT的身份验证
- 全中文界面

### 游戏主界面
- FGO风格的主界面布局
- 可自定义背景图片（URL或本地上传）
- 用户信息和资源显示
- 主要功能按钮（卡池、仓库、副本、商店）

### 响应式设计
- 适配桌面和移动设备
- 流畅的动画效果
- 直观的用户界面

## 技术栈

- **后端**：Node.js, Express, MySQL
- **前端**：React, React Router, Axios, 现代CSS
- **认证**：JWT (JSON Web Tokens)
- **存储**：LocalStorage用于用户设置

## 文档

- [GitHub 上传指南](./GITHUB_GUIDE.md) - 如何将项目上传到GitHub的说明
- [更新日志](./CHANGELOG.md) - 项目版本更新历史

## 后续开发计划

- 实现卡池抽卡功能
- 添加卡牌收集和管理系统
- 开发副本挑战模式
- 实现商店和资源系统 