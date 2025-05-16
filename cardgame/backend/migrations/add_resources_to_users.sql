-- 检查列是否存在并添加资源相关字段
-- 添加level字段
ALTER TABLE users 
ADD COLUMN level INT DEFAULT 1;

-- 添加gems字段
ALTER TABLE users 
ADD COLUMN gems INT DEFAULT 1000;

-- 添加coins字段
ALTER TABLE users 
ADD COLUMN coins INT DEFAULT 500;

-- 更新已有用户的资源
UPDATE users
SET level = 1, gems = 1000, coins = 500
WHERE level IS NULL OR gems IS NULL OR coins IS NULL; 