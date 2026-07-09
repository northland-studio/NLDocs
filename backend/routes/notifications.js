const express = require('express');
const { query, get, run } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * 获取当前用户的通知列表
 * 查询参数:
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - type: 通知类型筛选（approval/announcement/system）
 * - is_read: 已读状态筛选（true/false）
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { type, is_read } = req.query;

    // 构建查询条件
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (is_read !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    // 获取通知列表（按时间倒序）
    const notifications = await query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 获取未读通知数量
    const unreadResult = await get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    // 获取总数
    const totalResult = await get(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          content: n.content,
          related_id: n.related_id,
          is_read: Boolean(n.is_read),
          created_at: n.created_at
        })),
        unread_count: unreadResult.count,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          total_pages: Math.ceil(totalResult.count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败'
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * 获取当前用户的未读通知数量
 */
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unread_count: result.count
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数量失败'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * 标记单个通知为已读
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 验证通知是否属于当前用户
    const notification = await get(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 标记为已读
    await run(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: '已标记为已读'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: '标记已读失败'
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * 标记当前用户的所有未读通知为已读
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 标记所有未读通知为已读
    const result = await run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      message: `已标记 ${result.changes} 条通知为已读`
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: '标记全部已读失败'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * 删除指定通知
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 验证通知是否属于当前用户
    const notification = await get(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 删除通知
    await run(
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: '通知已删除'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败'
    });
  }
});

/**
 * DELETE /api/notifications/read
 * 删除当前用户的所有已读通知
 */
router.delete('/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 删除所有已读通知
    const result = await run(
      'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
      [userId]
    );

    res.json({
      success: true,
      message: `已删除 ${result.changes} 条已读通知`
    });

  } catch (error) {
    console.error('Delete read notifications error:', error);
    res.status(500).json({
      success: false,
      message: '删除已读通知失败'
    });
  }
});

module.exports = router;