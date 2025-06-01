-- 修复副本系统数据脚本
USE CardGameDB;

-- 检查是否已有副本数据，如果有则清理
DELETE FROM battle_history WHERE dungeon_id IN (SELECT dungeon_id FROM dungeons);
DELETE FROM team_slots WHERE team_id IN (SELECT team_id FROM battle_teams);
DELETE FROM battle_teams;
DELETE FROM dungeon_rewards;
DELETE FROM enemy_skill_relation;
DELETE FROM dungeon_enemies;
DELETE FROM enemy_skills;
DELETE FROM dungeons;

-- 重新插入副本数据
INSERT INTO dungeons (dungeon_name, difficulty, dungeon_description) VALUES
('幽暗森林', 'easy', '适合新手冒险者的森林副本，有着温和的野兽和丰富的资源'),
('石窟洞穴', 'normal', '隐藏在山脉中的洞穴，栖息着危险的魔兽'),
('古老遗迹', 'hard', '远古文明的遗迹，充满了神秘的魔法生物'),
('龙族巢穴', 'expert', '传说中的龙族栖息地，只有最强大的勇士才能挑战');

-- 插入敌人技能
INSERT INTO enemy_skills (skill_name, skill_description) VALUES
('普通攻击', '基础的物理攻击'),
('连续攻击', '连续进行两次攻击，每次造成基础伤害的80%'),
('防御姿态', '提升自身防御力50%，持续3回合'),
('治疗术', '恢复自身20%的生命值'),
('狂暴', '提升攻击力100%，但降低防御力50%，持续2回合'),
('火焰吐息', '对所有敌人造成火焰伤害'),
('冰冻术', '使目标无法行动1回合'),
('雷电术', '强力的雷电攻击，造成高额伤害');

-- 插入副本敌人
-- 获取刚插入的副本ID并插入敌人
SET @dungeon_forest = (SELECT dungeon_id FROM dungeons WHERE dungeon_name = '幽暗森林');
SET @dungeon_cave = (SELECT dungeon_id FROM dungeons WHERE dungeon_name = '石窟洞穴');
SET @dungeon_ruin = (SELECT dungeon_id FROM dungeons WHERE dungeon_name = '古老遗迹');
SET @dungeon_dragon = (SELECT dungeon_id FROM dungeons WHERE dungeon_name = '龙族巢穴');

-- 幽暗森林敌人
INSERT INTO dungeon_enemies (dungeon_id, enemy_name, enemy_level, is_boss, enemy_attack, enemy_defense, image_url) VALUES
(@dungeon_forest, '森林狼', 5, FALSE, 25, 15, '/images/enemies/forest_wolf.png'),
(@dungeon_forest, '树精', 6, FALSE, 20, 25, '/images/enemies/tree_spirit.png'),
(@dungeon_forest, '森林守护者', 8, TRUE, 40, 30, '/images/enemies/forest_guardian.png');

-- 石窟洞穴敌人
INSERT INTO dungeon_enemies (dungeon_id, enemy_name, enemy_level, is_boss, enemy_attack, enemy_defense, image_url) VALUES
(@dungeon_cave, '石怪', 10, FALSE, 35, 40, '/images/enemies/stone_golem.png'),
(@dungeon_cave, '蝙蝠群', 8, FALSE, 30, 10, '/images/enemies/bat_swarm.png'),
(@dungeon_cave, '洞穴巨蜘蛛', 12, TRUE, 50, 35, '/images/enemies/cave_spider.png');

-- 古老遗迹敌人
INSERT INTO dungeon_enemies (dungeon_id, enemy_name, enemy_level, is_boss, enemy_attack, enemy_defense, image_url) VALUES
(@dungeon_ruin, '古代战士', 15, FALSE, 60, 50, '/images/enemies/ancient_warrior.png'),
(@dungeon_ruin, '魔法傀儡', 14, FALSE, 55, 60, '/images/enemies/magic_puppet.png'),
(@dungeon_ruin, '遗迹守护神', 18, TRUE, 80, 70, '/images/enemies/ruin_guardian.png');

