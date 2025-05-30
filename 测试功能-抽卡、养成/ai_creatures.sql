INSERT INTO card_pool_types (pool_type_name, drop_rate_R, drop_rate_SR, drop_rate_SSR, pool_type_description) 
VALUES ('regular', 0.6, 0.3, 0.1, 'Regular card pool with standard drop rates');

SET @regular_pool_type_id = (SELECT pool_type_id FROM card_pool_types WHERE pool_type_name = 'regular');

INSERT INTO card_pools (pool_name, pool_type_id, start_time, end_time, pool_description) 
VALUES ('AI Creatures', @regular_pool_type_id, '2025-05-01 00:00:00', '2025-06-30 23:59:59', 'AI Creatures Pool');

INSERT INTO card_skills (skill_name, skill_description, skill_base_attack, skill_base_defense)
VALUES 
    ('ex_cskill_1', 'Example card skill 1 description', 20, 20),
    ('ex_cskill_2', 'Example card skill 2 description', 30, 30),
    ('ex_cskill_3', 'Example card skill 3 description', 40, 40);

-- 创建10张卡ex_card_1 ~ ex_card_10，其中1~5张为R型，6~8张为SR型，9~10张为SSR型。1、6、9张类型为typeA，其余几张为typeB。基础攻击力和防御力均设为100、100
-- 第4~10张卡有技能，4~6张有技能1，7~8张有技能2，9~10张有技能3
INSERT INTO cards (card_name, rarity, card_type, base_attack, base_defemse, card_description, card_skill)
VALUES
    ('BombardiroCrocodilo', 'R', 'typeA', 100, 100, 'BombardiroCrocodilo', NULL), 
    ('BonecaAmbalam', 'R', 'typeB', 100, 100, 'BonecaAmbalam', NULL), 
    ('BrrBrrPatapim', 'R', 'typeB', 100, 100, 'BrrBrrPatapim', NULL), 
    ('LaVaccaSaturnoSaturnita', 'R', 'typeB', 100, 100, 'LaVaccaSaturnoSaturnita', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('ShinpanzinniBananini', 'R', 'typeB', 100, 100, 'ShinpanzinniBananini', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('CabucinaAssasino', 'SR', 'typeA', 100, 100, 'CabucinaAssasino', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('LiriliLarila', 'SR', 'typeB', 100, 100, 'LiriliLarila', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2')), 
    ('LuLuShiJianDaoLe', 'SR', 'typeB', 100, 100, 'LuLuShiJianDaoLe', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2')), 
    ('TralaleroTralala', 'SSR', 'typeA', 100, 100, 'TralaleroTralala', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3')), 
    ('TungTungTungSahur', 'SSR', 'typeB', 100, 100, 'TungTungTungSahur', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3')); 

-- 将10张卡牌都装入卡池ex_pool
SET @pool_id = (SELECT pool_id FROM card_pools WHERE pool_name = 'AI Creatures');

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'BombardiroCrocodilo';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'BonecaAmbalam';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'BrrBrrPatapim';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'LaVaccaSaturnoSaturnita';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'ShinpanzinniBananini';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'CabucinaAssasino';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'LiriliLarila';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'LuLuShiJianDaoLe';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'TralaleroTralala';

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name = 'TungTungTungSahur';