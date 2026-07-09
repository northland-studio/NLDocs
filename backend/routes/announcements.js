const express = require('express');
const { get, run, query } = require('../database');
const { authenticate, requireLevel } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/announcements
 * 获取公告列表
 * - 只返回published状态的公告
 * - 置顶公告排在最前面
 * - 支持分页
 * - 支持搜索
 * - 返回公告列表和总数
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // 构建查询条件
    let whereClause = "WHERE a.status = 'published'";
    const params = [];

    if (search) {
      whereClause += " AND (a.title LIKE ? OR a.content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // 查询公告列表
    const announcements = await query(
      `SELECT
        a.id,
        a.title,
        a.content,
        a.author_id,
        a.is_pinned,
        a.read_count,
        a.created_at,
        a.updated_at,
        a.publish_time,
        u.username as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY a.is_pinned DESC, a.publish_time DESC, a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 查询总数
    const countResult = await get(
      `SELECT COUNT(*) as total FROM announcements a ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: announcements,
        total: countResult.total,
        page: parseInt(page),
        pageSize: limit
      }
    });

  } catch (error) {
    logger.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: '获取公告列表失败'
    });
  }
});

/**
 * GET /api/announcements/stats
 * 获取公告统计
 * - 返回阅读人数、阅读次数等统计信息
 * - 需要管理员权限
 */
router.get('/stats', authenticate, requireLevel(1), async (req, res) => {
  try {
    // 获取公告总数
    const totalResult = await get(
      "SELECT COUNT(*) as total FROM announcements"
    );

    // 获取各状态公告数
    const statusResult = await query(
      "SELECT status, COUNT(*) as count FROM announcements GROUP BY status"
    );

    // 获取总阅读次数
    const readCountResult = await get(
      "SELECT SUM(read_count) as total_reads FROM announcements"
    );

    // 获取总阅读人数
    const readUserResult = await get(
      "SELECT COUNT(DISTINCT user_id) as total_readers FROM announcement_reads"
    );

    // 获取置顶公告数
    const pinnedResult = await get(
      "SELECT COUNT(*) as total FROM announcements WHERE is_pinned = 1"
    );

    const statusStats = {};
    statusResult.forEach(item => {
      statusStats[item.status] = item.count;
    });

    res.json({
      success: true,
      data: {
        total: totalResult.total,
        status: statusStats,
        totalReads: readCountResult.total_reads || 0,
        totalReaders: readUserResult.total_readers || 0,
        pinnedCount: pinnedResult.total
      }
    });

  } catch (error) {
    logger.error('Get announcement stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取公告统计失败'
    });
  }
});

/**
 * GET /api/announcements/:id
 * 获取公告详情
 * - 返回公告完整信息
 * - 自动增加阅读次数
 * - 记录用户阅读（announcement_reads表）
 * - 如果用户已登录，记录user_id
 * - 返回是否已读状态
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    // 查询公告详情
    const announcement = await get(
      `SELECT
        a.id,
        a.title,
        a.content,
        a.author_id,
        a.is_pinned,
        a.read_count,
        a.created_at,
        a.updated_at,
        a.publish_time,
        a.status,
        u.username as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    // 增加阅读次数
    await run(
      "UPDATE announcements SET read_count = read_count + 1 WHERE id = ?",
      [id]
    );

    // 如果用户已登录，记录阅读信息
    let isRead = false;
    if (userId) {
      // 检查是否已阅读
      const existingRead = await get(
        "SELECT id FROM announcement_reads WHERE announcement_id = ? AND user_id = ?",
        [id, userId]
      );

      if (existingRead) {
        isRead = true;
      } else {
        // 记录阅读
        await run(
          "INSERT INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)",
          [id, userId]
        );
        isRead = true;
      }
    }

    res.json({
      success: true,
      data: {
        ...announcement,
        read_count: announcement.read_count + 1,
        isRead
      }
    });

  } catch (error) {
    logger.error('Get announcement detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取公告详情失败'
    });
  }
});

/**
 * POST /api/announcements
 * 创建公告（需要Level >= 1）
 * - 管理员可以创建公告
 * - 支持设置is_pinned（置顶）
 * - 支持设置publish_time（定时发布）
 * - 默认状态为draft
 */
