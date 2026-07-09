const { run } = require('../database');

/**
 * 创建通知
 * @param {number} userId - 接收通知的用户ID
 * @param {string} type - 通知类型（approval/announcement/system）
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {number} relatedId - 关联对象的ID（可选）
 * @returns {Promise<{id: number}>} - 返回创建的通知ID
 */
const createNotification = async (userId, type, title, content = null, relatedId = null) => {
  try {
    // 验证通知类型
    const validTypes = ['approval', 'announcement', 'system'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // 插入通知记录
    const result = await run(
      `INSERT INTO notifications (user_id, type, title, content, related_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, content, relatedId]
    );

    console.log(`Notification created: ID=${result.id}, type=${type}, userId=${userId}`);
    return { id: result.id };

  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * 批量创建通知
 * @param {Array<number>} userIds - 接收通知的用户ID数组
 * @param {string} type - 通知类型
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {number} relatedId - 关联对象的ID（可选）
 * @returns {Promise<Array<{id: number}>>} - 返回创建的通知ID数组
 */
const createNotificationBatch = async (userIds, type, title, content = null, relatedId = null) => {
  try {
    const results = [];
    for (const userId of userIds) {
      const result = await createNotification(userId, type, title, content, relatedId);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error('Create notification batch error:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createNotificationBatch
};