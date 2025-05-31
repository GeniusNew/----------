-- 安全插入卡池类型，如果已存在则忽略
INSERT IGNORE INTO card_pool_types (pool_type_name, drop_rate_R, drop_rate_SR, drop_rate_SSR, pool_type_description) 
VALUES ('regular', 0.6, 0.3, 0.1, 'Regular card pool with standard drop rates');

SET @regular_pool_type_id = (SELECT pool_type_id FROM card_pool_types WHERE pool_type_name = 'regular');

-- 安全插入卡池，如果已存在则忽略
INSERT IGNORE INTO card_pools (pool_name, pool_type_id, start_time, end_time, pool_description) 
VALUES ('AI Creatures', @regular_pool_type_id, '2025-05-01 00:00:00', '2025-06-30 23:59:59', 'AI Creatures Pool');

-- 安全插入技能，如果已存在则忽略
INSERT IGNORE INTO card_skills (skill_name, skill_description, skill_base_attack, skill_base_defense)
VALUES 
    ('ex_cskill_1', 'Example card skill 1 description', 20, 20),
    ('ex_cskill_2', 'Example card skill 2 description', 30, 30),
    ('ex_cskill_3', 'Example card skill 3 description', 40, 40);

-- 创建10张卡，使用ON DUPLICATE KEY UPDATE以防卡牌名重复
INSERT INTO cards (card_name, rarity, card_type, base_attack, base_defemse, card_description, card_skill)
VALUES
    ('BombardiroCrocodilo', 'R', 'typeA', 100, 100, 'BombardiroCrocodilo', NULL), 
    ('BonecaAmbalam', 'R', 'typeB', 100, 100, 'BonecaAmbalam', NULL), 
    ('BrrBrrPatapim', 'R', 'typeB', 100, 100, 'BrrBrrPatapim', NULL), 
    ('LaVaccaSaturnoSaturnita', 'R', 'typeB', 100, 100, 'LaVaccaSaturnoSaturnita', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1' LIMIT 1)), 
    ('ShinpanzinniBananini', 'R', 'typeB', 100, 100, 'ShinpanzinniBananini', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1' LIMIT 1)), 
    ('CabucinaAssasino', 'SR', 'typeA', 100, 100, 'CabucinaAssasino', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1' LIMIT 1)), 
    ('LiriliLarila', 'SR', 'typeB', 100, 100, 'LiriliLarila', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2' LIMIT 1)), 
    ('LuLuShiJianDaoLe', 'SR', 'typeB', 100, 100, 'LuLuShiJianDaoLe', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2' LIMIT 1)), 
    ('TralaleroTralala', 'SSR', 'typeA', 100, 100, 'TralaleroTralala', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3' LIMIT 1)), 
    ('TungTungTungSahur', 'SSR', 'typeB', 100, 100, 'TungTungTungSahur', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3' LIMIT 1))
ON DUPLICATE KEY UPDATE 
    rarity = VALUES(rarity),
    card_type = VALUES(card_type),
    base_attack = VALUES(base_attack),
    base_defemse = VALUES(base_defemse),
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