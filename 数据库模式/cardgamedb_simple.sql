----------------------------------------用户表----------------------------------------
-- 用户表：存储用户的基本信息
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY, -- 用户唯一标识
    username VARCHAR(50) NOT NULL UNIQUE,   -- 用户名
    password_hash VARCHAR(255) NOT NULL,    -- 密码哈希
    currency INT DEFAULT 0,                 -- 氪金点数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

----------------------------------------资源类型表----------------------------------------
-- 资源类型表：定义合法的资源类型
CREATE TABLE resource_types (
    resource_type_id INT AUTO_INCREMENT PRIMARY KEY, -- 资源类型唯一标识
    resource_name VARCHAR(50) NOT NULL UNIQUE        -- 资源类型名称（如金币、经验等）
);

-- 用户资源表：存储用户的资源信息
CREATE TABLE user_resources (
    resource_id INT AUTO_INCREMENT PRIMARY KEY, -- 资源唯一标识
    user_id INT NOT NULL,                       -- 用户ID
    resource_type_id INT NOT NULL,              -- 资源类型ID
    quantity INT DEFAULT 0,                     -- 资源数量
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);

----------------------------------------卡池表----------------------------------------
-- 卡池表：存储卡池的基本信息
CREATE TABLE card_pools (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,     -- 卡池唯一标识
    pool_name VARCHAR(50) NOT NULL UNIQUE       -- 卡池名称
);

----------------------------------------卡牌表----------------------------------------
-- 卡牌表：存储所有卡牌的基本信息
CREATE TABLE cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY, -- 卡牌唯一标识
    card_name VARCHAR(100) NOT NULL,        -- 卡牌名称
    rarity ENUM('R', 'SR', 'SSR') NOT NULL, -- 卡牌稀有度
    card_type VARCHAR(50) NOT NULL,         -- 卡牌类型（如战士、法师、辅助等）
    image_url VARCHAR(255),                 -- 卡牌图片链接
    base_stats JSON                         -- 卡牌基础属性（JSON存储）
);

-- 卡池-卡牌关联表：存储卡池和卡牌的关联关系
CREATE TABLE card_pool_cards (
    pool_card_id INT AUTO_INCREMENT PRIMARY KEY, -- 关联记录唯一标识
    pool_id INT NOT NULL,                        -- 卡池ID
    card_id INT NOT NULL,                        -- 卡牌ID
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

----------------------------------------用户卡牌表----------------------------------------
-- 用户卡牌表：存储用户拥有的卡牌信息
CREATE TABLE user_cards (
    user_card_id INT AUTO_INCREMENT PRIMARY KEY, -- 用户卡牌唯一标识
    user_id INT NOT NULL,                        -- 用户ID
    card_id INT NOT NULL,                        -- 卡牌ID
    level INT DEFAULT 1,                         -- 卡牌等级
    acquired_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 卡牌获得时间
    current_stats JSON,                          -- 当前属性值（JSON存储，例如 {"attack": 100, "defense": 50}）
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

----------------------------------------战斗队伍----------------------------------------
-- 战斗队伍表：存储用户的战斗队伍信息
CREATE TABLE battle_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY, -- 队伍唯一标识
    user_id INT NOT NULL,                   -- 用户ID
    team_name VARCHAR(50) NOT NULL,         -- 队伍名称
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 战斗队伍槽位表：存储队伍中的卡牌信息
CREATE TABLE team_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY, -- 槽位唯一标识
    team_id INT NOT NULL,                   -- 队伍ID
    user_card_id INT NOT NULL,              -- 用户卡牌ID
    slot_position INT NOT NULL,             -- 槽位位置
    FOREIGN KEY (team_id) REFERENCES battle_teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_card_id) REFERENCES user_cards(user_card_id) ON DELETE CASCADE
);

----------------------------------------战斗副本及敌人、奖励----------------------------------------
-- 副本表：存储副本信息
CREATE TABLE dungeons (
    dungeon_id INT AUTO_INCREMENT PRIMARY KEY, -- 副本唯一标识
    dungeon_name VARCHAR(100) NOT NULL         -- 副本名称
);

-- 副本敌人表：存储副本的敌人信息
CREATE TABLE dungeon_enemies (
    enemy_id INT AUTO_INCREMENT PRIMARY KEY, -- 敌人唯一标识
    dungeon_id INT NOT NULL,                 -- 副本ID
    enemy_data JSON,                         -- 敌人数据（JSON存储）
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

-- 副本奖励表：存储副本的奖励信息
CREATE TABLE dungeon_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY, -- 奖励唯一标识
    dungeon_id INT NOT NULL,                  -- 副本ID
    reward_data JSON,                         -- 奖励数据（JSON存储）
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

-- 战斗记录表：记录用户的战斗历史
CREATE TABLE battle_history (
    battle_id INT AUTO_INCREMENT PRIMARY KEY, -- 战斗记录唯一标识
    user_id INT NOT NULL,                     -- 用户ID
    dungeon_id INT NOT NULL,                  -- 副本ID
    result ENUM('WIN', 'LOSE') NOT NULL,      -- 战斗结果
    battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 战斗时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);