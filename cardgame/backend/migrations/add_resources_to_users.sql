-- 检查列是否存在并添加资源相关字段
-- 添加user_level字段
ALTER TABLE users 
ADD COLUMN user_level INT DEFAULT 1;

-- 添加diamonds字段（钻石）
ALTER TABLE users 
ADD COLUMN diamonds INT DEFAULT 1000;

-- 添加coins字段（金币）
ALTER TABLE users 
ADD COLUMN coins INT DEFAULT 500;

-- 更新已有用户的资源
UPDATE users
SET user_level = 1, diamonds = 1000, coins = 500
WHERE user_level IS NULL OR diamonds IS NULL OR coins IS NULL; 