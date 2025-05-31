-- 将强化石重命名为学习教材
-- 强化石I -> 大物实验教程
-- 强化石II -> 量子物理教材
-- 强化石III -> 数学分析练习册
-- 强化石IV -> 线性代数试卷
-- 强化石V -> 毕业论文代写
-- 经验药水 -> 红专并进
-- 属性精华 -> 数理基础

-- 更新enhancement_items表中的强化石名称和描述
UPDATE enhancement_items 
SET 
    item_name = '大物实验教程',
    item_description = '用于提升卡牌等级至20级的大学物理实验教程，包含详细的实验步骤和理论基础'
WHERE item_name = '强化石I';

UPDATE enhancement_items 
SET 
    item_name = '量子物理教材',
    item_description = '用于提升卡牌等级至40级的量子物理学教材，深入探讨量子力学原理'
WHERE item_name = '强化石II';

UPDATE enhancement_items 
SET 
    item_name = '数学分析练习册',
    item_description = '用于提升卡牌等级至60级的数学分析练习册，包含大量习题和解答'
WHERE item_name = '强化石III';

UPDATE enhancement_items 
SET 
    item_name = '线性代数试卷',
    item_description = '用于提升卡牌等级至80级的线性代数试卷，考验线性代数掌握程度'
WHERE item_name = '强化石IV';

UPDATE enhancement_items 
SET 
    item_name = '毕业论文代写',
    item_description = '用于提升卡牌等级至100级的终极学业代写服务，助你顺利毕业'
WHERE item_name = '强化石V';

-- 更新消耗品名称和描述
UPDATE enhancement_items 
SET 
    item_name = '红专并进',
    item_description = '体现红专并进精神的神奇药水，可直接提升卡牌等级1级'
WHERE item_name = '经验药水';

UPDATE enhancement_items 
SET 
    item_name = '数理基础',
    item_description = '加强数理基础的珍贵材料，可永久提升卡牌攻击力和防御力各5点'
WHERE item_name = '属性精华';

-- 验证更新结果
SELECT item_id, item_name, item_description, required_level, rarity 
FROM enhancement_items 
WHERE item_name IN ('大物实验教程', '量子物理教材', '数学分析练习册', '线性代数试卷', '毕业论文代写', '红专并进', '数理基础')
ORDER BY required_level; 