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