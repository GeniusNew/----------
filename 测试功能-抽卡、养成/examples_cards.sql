-- 创建一个示例用户 example，拥有钻石 10086 个、金币 114514 个
INSERT INTO users (username, password_hash, email, diamonds, coins) 
VALUES ('example', SHA2('123456', 256), 'example@example.com', 10086, 114514);

-- 创建一个示例卡池类型regular，其中R、SR、SSR类卡牌的掉落率分别是0.6、0.38、0.02
INSERT INTO card_pool_types (pool_type_name, drop_rate_R, drop_rate_SR, drop_rate_SSR, pool_type_description) 
VALUES ('regular', 0.6, 0.38, 0.02, 'Regular card pool with standard drop rates');

-- 创建一个卡池ex_pool，为regular类型卡池，时间2025年5月1日~2025年5月31日
SET @regular_pool_type_id = (SELECT pool_type_id FROM card_pool_types WHERE pool_type_name = 'regular');

INSERT INTO card_pools (pool_name, pool_type_id, start_time, end_time, pool_description) 
VALUES ('ex_pool', @regular_pool_type_id, '2025-05-01 00:00:00', '2025-05-31 23:59:59', 'Regular pool for May 2025');

-- 创建三种示例卡牌技能 ex_cskill_1 ~ ex_cskill_3，初始攻防值均为 20
INSERT INTO card_skills (skill_name, skill_description, skill_base_attack, skill_base_defense)
VALUES 
    ('ex_cskill_1', 'Example card skill 1 description', 20, 20),
    ('ex_cskill_2', 'Example card skill 2 description', 20, 20),
    ('ex_cskill_3', 'Example card skill 3 description', 20, 20);

-- 创建10张卡ex_card_1 ~ ex_card_10，其中1~5张为R型，6~8张为SR型，9~10张为SSR型。1、6、9张类型为typeA，其余几张为typeB。基础攻击力和防御力均设为100、100
-- 第4~10张卡有技能，4~6张有技能1，7~8张有技能2，9~10张有技能3
INSERT INTO cards (card_name, rarity, card_type, base_attack, base_defemse, card_description, card_skill)
VALUES
    ('ex_card_1', 'R', 'typeA', 100, 100, 'Example card 1', NULL), 
    ('ex_card_2', 'R', 'typeB', 100, 100, 'Example card 2', NULL), 
    ('ex_card_3', 'R', 'typeB', 100, 100, 'Example card 3', NULL), 
    ('ex_card_4', 'R', 'typeB', 100, 100, 'Example card 4', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('ex_card_5', 'R', 'typeB', 100, 100, 'Example card 5', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('ex_card_6', 'SR', 'typeA', 100, 100, 'Example card 6', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_1')), 
    ('ex_card_7', 'SR', 'typeB', 100, 100, 'Example card 7', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2')), 
    ('ex_card_8', 'SR', 'typeB', 100, 100, 'Example card 8', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_2')), 
    ('ex_card_9', 'SSR', 'typeA', 100, 100, 'Example card 9', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3')), 
    ('ex_card_10', 'SSR', 'typeB', 100, 100, 'Example card 10', (SELECT skill_id FROM card_skills WHERE skill_name = 'ex_cskill_3')); 

-- 将10张卡牌都装入卡池ex_pool
SET @ex_pool_id = (SELECT pool_id FROM card_pools WHERE pool_name = 'ex_pool');

INSERT INTO card_pool_cards (pool_id, card_id)
SELECT @ex_pool_id, card_id
FROM cards
WHERE card_name LIKE 'ex_card_%';

-- 模拟抽卡：假设用户example花5000钻石从卡池ex_pool里进行10连抽，并加入用户卡牌表与抽卡记录表
-- 还要将抽到的有技能的卡牌加入card_skill_relation表，表中的skill_attack与skill_defense属性为技能的初始属性
SET @user_id = (SELECT user_id FROM users WHERE username = 'example');
SET @pool_id = (SELECT pool_id FROM card_pools WHERE pool_name = 'ex_pool');

UPDATE users
SET diamonds = diamonds - 5000
WHERE user_id = @user_id;

SET @drop_rate_R = (SELECT drop_rate_R FROM card_pool_types WHERE pool_type_id = (SELECT pool_type_id FROM card_pools WHERE pool_id = @pool_id));
SET @drop_rate_SR = (SELECT drop_rate_SR FROM card_pool_types WHERE pool_type_id = (SELECT pool_type_id FROM card_pools WHERE pool_id = @pool_id));
SET @drop_rate_SSR = (SELECT drop_rate_SSR FROM card_pool_types WHERE pool_type_id = (SELECT pool_type_id FROM card_pools WHERE pool_id = @pool_id));

INSERT INTO user_cards (user_id, card_id, level, current_attack, current_defense, acquired_time)
SELECT 
    @user_id, 
    (SELECT c.card_id
     FROM card_pool_cards p
     JOIN cards c ON p.card_id = c.card_id
     WHERE p.pool_id = @pool_id
     AND CASE
         WHEN RAND() <= @drop_rate_R THEN c.rarity = 'R'
         WHEN RAND() <= @drop_rate_R + @drop_rate_SR THEN c.rarity = 'SR'
         ELSE c.rarity = 'SSR'
     END
     ORDER BY RAND()
     LIMIT 1),
    1,
    (SELECT base_attack FROM cards WHERE card_id = LAST_INSERT_ID()),
    (SELECT base_defemse FROM cards WHERE card_id = LAST_INSERT_ID()),
    NOW()
FROM (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) AS draw_times;

INSERT INTO draw_history (user_id, card_id, draw_time)
SELECT 
    @user_id, 
    card_id, 
    NOW()
FROM user_cards
WHERE user_id = @user_id
ORDER BY acquired_time DESC
LIMIT 10;

INSERT INTO card_skill_relation (user_card_id, skill_id, skill_attack, skill_defense)
SELECT 
    uc.user_card_id,
    c.card_skill,
    cs.skill_base_attack,
    cs.skill_base_defense
FROM user_cards uc
JOIN cards c ON uc.card_id = c.card_id
JOIN card_skills cs ON c.card_skill = cs.skill_id
WHERE uc.user_id = @user_id AND c.card_skill IS NOT NULL;

-- 卡牌等级提升：用户example花费1000钻石给user_card_id为1的卡牌升5级，并将卡牌当前的攻防属性都提高20点
SET @user_id = (SELECT user_id FROM users WHERE username = 'example');

UPDATE users
SET diamonds = diamonds - 1000
WHERE user_id = @user_id;

UPDATE user_cards
SET level = level + 5,
    current_attack = current_attack + 20,
    current_defense = current_defense + 20
WHERE user_card_id = 1 AND user_id = @user_id;

-- 卡牌技能提升：将用户example仓库里所有含有技能的卡牌的技能额外攻击力与防御力各提升15点，每提升一张卡牌技能消耗10000金币
SET @user_id = (SELECT user_id FROM users WHERE username = 'example');

SET @skill_card_count = (
    SELECT COUNT(*)
    FROM card_skill_relation csr
    JOIN user_cards uc ON csr.user_card_id = uc.user_card_id
    WHERE uc.user_id = @user_id
);

SET @required_coins = @skill_card_count * 10000;

UPDATE users
SET coins = coins - @required_coins
WHERE user_id = @user_id;

UPDATE card_skill_relation csr
JOIN user_cards uc ON csr.user_card_id = uc.user_card_id
SET csr.skill_attack = csr.skill_attack + 15,
    csr.skill_defense = csr.skill_defense + 15
WHERE uc.user_id = @user_id;