CREATE DATABASE `CardGameDB`;
USE CardGameDB;

----------------------------------------用户表----------------------------------------
-- 用户表：存储用户的基本信息
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY, -- 用户唯一标识
    username VARCHAR(50) NOT NULL UNIQUE,   -- 用户名
    password_hash VARCHAR(255) NOT NULL,    -- 密码哈希
    email VARCHAR(100) NOT NULL UNIQUE,     -- 邮箱
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
    diamonds INT DEFAULT 0 NOT NULL CHECK (diamonds >= 0), -- 用户的钻石数量，非负约束
    coins INT DEFAULT 0 NOT NULL CHECK (coins >= 0),       -- 用户的金币数量，非负约束
    user_level INT DEFAULT 1 NOT NULL       -- 用户等级，默认为1
);

----------------------------------------卡池表----------------------------------------
-- 卡池类型表：存储卡池的类型信息
CREATE TABLE card_pool_types (
    pool_type_id INT AUTO_INCREMENT PRIMARY KEY, -- 卡池类型唯一标识
    pool_type_name VARCHAR(50) NOT NULL UNIQUE,  -- 卡池类型名称（如普通池、限时池）
    drop_rate_R FLOAT NOT NULL,                  -- R类卡掉落率
    drop_rate_SR FLOAT NOT NULL,                 -- SR类卡掉落率
    drop_rate_SSR FLOAT NOT NULL,                -- SSR类卡掉落率
    pool_type_description TEXT                   -- 卡池类型描述
);

-- 卡池表：存储卡池的基本信息
CREATE TABLE card_pools (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,     -- 卡池唯一标识
    pool_name VARCHAR(50) NOT NULL UNIQUE,      -- 卡池名称
    pool_type_id INT NOT NULL,                  -- 卡池类型ID
    start_time TIMESTAMP,                       -- 卡池开始时间
    end_time TIMESTAMP,                         -- 卡池结束时间
    pool_description TEXT,                      -- 卡池描述
    FOREIGN KEY (pool_type_id) REFERENCES card_pool_types(pool_type_id) ON DELETE CASCADE
);

----------------------------------------卡牌表----------------------------------------
-- 卡牌技能表：存储卡牌技能信息
CREATE TABLE card_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY, -- 技能唯一标识
    skill_name VARCHAR(100) NOT NULL,        -- 技能名称
    skill_description TEXT,                  -- 技能描述
    skill_base_attack INT NOT NULL DEFAULT 0, -- 技能初始额外攻击力
    skill_base_defense INT NOT NULL DEFAULT 0 -- 技能初始额外防御力
);

-- 卡牌表：存储所有卡牌的基本信息
CREATE TABLE cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY, -- 卡牌唯一标识
    card_name VARCHAR(100) NOT NULL,        -- 卡牌名称
    rarity ENUM('R', 'SR', 'SSR') NOT NULL, -- 卡牌稀有度
    card_type VARCHAR(50) NOT NULL,         -- 卡牌类型（如战士、法师、辅助等）
    image_url VARCHAR(255),                 -- 卡牌图片链接
    base_attack INT NOT NULL,               -- 卡牌基础攻击力属性
    base_defemse INT NOT NULL,              -- 卡牌基础防御力属性
    card_description TEXT,                  -- 卡牌描述
    card_skill INT,                         -- 卡牌拥有的技能ID
    FOREIGN KEY (card_skill) REFERENCES card_skills(skill_id) ON DELETE SET NULL -- 外键关联到技能表
);