-- 龙族巢穴敌人
INSERT INTO dungeon_enemies (dungeon_id, enemy_name, enemy_level, is_boss, enemy_attack, enemy_defense, image_url) VALUES
(@dungeon_dragon, '幼龙', 20, FALSE, 70, 60, '/images/enemies/young_dragon.png'),
(@dungeon_dragon, '龙族守卫', 22, FALSE, 75, 80, '/images/enemies/dragon_guard.png'),
(@dungeon_dragon, '古龙', 25, TRUE, 120, 100, '/images/enemies/ancient_dragon.png');

-- 获取技能ID变量
SET @skill_normal_attack = (SELECT skill_id FROM enemy_skills WHERE skill_name = '普通攻击');
SET @skill_multi_attack = (SELECT skill_id FROM enemy_skills WHERE skill_name = '连续攻击');
SET @skill_defense = (SELECT skill_id FROM enemy_skills WHERE skill_name = '防御姿态');
SET @skill_heal = (SELECT skill_id FROM enemy_skills WHERE skill_name = '治疗术');
SET @skill_berserk = (SELECT skill_id FROM enemy_skills WHERE skill_name = '狂暴');
SET @skill_fire = (SELECT skill_id FROM enemy_skills WHERE skill_name = '火焰吐息');
SET @skill_freeze = (SELECT skill_id FROM enemy_skills WHERE skill_name = '冰冻术');
SET @skill_thunder = (SELECT skill_id FROM enemy_skills WHERE skill_name = '雷电术');

-- 获取敌人ID并为其分配技能
SET @enemy_wolf = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '森林狼');
SET @enemy_spirit = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '树精');
SET @enemy_guardian = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '森林守护者');
SET @enemy_golem = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '石怪');
SET @enemy_bats = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '蝙蝠群');
SET @enemy_spider = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '洞穴巨蜘蛛');
SET @enemy_warrior = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '古代战士');
SET @enemy_puppet = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '魔法傀儡');
SET @enemy_ruin_god = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '遗迹守护神');
SET @enemy_young_dragon = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '幼龙');
SET @enemy_dragon_guard = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '龙族守卫');
SET @enemy_ancient_dragon = (SELECT enemy_id FROM dungeon_enemies WHERE enemy_name = '古龙');

-- 为敌人分配技能（使用动态获取的技能ID）
INSERT INTO enemy_skill_relation (enemy_id, skill_id, skill_attack, skill_defense) VALUES
-- 森林敌人技能
(@enemy_wolf, @skill_normal_attack, 25, 0),  -- 森林狼 - 普通攻击
(@enemy_spirit, @skill_normal_attack, 20, 0),  -- 树精 - 普通攻击
(@enemy_spirit, @skill_defense, 0, 25),  -- 树精 - 防御姿态
(@enemy_guardian, @skill_normal_attack, 40, 0),  -- 森林守护者 - 普通攻击
(@enemy_guardian, @skill_multi_attack, 32, 0),  -- 森林守护者 - 连续攻击
(@enemy_guardian, @skill_heal, 0, 0),   -- 森林守护者 - 治疗术

-- 洞穴敌人技能
(@enemy_golem, @skill_normal_attack, 35, 0),  -- 石怪 - 普通攻击
(@enemy_golem, @skill_defense, 0, 40),  -- 石怪 - 防御姿态
(@enemy_bats, @skill_normal_attack, 30, 0),  -- 蝙蝠群 - 普通攻击
(@enemy_bats, @skill_multi_attack, 24, 0),  -- 蝙蝠群 - 连续攻击
(@enemy_spider, @skill_normal_attack, 50, 0),  -- 洞穴巨蜘蛛 - 普通攻击
(@enemy_spider, @skill_berserk, 100, 0), -- 洞穴巨蜘蛛 - 狂暴
(@enemy_spider, @skill_freeze, 0, 0),   -- 洞穴巨蜘蛛 - 冰冻术

