-- 更新卡牌图片URL
USE CardGameDB;

-- 更新所有卡牌的图片URL（如果为空）
UPDATE cards
SET image_url = CONCAT('/images/cards/', card_name, '.png')
WHERE image_url IS NULL OR image_url = '';

-- 示例卡牌图片URL更新
UPDATE cards
SET image_url = CONCAT('/images/cards/', card_name, '.png')
WHERE card_name LIKE 'ex_card_%';

-- 显示更新后的卡牌信息
SELECT card_id, card_name, rarity, image_url
FROM cards
ORDER BY card_id; 