-- 卡池-卡牌关联表：存储卡池和卡牌的关联关系
CREATE TABLE card_pool_cards (
    pool_card_id INT AUTO_INCREMENT PRIMARY KEY, -- 关联记录唯一标识
    pool_id INT NOT NULL,                        -- 卡池ID
    card_id INT NOT NULL,                        -- 卡牌ID
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

-- 用户卡牌表：存储用户拥有的卡牌信息
CREATE TABLE user_cards (
    user_card_id INT AUTO_INCREMENT PRIMARY KEY, -- 用户卡牌唯一标识
    user_id INT NOT NULL,                        -- 用户ID
    card_id INT NOT NULL,                        -- 卡牌ID
    level INT DEFAULT 1,                         -- 卡牌等级
    acquired_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 卡牌获得时间
    current_attack INT,                          -- 当前攻击力属性（随卡牌等级提升）
    current_defense INT,                         -- 当前防御力属性（随卡牌等级提升）
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

-- 卡牌技能关联表：存储用户卡牌和技能的关联关系
CREATE TABLE card_skill_relation (
    relation_id INT AUTO_INCREMENT PRIMARY KEY,  -- 关联记录唯一标识
    user_card_id INT NOT NULL,                   -- 用户卡牌ID
    skill_id INT NOT NULL,                       -- 技能ID
    skill_attack INT NOT NULL,                   -- 技能额外攻击力（随技能等级提升）
    skill_defense INT NOT NULL,                  -- 技能额外防御力（随技能等级提升）
    FOREIGN KEY (user_card_id) REFERENCES user_cards(user_card_id) ON DELETE CASCADE, -- 外键关联到用户卡牌表
    FOREIGN KEY (skill_id) REFERENCES card_skills(skill_id) ON DELETE CASCADE         -- 外键关联到技能表
);

-- 抽卡记录表：记录用户的抽卡历史
CREATE TABLE draw_history (
    draw_id INT AUTO_INCREMENT PRIMARY KEY, -- 抽卡记录唯一标识
    user_id INT NOT NULL,                   -- 用户ID
    card_id INT NOT NULL,                   -- 抽到的卡牌ID
    draw_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 抽卡时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

----------------------------------------战斗队伍----------------------------------------
-- 战斗队伍表：存储用户的战斗队伍信息
CREATE TABLE battle_teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY, -- 队伍唯一标识
    user_id INT NOT NULL,                   -- 用户ID
    team_name VARCHAR(50) NOT NULL,         -- 队伍名称
    team_description TEXT,                  -- 队伍描述
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 战斗队伍槽位表：存储队伍中的卡牌信息
CREATE TABLE team_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY, -- 槽位唯一标识
    team_id INT NOT NULL,                   -- 队伍ID
    user_card_id INT NOT NULL,              -- 用户卡牌ID
    slot_position INT NOT NULL,             -- 槽位位置
    FOREIGN KEY (team_id) REFERENCES battle_teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_card_id) REFERENCES user_cards(user_card_id) ON DELETE CASCADE,
    UNIQUE (team_id, slot_position)
);

----------------------------------------副本系统----------------------------------------
-- 副本表：存储副本信息
CREATE TABLE dungeons (
    dungeon_id INT AUTO_INCREMENT PRIMARY KEY, -- 副本唯一标识
    dungeon_name VARCHAR(100) NOT NULL,        -- 副本名称
    difficulty ENUM('easy', 'normal', 'hard', 'expert') NOT NULL, -- 难度
    dungeon_description TEXT                   -- 副本描述
);

-- 副本敌人表：存储副本的敌人信息
CREATE TABLE dungeon_enemies (
    enemy_id INT AUTO_INCREMENT PRIMARY KEY, -- 敌人唯一标识
    dungeon_id INT NOT NULL,                 -- 副本ID
    enemy_name VARCHAR(100) NOT NULL,        -- 敌人名称
    enemy_level INT NOT NULL,                -- 敌人等级
    is_boss BOOLEAN DEFAULT FALSE,           -- 是否为Boss
    enemy_attack INT,                        -- 敌人攻击力基础属性
    enemy_defense INT,                       -- 敌人防御力基础属性
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

-- 敌人技能表：存储敌人技能信息
CREATE TABLE enemy_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY, -- 技能唯一标识
    skill_name VARCHAR(100) NOT NULL,        -- 技能名称
    skill_description TEXT                   -- 技能描述
);

-- 敌人技能关联表：存储敌人和技能的关联关系
CREATE TABLE enemy_skill_relation (
    relation_id INT AUTO_INCREMENT PRIMARY KEY, -- 关联记录唯一标识
    enemy_id INT NOT NULL,                      -- 敌人ID
    skill_id INT NOT NULL,                      -- 技能ID
    skill_attack INT,                           -- 技能额外攻击力
    skill_defense INT,                          -- 技能额外防御力
    FOREIGN KEY (enemy_id) REFERENCES dungeon_enemies(enemy_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES enemy_skills(skill_id) ON DELETE CASCADE
);

-- 副本奖励表：存储副本的奖励信息
CREATE TABLE dungeon_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY, -- 奖励唯一标识
    dungeon_id INT NOT NULL,                  -- 副本ID
    reward_type ENUM('diamonds', 'coins') NOT NULL, -- 奖励类型
    reward_quantity INT NOT NULL,             -- 奖励数量
    drop_rate FLOAT NOT NULL,                 -- 掉落率
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

-- 战斗记录表：记录用户的战斗历史
CREATE TABLE battle_history (
    battle_id INT AUTO_INCREMENT PRIMARY KEY, -- 战斗记录唯一标识
    user_id INT NOT NULL,                     -- 用户ID
    dungeon_id INT NOT NULL,                  -- 副本ID
    result ENUM('WIN', 'LOSE') NOT NULL,      -- 战斗结果
    turns_taken INT NOT NULL,                 -- 战斗回合数
    resurrection_used BOOLEAN DEFAULT FALSE,  -- 是否使用复活
    battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 战斗时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE
);

----------------------------------------氪金----------------------------------------
-- 支付记录表：记录用户的支付信息
CREATE TABLE payment_records (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,       -- 支付记录唯一标识
    user_id INT NOT NULL,                            -- 用户ID
    resource_type ENUM('diamonds', 'coins') NOT NULL, -- 资源类型
    amount_paid DECIMAL(10, 2) NOT NULL,            -- 支付金额（单位：货币）
    resource_quantity INT NOT NULL,                 -- 增加的资源数量
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 支付时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);