-- 更新卡池概率配置
-- 新概率：N 59%, R 30%, SR 10%, SSR 1%

UPDATE card_pool_types 
SET 
    drop_rate_N = 0.59,
    drop_rate_R = 0.30,
    drop_rate_SR = 0.10,
    drop_rate_SSR = 0.01
WHERE pool_type_name = 'regular';

-- 如果不存在regular卡池类型，则创建一个
INSERT IGNORE INTO card_pool_types (
    pool_type_name, 
    drop_rate_N, 
    drop_rate_R, 
    drop_rate_SR, 
    drop_rate_SSR, 
    pool_type_description
) VALUES (
    'regular', 
    0.59, 
    0.30, 
    0.10, 
    0.01, 
    'Updated regular card pool with N 59%, R 30%, SR 10%, SSR 1%'
);

-- 查看更新结果
SELECT pool_type_name, drop_rate_N, drop_rate_R, drop_rate_SR, drop_rate_SSR 
FROM card_pool_types 
WHERE pool_type_name = 'regular'; 