-- 清理脚本：删除所有ex_card测试卡牌及其相关数据
-- 注意：此脚本会永久删除数据，请谨慎使用！

-- 开始事务以确保数据一致性
START TRANSACTION;

-- 显示将要删除的卡牌信息
SELECT '========== 将要删除的卡牌信息 ==========' as info;
SELECT card_id, card_name, rarity, card_type 
FROM cards 
WHERE card_name LIKE 'ex_card%';

-- 1. 删除卡牌技能关联表中的相关记录
-- 删除与ex_card相关的用户卡牌技能关联
DELETE csr FROM card_skill_relation csr
JOIN user_cards uc ON csr.user_card_id = uc.user_card_id
JOIN cards c ON uc.card_id = c.card_id
WHERE c.card_name LIKE 'ex_card%';

SELECT '删除卡牌技能关联记录完成' as status;

-- 2. 删除用户卡牌表中的相关记录
DELETE uc FROM user_cards uc
JOIN cards c ON uc.card_id = c.card_id
WHERE c.card_name LIKE 'ex_card%';

SELECT '删除用户卡牌记录完成' as status;

-- 3. 删除抽卡历史表中的相关记录
DELETE dh FROM draw_history dh
JOIN cards c ON dh.card_id = c.card_id
WHERE c.card_name LIKE 'ex_card%';

SELECT '删除抽卡历史记录完成' as status;

-- 4. 删除卡池卡牌关联表中的相关记录
DELETE pcc FROM card_pool_cards pcc
JOIN cards c ON pcc.card_id = c.card_id
WHERE c.card_name LIKE 'ex_card%';

SELECT '删除卡池卡牌关联记录完成' as status;

-- 5. 最后删除卡牌本身
DELETE FROM cards WHERE card_name LIKE 'ex_card%';

SELECT '删除卡牌记录完成' as status;

-- 显示删除结果
SELECT '========== 删除完成，剩余卡牌 ==========' as info;
SELECT card_id, card_name, rarity, card_type 
FROM cards 
ORDER BY card_id;

-- 显示统计信息
SELECT 
    (SELECT COUNT(*) FROM cards) as remaining_cards,
    (SELECT COUNT(*) FROM user_cards) as remaining_user_cards,
    (SELECT COUNT(*) FROM draw_history) as remaining_draw_history,
    (SELECT COUNT(*) FROM card_pool_cards) as remaining_pool_cards,
    (SELECT COUNT(*) FROM card_skill_relation) as remaining_skill_relations;

-- 提交事务
COMMIT;

SELECT '========== 清理脚本执行完成 ==========' as final_status; 