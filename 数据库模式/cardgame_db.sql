----------------------------------------用户表----------------------------------------
-- 用户表：存储用户的基本信息
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY, -- 用户唯一标识
    username VARCHAR(50) NOT NULL UNIQUE,   -- 用户名
    password_hash VARCHAR(255) NOT NULL,    -- 密码哈希
    email VARCHAR(100) NOT NULL UNIQUE,     -- 邮箱
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);

----------------------------------------资源类型表----------------------------------------
-- 资源类型表：定义合法的资源类型
CREATE TABLE resource_types (
    resource_type_id INT AUTO_INCREMENT PRIMARY KEY, -- 资源类型唯一标识
    resource_name VARCHAR(50) NOT NULL UNIQUE,       -- 资源类型名称（如金币、经验等）
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00       -- 每种资源的价格（单位：货币）
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
-- 卡池类型表：存储卡池的类型信息
CREATE TABLE card_pool_types (
    pool_type_id INT AUTO_INCREMENT PRIMARY KEY, -- 卡池类型唯一标识
    pool_type_name VARCHAR(50) NOT NULL UNIQUE,  -- 卡池类型名称（如普通池、限时池）
    drop_rates JSON NOT NULL,                    -- 掉落率（如 {"R": 0.8, "SR": 0.15, "SSR": 0.05}）
    pool_type_description TEXT                  -- 卡池类型描述
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
-- 卡牌表：存储所有卡牌的基本信息
CREATE TABLE cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY, -- 卡牌唯一标识
    card_name VARCHAR(100) NOT NULL,        -- 卡牌名称
    rarity ENUM('R', 'SR', 'SSR') NOT NULL, -- 卡牌稀有度
    card_type VARCHAR(50) NOT NULL,         -- 卡牌类型（如战士、法师、辅助等）
    image_url VARCHAR(255),                 -- 卡牌图片链接
    base_stats JSON,                        -- 卡牌基础属性（JSON存储）
    card_description TEXT                   -- 卡牌描述
);

-- 卡池-卡牌关联表：存储卡池和卡牌的关联关系
CREATE TABLE card_pool_cards (
    pool_card_id INT AUTO_INCREMENT PRIMARY KEY, -- 关联记录唯一标识
    pool_id INT NOT NULL,                        -- 卡池ID
    card_id INT NOT NULL,                        -- 卡牌ID
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
);

-- 卡牌技能表：存储卡牌技能信息
CREATE TABLE card_skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY, -- 技能唯一标识
    skill_name VARCHAR(100) NOT NULL,        -- 技能名称
    skill_description TEXT                   -- 技能描述
);

-- 卡牌技能关联表：存储卡牌和技能的关联关系
CREATE TABLE card_skill_relation (
    relation_id INT AUTO_INCREMENT PRIMARY KEY, -- 关联记录唯一标识
    card_id INT NOT NULL,                        -- 卡牌ID
    skill_id INT NOT NULL,                       -- 技能ID
    skill_values JSON,                           -- 技能相关数值（JSON存储，用于升级调整）
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES card_skills(skill_id) ON DELETE CASCADE
);

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

-- 抽卡记录表：记录用户的抽卡历史
CREATE TABLE draw_history (
    draw_id INT AUTO_INCREMENT PRIMARY KEY, -- 抽卡记录唯一标识
    user_id INT NOT NULL,                   -- 用户ID
    card_id INT NOT NULL,                   -- 抽到的卡牌ID
    pool_id INT NOT NULL,                   -- 卡池ID
    draw_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 抽卡时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES card_pools(pool_id) ON DELETE CASCADE
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
    enemy_stats JSON,                        -- 敌人属性
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
    skill_values JSON,                          -- 技能相关数值（JSON存储，用于调整）
    FOREIGN KEY (enemy_id) REFERENCES dungeon_enemies(enemy_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES enemy_skills(skill_id) ON DELETE CASCADE
);

-- 副本奖励表：存储副本的奖励信息
CREATE TABLE dungeon_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY, -- 奖励唯一标识
    dungeon_id INT NOT NULL,                  -- 副本ID
    reward_type INT NOT NULL,                 -- 奖励类型（关联资源类型表）
    reward_quantity INT NOT NULL,             -- 奖励数量
    drop_rate FLOAT NOT NULL,                 -- 掉落率
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE,
    FOREIGN KEY (reward_type) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);

-- 战斗记录表：记录用户的战斗历史
CREATE TABLE battle_history (
    battle_id INT AUTO_INCREMENT PRIMARY KEY, -- 战斗记录唯一标识
    user_id INT NOT NULL,                     -- 用户ID
    dungeon_id INT NOT NULL,                  -- 副本ID
    team_id INT NOT NULL,                     -- 使用的队伍ID
    result ENUM('WIN', 'LOSE') NOT NULL,      -- 战斗结果
    turns_taken INT NOT NULL,                 -- 战斗回合数
    reward_obtained JSON,                     -- 获得的奖励（JSON存储）
    resurrection_used BOOLEAN DEFAULT FALSE,  -- 是否使用复活
    battle_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 战斗时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons(dungeon_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES battle_teams(team_id) ON DELETE CASCADE
);

----------------------------------------氪金----------------------------------------
CREATE TABLE payment_records (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,       -- 支付记录唯一标识
    user_id INT NOT NULL,                            -- 用户ID
    resource_type_id INT NOT NULL,                  -- 资源类型ID
    amount_paid DECIMAL(10, 2) NOT NULL,            -- 支付金额（单位：货币）
    resource_quantity INT NOT NULL,                 -- 增加的资源数量
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 支付时间
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id) ON DELETE CASCADE
);