-- 遗迹敌人技能
(@enemy_warrior, @skill_normal_attack, 60, 0),  -- 古代战士 - 普通攻击
(@enemy_warrior, @skill_multi_attack, 48, 0),  -- 古代战士 - 连续攻击
(@enemy_puppet, @skill_normal_attack, 55, 0),  -- 魔法傀儡 - 普通攻击
(@enemy_puppet, @skill_freeze, 0, 0),   -- 魔法傀儡 - 冰冻术
(@enemy_ruin_god, @skill_normal_attack, 80, 0),  -- 遗迹守护神 - 普通攻击
(@enemy_ruin_god, @skill_berserk, 160, 0), -- 遗迹守护神 - 狂暴
(@enemy_ruin_god, @skill_heal, 0, 0),   -- 遗迹守护神 - 治疗术

-- 龙族敌人技能
(@enemy_young_dragon, @skill_normal_attack, 70, 0), -- 幼龙 - 普通攻击
(@enemy_young_dragon, @skill_fire, 60, 0), -- 幼龙 - 火焰吐息
(@enemy_dragon_guard, @skill_normal_attack, 75, 0), -- 龙族守卫 - 普通攻击
(@enemy_dragon_guard, @skill_defense, 0, 80), -- 龙族守卫 - 防御姿态
(@enemy_ancient_dragon, @skill_normal_attack, 120, 0),-- 古龙 - 普通攻击
(@enemy_ancient_dragon, @skill_fire, 100, 0),-- 古龙 - 火焰吐息
(@enemy_ancient_dragon, @skill_thunder, 150, 0);-- 古龙 - 雷电术

-- 插入副本奖励
INSERT INTO dungeon_rewards (dungeon_id, reward_type, reward_quantity, drop_rate) VALUES
-- 幽暗森林奖励
(@dungeon_forest, 'coins', 50, 1.0),     -- 100%概率获得50金币
(@dungeon_forest, 'diamonds', 10, 0.3),  -- 30%概率获得10钻石
(@dungeon_forest, 'coins', 100, 0.2),    -- 20%概率额外获得100金币

-- 石窟洞穴奖励
(@dungeon_cave, 'coins', 100, 1.0),    -- 100%概率获得100金币
(@dungeon_cave, 'diamonds', 20, 0.5),  -- 50%概率获得20钻石
(@dungeon_cave, 'coins', 200, 0.15),   -- 15%概率额外获得200金币

-- 古老遗迹奖励
(@dungeon_ruin, 'coins', 200, 1.0),    -- 100%概率获得200金币
(@dungeon_ruin, 'diamonds', 50, 0.7),  -- 70%概率获得50钻石
(@dungeon_ruin, 'diamonds', 100, 0.1), -- 10%概率额外获得100钻石

-- 龙族巢穴奖励
(@dungeon_dragon, 'coins', 500, 1.0),    -- 100%概率获得500金币
(@dungeon_dragon, 'diamonds', 100, 0.8), -- 80%概率获得100钻石
(@dungeon_dragon, 'diamonds', 200, 0.2); -- 20%概率额外获得200钻石

-- 验证插入结果
SELECT '=== 副本列表 ===' as Info;
SELECT dungeon_id, dungeon_name, difficulty FROM dungeons ORDER BY dungeon_id;

SELECT '=== 敌人列表 ===' as Info;
SELECT d.dungeon_name, de.enemy_name, de.enemy_level, de.is_boss 
FROM dungeon_enemies de 
JOIN dungeons d ON de.dungeon_id = d.dungeon_id 
ORDER BY d.dungeon_id, de.is_boss, de.enemy_level;

SELECT '=== 技能列表 ===' as Info;
SELECT skill_id, skill_name, skill_description FROM enemy_skills ORDER BY skill_id;

SELECT '=== 技能关系 ===' as Info;
SELECT de.enemy_name, es.skill_name, esr.skill_attack, esr.skill_defense 
FROM enemy_skill_relation esr 
JOIN dungeon_enemies de ON esr.enemy_id = de.enemy_id 
JOIN enemy_skills es ON esr.skill_id = es.skill_id 
ORDER BY de.enemy_name, es.skill_name;

SELECT '=== 奖励配置 ===' as Info;
SELECT d.dungeon_name, dr.reward_type, dr.reward_quantity, dr.drop_rate 
FROM dungeon_rewards dr 
JOIN dungeons d ON dr.dungeon_id = d.dungeon_id 
ORDER BY d.dungeon_id, dr.reward_type;

SELECT '副本数据插入完成！' as 结果; 