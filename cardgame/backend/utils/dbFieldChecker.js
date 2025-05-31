const { pool } = require('../config/db');

// 缓存字段检测结果
let fieldCache = null;

/**
 * 检测cards表中defense字段的正确名称
 * @returns {Promise<string>} 返回正确的字段名
 */
async function getDefenseFieldName() {
  if (fieldCache) {
    return fieldCache;
  }

  try {
    const [columns] = await pool.query('SHOW COLUMNS FROM cards');
    
    // 检查是否有正确的字段名
    if (columns.some(col => col.Field === 'base_defense')) {
      fieldCache = 'base_defense';
      return 'base_defense';
    }
    
    // 检查是否有拼写错误的字段名
    if (columns.some(col => col.Field === 'base_defemse')) {
      fieldCache = 'base_defemse';
      return 'base_defemse';
    }
    
    throw new Error('未找到defense相关字段');
  } catch (error) {
    console.error('检测字段名失败:', error);
    throw error;
  }
}

/**
 * 生成适配的SQL查询语句
 * @param {string} baseQuery - 基础查询语句
 * @returns {Promise<string>} 返回适配后的查询语句
 */
async function adaptDefenseFieldQuery(baseQuery) {
  const defenseField = await getDefenseFieldName();
  
  if (defenseField === 'base_defemse') {
    // 如果是拼写错误的字段，使用别名
    return baseQuery.replace(/c\.base_defense/g, 'c.base_defemse as base_defense');
  }
  
  // 如果是正确的字段名，直接返回
  return baseQuery;
}

/**
 * 清除缓存（用于测试或重新检测）
 */
function clearFieldCache() {
  fieldCache = null;
}

module.exports = {
  getDefenseFieldName,
  adaptDefenseFieldQuery,
  clearFieldCache
}; 