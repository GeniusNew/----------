## 项目结构

项目分为两个主要部分：
- **后端**：基于Node.js/Express的API服务器，集成MySQL数据库
- **前端**：React.js应用程序，具有用户认证和游戏功能

## 开始使用

### requirements
- Node.js 
- MySQL服务器
- npm

### 数据库设置

1. 确保MySQL服务器正在运行
2. 创建名为`CardGameDB`的数据库,在.env配置里面更新数据库密码
3. 运行`数据库模式/cardgame_db_pure.sql`中的数据库模式脚本以创建表：

  ```
  cd 数据库模式
  ```

  ```
  mysql -u root -p cardgame_db_pure.sql
  ```

  

### 后端设置

   ```
   cd cardgame/backend
   ```
   ```
   npm.cmd install
   ```
创建一个包含以下变量的`.env`文件：
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=CardGameDB
   JWT_SECRET=your_secret_key_replace_this_in_production
   ```
   ```
   npm.cmd run dev
   ```

### 前端设置

创建一个`.env`文件：

```
HOST=127.0.0.1
```

另外启动一个终端界面，可能需要执行命令
npm.cmd uninstall react-scripts
npm.cmd install react-scripts@4.0.3

   ```
   cd cardgame/frontend
   ```

   ```
   npm.cmd install
   ```


   ```
   npm.cmd start
   ```

打开浏览器并访问`http://localhost:3000`
