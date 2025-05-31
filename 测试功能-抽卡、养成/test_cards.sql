-- 安全插入卡池类型，如果已存在则忽略
INSERT IGNORE INTO card_pool_types (pool_type_name, drop_rate_N, drop_rate_R, drop_rate_SR, drop_rate_SSR, pool_type_description) 
VALUES ('regular', 0.4, 0.3, 0.2, 0.1, 'Regular card pool with standard drop rates');

SET @regular_pool_type_id = (SELECT pool_type_id FROM card_pool_types WHERE pool_type_name = 'regular');

-- 安全插入卡池，如果已存在则忽略
INSERT IGNORE INTO card_pools (pool_name, pool_type_id, start_time, end_time, pool_description) 
VALUES ('AI Creatures', @regular_pool_type_id, '2025-05-01 00:00:00', '2025-06-30 23:59:59', 'AI Creatures Pool');

-- 安全插入技能，如果已存在则忽略
INSERT IGNORE INTO card_skills (skill_name, skill_description, skill_base_attack, skill_base_defense, skill_base_strike, skill_base_recovery, skill_base_block)
VALUES 
    ('攻击强化', '直接增强卡牌攻击值', 50, 0, 0, 0, 0),
    ('防守强化', '直接增强卡牌血量', 0, 50, 0, 0, 0),
    ('致命一击', '卡牌可主动释放高攻击力大招', 0, 0, 1000, 0, 0),
    ('生命恢复', '卡牌可为队友恢复一定血量', 0, 0, 0, 800, 0),
    ('伤害免疫', '卡牌可免疫一定攻击', 0, 0, 0, 0, 500);

SET @skill_attack_id = (SELECT skill_id FROM card_skills WHERE skill_name = '攻击强化');
SET @skill_defense_id = (SELECT skill_id FROM card_skills WHERE skill_name = '防守强化');
SET @skill_strike_id = (SELECT skill_id FROM card_skills WHERE skill_name = '致命一击');
SET @skill_recovery_id = (SELECT skill_id FROM card_skills WHERE skill_name = '生命恢复');
SET @skill_block_id = (SELECT skill_id FROM card_skills WHERE skill_name = '伤害免疫');

-- 创建10张卡，使用ON DUPLICATE KEY UPDATE以防卡牌名重复
INSERT INTO cards (card_name, rarity, card_type, base_attack, base_defense, card_description, card_skill)
VALUES
    ('BombardiroCrocodilo', 'R', 'AI Creatures', 500, 5000, 'BombardiroCrocodilo', @skill_attack_id), 
    ('BonecaAmbalam', 'N', 'AI Creatures', 200, 2500, 'BonecaAmbalam', NULL), 
    ('BrrBrrPatapim', 'N', 'AI Creatures', 150, 3000, 'BrrBrrPatapim', NULL), 
    ('LaVaccaSaturnoSaturnita', 'N', 'AI Creatures', 200, 2500, 'LaVaccaSaturnoSaturnita', NULL), 
    ('ShinpanzinniBananini', 'R', 'AI Creatures', 400, 4000, 'ShinpanzinniBananini', @skill_recovery_id), 
    ('CabucinaAssasino', 'R', 'AI Creatures', 600, 4000, 'CabucinaAssasino', @skill_defense_id), 
    ('LiriliLarila', 'SR', 'AI Creatures', 600, 6000, 'LiriliLarila', @skill_block_id), 
    ('LuLuShiJianDaoLe', 'SR', 'AI Creatures', 800, 5000, 'LuLuShiJianDaoLe', @skill_attack_id), 
    ('TralaleroTralala', 'R', 'AI Creatures', 400, 4500, 'TralaleroTralala', @skill_block_id), 
    ('TungTungTungSahur', 'SSR', 'AI Creatures', 700, 5500, 'TungTungTungSahur', @skill_strike_id)
ON DUPLICATE KEY UPDATE 
    rarity = VALUES(rarity),
    card_type = VALUES(card_type),
    base_attack = VALUES(base_attack),
    base_defense = VALUES(base_defense),
    card_description = VALUES(card_description),
    card_skill = VALUES(card_skill);

-- 将10张卡牌都装入卡池AI Creatures，修复变量名错误
SET @pool_id = (SELECT pool_id FROM card_pools WHERE pool_name = 'AI Creatures');

-- 安全插入卡池卡牌关联，避免重复
INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'BombardiroCrocodilo';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'BonecaAmbalam';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'BrrBrrPatapim';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'LaVaccaSaturnoSaturnita';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'ShinpanzinniBananini';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'CabucinaAssasino';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'LiriliLarila';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'LuLuShiJianDaoLe';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'TralaleroTralala';

