## 项目结构

项目中的`cardgame`文件夹是项目主体，所有必要操作均在该文件夹下完成。

![image-20250712225404843](C:\Users\10421\AppData\Roaming\Typora\typora-user-images\image-20250712225404843.png)

项目分为两个主要部分：

- **后端**：基于Node.js/Express的API服务器，集成MySQL数据库
- **前端**：React.js应用程序，具有用户认证和游戏功能





## 开始使用

### 需求
- Node.js 
- MySQL服务器
- npm



### 数据库设置

1、确保MySQL服务器正在运行

2、在MySQL中创建名为`CardGameDB`的数据库

3、运行`cardgame/数据库模式/cardgame_db_pure.sql`中的数据库模式脚本以创建表

  ```cmd
  mysql -u root -p cardgame_db_pure.sql
  ```

  4、运行`cardgame/数据库模式/test_cards.sql`脚本，插入必要的卡牌、副本、商店等数据

  ```cmd
mysql -u root -p test_cards.sql
  ```



### 后端设置

1、在`cardgame/backend`中打开cmd，输入

   ```cmd
   npm.cmd install
   ```
2、在`cardgame/backend`中创建一个包含以下变量的`.env`文件

   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER='your_mysql_username'
   DB_PASSWORD='your_mysql_password'
   DB_NAME=CardGameDB
   JWT_SECRET=your_secret_key_replace_this_in_production
   ```
3、在终端中运行以下代码连接到数据库

   ```cmd
   npm.cmd run dev
   ```


### 前端设置

1、在`cardgame/frontend`下创建一个`.env`文件

```
HOST=127.0.0.1
```

2、在`cardgame/frontend`下另外启动一个终端界面（不要关闭之前的终端），执行命令

```cmd
npm.cmd uninstall react-scripts
npm.cmd install react-scripts@4.0.3
```

3、输入以下命令，打开浏览器并访问`http://localhost:3000`，进入游戏界面


   ```
   npm.cmd start
   ```
