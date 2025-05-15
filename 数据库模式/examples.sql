------------------------------抽卡系统示例：10连抽------------------------------
-- 假设卡池名称为 "A"，用户ID为 1
SET @pool_name = 'A';
SET @user_id = 1;

-- 获取卡池ID
SET @pool_id = (
    SELECT pool_id
    FROM card_pools
    WHERE pool_name = @pool_name
);

-- 获取保底次数
SET @guarantee_count = (
    SELECT guarantee_count
    FROM card_pools
    WHERE pool_id = @pool_id
);

-- 检查用户是否已有统计记录
INSERT INTO user_pool_stats (user_id, pool_id, draw_count, since_last_guarantee)
SELECT @user_id, @pool_id, 0, 0
WHERE NOT EXISTS (
    SELECT 1
    FROM user_pool_stats
    WHERE user_id = @user_id AND pool_id = @pool_id
);

-- 获取当前累计抽卡次数和自上次保底后的抽数
SET @current_draw_count = (
    SELECT draw_count
    FROM user_pool_stats
    WHERE user_id = @user_id AND pool_id = @pool_id
);

SET @since_last_guarantee = (
    SELECT since_last_guarantee
    FROM user_pool_stats
    WHERE user_id = @user_id AND pool_id = @pool_id
);

START TRANSACTION;

-- 创建一个临时表用于存储抽取的卡牌
CREATE TEMPORARY TABLE temp_draw_cards (card_id INT);

-- 如果累计抽卡次数达到或超过保底值，强制触发保底
IF @since_last_guarantee + 10 >= @guarantee_count THEN
    -- 从卡池中随机抽取一张 SSR 卡牌作为保底
    SET @guaranteed_card_id = (
        SELECT c.card_id
        FROM cards c
        JOIN card_pool_cards p ON c.card_id = p.card_id
        WHERE p.pool_id = @pool_id AND c.rarity = 'SSR'
        ORDER BY RAND()
        LIMIT 1
    );

    -- 插入保底卡牌到临时表
    INSERT INTO temp_draw_cards (card_id)
    VALUES (@guaranteed_card_id);

    -- 从卡池中随机抽取剩余 9 张卡牌
    INSERT INTO temp_draw_cards (card_id)
    SELECT card_id
    FROM card_pool_cards
    WHERE pool_id = @pool_id AND card_id != @guaranteed_card_id
    ORDER BY RAND()
    LIMIT 9;

    -- 重置自上次保底后的抽数
    SET @new_since_last_guarantee = (@since_last_guarantee + 10) - @guarantee_count;
ELSE
    -- 正常抽取 10 张卡牌
    INSERT INTO temp_draw_cards (card_id)
    SELECT card_id
    FROM card_pool_cards
    WHERE pool_id = @pool_id
    ORDER BY RAND()
    LIMIT 10;

    -- 更新自上次保底后的抽数
    SET @new_since_last_guarantee = @since_last_guarantee + 10;
END IF;

-- 插入抽卡记录
INSERT INTO draw_history (user_id, card_id, pool_id, draw_time)
SELECT @user_id, card_id, @pool_id, NOW()
FROM temp_draw_cards;

-- 将抽到的卡牌添加到用户卡牌表，并初始化 current_stats
INSERT INTO user_cards (user_id, card_id, level, acquired_time, current_stats)
SELECT 
    @user_id, 
    card_id, 
    1, 
    NOW(), 
    (SELECT base_stats FROM cards WHERE cards.card_id = temp_draw_cards.card_id)
FROM temp_draw_cards;

-- 更新用户的累计抽卡次数和自上次保底后的抽数
UPDATE user_pool_stats
SET draw_count = draw_count + 10,
    since_last_guarantee = @new_since_last_guarantee,
    last_draw_time = NOW()
WHERE user_id = @user_id AND pool_id = @pool_id;

-- 删除临时表
DROP TEMPORARY TABLE temp_draw_cards;

COMMIT;

-- 查询用户的抽卡记录
SELECT dh.draw_id, c.card_name, c.rarity, dh.draw_time
FROM draw_history dh
JOIN cards c ON dh.card_id = c.card_id
WHERE dh.user_id = @user_id
ORDER BY dh.draw_time DESC
LIMIT 10;

------------------------------卡牌升级------------------------------
-- 假设用户ID为 1，用户卡牌ID为 101（在 user_cards 表中），需要消耗的资源类型为 "经验值"
SET @user_id = 1;
SET @user_card_id = 101;
SET @resource_type = '经验值';

-- 设置升级所需的资源数量
SET @required_resource = 100; -- 每次升级所需的经验值

-- 检查用户是否有足够的资源
SET @current_resource = (
    SELECT quantity
    FROM user_resources ur
    JOIN resource_types rt ON ur.resource_type_id = rt.resource_type_id
    WHERE ur.user_id = @user_id AND rt.resource_name = @resource_type
);

-- 如果资源不足，抛出错误
IF @current_resource < @required_resource THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = '资源不足，无法升级卡牌';
END IF;

START TRANSACTION;

-- 1. 消耗用户资源
UPDATE user_resources ur
JOIN resource_types rt ON ur.resource_type_id = rt.resource_type_id
SET ur.quantity = ur.quantity - @required_resource
WHERE ur.user_id = @user_id AND rt.resource_name = @resource_type;

-- 2. 升级卡牌等级
UPDATE user_cards
SET level = level + 1
WHERE user_card_id = @user_card_id;

-- 3. 提升卡牌基础属性
-- 假设每次升级增加基础属性的某些值（例如攻击力 +10，防御力 +5）
SET @current_stats = (
    SELECT current_stats
    FROM user_cards
    WHERE user_card_id = @user_card_id
);

-- 更新基础属性（假设 JSON 格式存储属性）
SET @updated_stats = JSON_SET(
    @current_stats,
    '$.attack', JSON_EXTRACT(@current_stats, '$.attack') + 10,
    '$.defense', JSON_EXTRACT(@current_stats, '$.defense') + 5
);

-- 更新卡牌的当前属性值
UPDATE user_cards
SET current_stats = @updated_stats
WHERE user_card_id = @user_card_id;

-- 4. 检查是否达到解锁技能的等级
SET @current_level = (
    SELECT level
    FROM user_cards
    WHERE user_card_id = @user_card_id
);

-- 获取卡牌的技能信息
SET @card_id = (
    SELECT card_id
    FROM user_cards
    WHERE user_card_id = @user_card_id
);

-- 查询需要解锁的技能
INSERT INTO user_card_skills (user_card_id, skill_name, unlock_level)
SELECT @user_card_id, skill_name, unlock_level
FROM (
    SELECT skill_name, unlock_level
    FROM user_card_skills
    WHERE unlock_level <= @current_level AND user_card_id = @user_card_id
) AS skills_to_unlock
ON DUPLICATE KEY UPDATE skill_name = skill_name;

COMMIT;

-- 查询卡牌的最新信息
SELECT uc.user_card_id, uc.level, uc.current_stats, ucs.skill_name, ucs.unlock_level
FROM user_cards uc
LEFT JOIN user_card_skills ucs ON uc.user_card_id = ucs.user_card_id
WHERE uc.user_card_id = @user_card_id;