router.post('/', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { title, content, is_pinned = false, publish_time = null } = req.body;
    const authorId = req.user.id;

    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }

    // 创建公告
    const result = await run(
      `INSERT INTO announcements
        (title, content, author_id, is_pinned, publish_time, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [title, content, authorId, is_pinned ? 1 : 0, publish_time]
    );

    // 查询创建的公告
    const announcement = await get(
      `SELECT
        a.id,
        a.title,
        a.content,
        a.author_id,
        a.is_pinned,
        a.status,
        a.publish_time,
        a.created_at,
        u.username as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?`,
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: '公告创建成功',
      data: announcement
    });

  } catch (error) {
    logger.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: '创建公告失败'
    });
  }
});

/**
 * PUT /api/announcements/:id
 * 更新公告（需要Level >= 1）
 * - 更新公告内容
 * - 可以修改置顶状态
 */
router.put('/:id', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned } = req.body;
    const userId = req.user.id;
    const userLevel = req.user.level;

    // 查询公告是否存在
    const announcement = await get(
      "SELECT * FROM announcements WHERE id = ?",
      [id]
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    // 检查权限：超级管理员可以修改所有公告，普通管理员只能修改自己的公告
    if (userLevel < 2 && announcement.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能修改自己创建的公告'
      });
    }

    // 构建更新字段
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?');
      params.push(is_pinned ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    // 执行更新
    await run(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // 查询更新后的公告
    const updatedAnnouncement = await get(
      `SELECT
        a.id,
        a.title,
        a.content,
        a.author_id,
        a.is_pinned,
        a.status,
        a.publish_time,
        a.created_at,
        a.updated_at,
        u.username as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '公告更新成功',
      data: updatedAnnouncement
    });

  } catch (error) {
    logger.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: '更新公告失败'
    });
  }
});

/**
 * DELETE /api/announcements/:id
 * 删除公告（需要Level >= 2）
 * - 只有超级管理员可以删除
 */
router.delete('/:id', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查公告是否存在
    const announcement = await get(
      "SELECT * FROM announcements WHERE id = ?",
      [id]
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    // 删除公告相关的阅读记录
    await run(
      "DELETE FROM announcement_reads WHERE announcement_id = ?",
      [id]
    );

    // 删除公告
    await run(
      "DELETE FROM announcements WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: '公告删除成功'
    });

  } catch (error) {
    logger.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: '删除公告失败'
    });
  }
});

/**
 * PUT /api/announcements/:id/publish
 * 发布公告（需要Level >= 1）
 * - 将draft状态改为published
 * - 设置published_at时间
 */
router.put('/:id/publish', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userLevel = req.user.level;

    // 查询公告
    const announcement = await get(
      "SELECT * FROM announcements WHERE id = ?",
      [id]
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      });
    }

    // 检查权限：超级管理员可以发布所有公告，普通管理员只能发布自己的公告
    if (userLevel < 2 && announcement.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能发布自己创建的公告'
      });
    }

    // 检查状态
    if (announcement.status === 'published') {
      return res.status(400).json({
        success: false,
        message: '公告已发布'
      });
    }

    // 更新为已发布状态
    await run(
      `UPDATE announcements
       SET status = 'published',
           publish_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    // 查询更新后的公告
    const updatedAnnouncement = await get(
      `SELECT
        a.id,
        a.title,
        a.content,
        a.author_id,
        a.is_pinned,
        a.status,
        a.publish_time,
        a.created_at,
        a.updated_at,
        u.username as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '公告发布成功',
      data: updatedAnnouncement
    });

  } catch (error) {
    logger.error('Publish announcement error:', error);
    res.status(500).json({
      success: false,
      message: '发布公告失败'
    });
  }
});

module.exports = router;