INSERT IGNORE INTO card_pool_cards (pool_id, card_id)
SELECT @pool_id, card_id
FROM cards
WHERE card_name = 'TungTungTungSahur';

-- 创建特殊物品表
CREATE TABLE IF NOT EXISTS enhancement_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(50) NOT NULL,
    item_description TEXT,
    item_type ENUM('enhancement_stone', 'material', 'consumable') DEFAULT 'enhancement_stone',
    required_level INT DEFAULT 0,
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户物品库存表
CREATE TABLE IF NOT EXISTS user_enhancement_items (
    user_item_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 0,
    acquired_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES enhancement_items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_item (user_id, item_id)
);

-- 插入强化石数据
INSERT INTO enhancement_items (item_name, item_description, item_type, required_level, rarity) VALUES
('强化石I', '用于提升卡牌等级至20级的基础强化石', 'enhancement_stone', 20, 'common'),
('强化石II', '用于提升卡牌等级至40级的中级强化石', 'enhancement_stone', 40, 'rare'),
('强化石III', '用于提升卡牌等级至60级的高级强化石', 'enhancement_stone', 60, 'rare'),
('强化石IV', '用于提升卡牌等级至80级的超级强化石', 'enhancement_stone', 80, 'epic'),
('强化石V', '用于提升卡牌等级至100级的传说强化石', 'enhancement_stone', 100, 'legendary'),
('经验药水', '直接为卡牌提供经验值的神奇药水', 'consumable', 1, 'common'),
('属性精华', '永久提升卡牌基础属性的珍贵材料', 'material', 1, 'epic');

-- 为所有现有用户添加初始强化石（用于测试）
INSERT INTO user_enhancement_items (user_id, item_id, quantity)
SELECT u.user_id, ei.item_id, 
    CASE 
        WHEN ei.item_name = '强化石I' THEN 10
        WHEN ei.item_name = '强化石II' THEN 5
        WHEN ei.item_name = '强化石III' THEN 3
        WHEN ei.item_name = '强化石IV' THEN 2
        WHEN ei.item_name = '强化石V' THEN 1
        WHEN ei.item_name = '经验药水' THEN 20
        WHEN ei.item_name = '属性精华' THEN 5
        ELSE 0
    END as quantity
FROM users u
CROSS JOIN enhancement_items ei
WHERE ei.item_type = 'enhancement_stone' OR ei.item_name IN ('经验药水', '属性精华')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity); 

-- 将强化石重命名为学习教材
-- 强化石I -> 大物实验教程
-- 强化石II -> 量子物理教材
-- 强化石III -> 数学分析练习册
-- 强化石IV -> 线性代数试卷
-- 强化石V -> 毕业论文代写
-- 经验药水 -> 红专并进
-- 属性精华 -> 数理基础

-- 更新enhancement_items表中的强化石名称和描述
UPDATE enhancement_items 
SET 
    item_name = '大物实验教程',
    item_description = '用于提升卡牌等级至20级的大学物理实验教程，包含详细的实验步骤和理论基础'
WHERE item_name = '强化石I';

UPDATE enhancement_items 
SET 
    item_name = '量子物理教材',
    item_description = '用于提升卡牌等级至40级的量子物理学教材，深入探讨量子力学原理'
WHERE item_name = '强化石II';

UPDATE enhancement_items 
SET 
    item_name = '数学分析练习册',
    item_description = '用于提升卡牌等级至60级的数学分析练习册，包含大量习题和解答'
WHERE item_name = '强化石III';

UPDATE enhancement_items 
SET 
    item_name = '线性代数试卷',
    item_description = '用于提升卡牌等级至80级的线性代数试卷，考验线性代数掌握程度'
WHERE item_name = '强化石IV';

UPDATE enhancement_items 
SET 
    item_name = '毕业论文代写',
    item_description = '用于提升卡牌等级至100级的终极学业代写服务，助你顺利毕业'
WHERE item_name = '强化石V';

-- 更新消耗品名称和描述
UPDATE enhancement_items 
SET 
    item_name = '红专并进',
    item_description = '体现红专并进精神的神奇药水，可直接提升卡牌等级1级'
WHERE item_name = '经验药水';

UPDATE enhancement_items 
SET 
    item_name = '数理基础',
    item_description = '加强数理基础的珍贵材料，可永久提升卡牌攻击力和防御力各5点'
WHERE item_name = '属性精华';

-- 验证更新结果
SELECT item_id, item_name, item_description, required_level, rarity 
FROM enhancement_items 
WHERE item_name IN ('大物实验教程', '量子物理教材', '数学分析练习册', '线性代数试卷', '毕业论文代写', '红专并进', '数理基础')
ORDER BY required_level; 