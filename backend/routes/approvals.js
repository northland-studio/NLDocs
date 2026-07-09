const express = require('express');
const { get, run, query } = require('../database');
const { authenticate, requireLevel } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/approvals
 * 提交文档发布审批申请
 * 普通用户可以提交文档发布申请
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { document_id, comment } = req.body;

    if (!document_id) {
      return res.status(400).json({
        success: false,
        message: '缺少文档ID'
      });
    }

    // 检查文档是否存在
    const document = await get(
      'SELECT * FROM documents WHERE id = ?',
      [document_id]
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 检查文档是否属于当前用户
    if (document.author_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能提交自己的文档进行审批'
      });
    }

    // 检查文档状态是否为draft
    if (document.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只能提交草稿状态的文档进行审批'
      });
    }

    // 检查是否已存在pending状态的审批
    const existingApproval = await get(
      'SELECT * FROM approvals WHERE document_id = ? AND status = ?',
      [document_id, 'pending']
    );

    if (existingApproval) {
      return res.status(400).json({
        success: false,
        message: '该文档已有待审核的申请'
      });
    }

    // 创建审批记录
    const result = await run(
      `INSERT INTO approvals (document_id, requester_id, status, comment)
       VALUES (?, ?, ?, ?)`,
      [document_id, req.user.id, 'pending', comment || null]
    );

    // 获取创建的审批记录
    const approval = await get(
      'SELECT * FROM approvals WHERE id = ?',
      [result.id]
    );

    // 发送通知给所有管理员 (level >= 1)
    const admins = await query(
      'SELECT id FROM users WHERE level >= 1'
    );

    for (const admin of admins) {
      await run(
        `INSERT INTO notifications (user_id, type, title, content, related_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          admin.id,
          'approval_request',
          '新的文档发布申请',
          `用户 ${req.user.username} 提交了文档"${document.title}"的发布申请，请及时审核。`,
          result.id
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: '审批申请已提交',
      data: approval
    });

  } catch (error) {
    logger.error('提交审批申请错误:', error);
    res.status(500).json({
      success: false,
      message: '提交审批申请失败'
    });
  }
});

/**
 * GET /api/approvals
 * 获取审批列表
 * 普通用户：只能看到自己提交的审批
 * 管理员(Level >= 1)：可以看到所有pending的审批
 * 支持状态筛选和分页
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userLevel = req.user.level || 0;

    let sql, countSql, params = [], countParams = [];

    if (userLevel >= 1) {
      // 管理员可以看到所有审批
      if (status) {
        sql = `
          SELECT a.*, d.title as document_title, d.content as document_content,
                 u.username as requester_name, u.avatar as requester_avatar,
                 r.username as reviewer_name
          FROM approvals a
          LEFT JOIN documents d ON a.document_id = d.id
          LEFT JOIN users u ON a.requester_id = u.id
          LEFT JOIN users r ON a.reviewer_id = r.id
          WHERE a.status = ?
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countSql = 'SELECT COUNT(*) as total FROM approvals WHERE status = ?';
        params = [status, parseInt(limit), offset];
        countParams = [status];
      } else {
        sql = `
          SELECT a.*, d.title as document_title, d.content as document_content,
                 u.username as requester_name, u.avatar as requester_avatar,
                 r.username as reviewer_name
          FROM approvals a
          LEFT JOIN documents d ON a.document_id = d.id
          LEFT JOIN users u ON a.requester_id = u.id
          LEFT JOIN users r ON a.reviewer_id = r.id
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countSql = 'SELECT COUNT(*) as total FROM approvals';
        params = [parseInt(limit), offset];
      }
    } else {
      // 普通用户只能看到自己的审批
      if (status) {
        sql = `
          SELECT a.*, d.title as document_title, d.content as document_content,
                 u.username as requester_name, u.avatar as requester_avatar,
                 r.username as reviewer_name
          FROM approvals a
          LEFT JOIN documents d ON a.document_id = d.id
          LEFT JOIN users u ON a.requester_id = u.id
          LEFT JOIN users r ON a.reviewer_id = r.id
          WHERE a.requester_id = ? AND a.status = ?
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countSql = 'SELECT COUNT(*) as total FROM approvals WHERE requester_id = ? AND status = ?';
        params = [req.user.id, status, parseInt(limit), offset];
        countParams = [req.user.id, status];
      } else {
        sql = `
          SELECT a.*, d.title as document_title, d.content as document_content,
                 u.username as requester_name, u.avatar as requester_avatar,
                 r.username as reviewer_name
          FROM approvals a
          LEFT JOIN documents d ON a.document_id = d.id
          LEFT JOIN users u ON a.requester_id = u.id
          LEFT JOIN users r ON a.reviewer_id = r.id
          WHERE a.requester_id = ?
          ORDER BY a.created_at DESC
          LIMIT ? OFFSET ?
        `;
        countSql = 'SELECT COUNT(*) as total FROM approvals WHERE requester_id = ?';
        params = [req.user.id, parseInt(limit), offset];
        countParams = [req.user.id];
      }
    }

    const approvals = await query(sql, params);
    const countResult = await get(countSql, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        approvals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取审批列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审批列表失败'
    });
  }
});

/**
 * GET /api/approvals/my
 * 获取我的审批申请
 * 返回当前用户提交的所有审批申请
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql, countSql, params = [], countParams = [];

    if (status) {
      sql = `
        SELECT a.*, d.title as document_title, d.content as document_content,
               r.username as reviewer_name
        FROM approvals a
        LEFT JOIN documents d ON a.document_id = d.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.requester_id = ? AND a.status = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countSql = 'SELECT COUNT(*) as total FROM approvals WHERE requester_id = ? AND status = ?';
      params = [req.user.id, status, parseInt(limit), offset];
      countParams = [req.user.id, status];
    } else {
      sql = `
        SELECT a.*, d.title as document_title, d.content as document_content,
               r.username as reviewer_name
        FROM approvals a
        LEFT JOIN documents d ON a.document_id = d.id
        LEFT JOIN users r ON a.reviewer_id = r.id
        WHERE a.requester_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      countSql = 'SELECT COUNT(*) as total FROM approvals WHERE requester_id = ?';
      params = [req.user.id, parseInt(limit), offset];
      countParams = [req.user.id];
    }

    const approvals = await query(sql, params);
    const countResult = await get(countSql, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        approvals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取我的审批申请错误:', error);
    res.status(500).json({
      success: false,
      message: '获取我的审批申请失败'
    });
  }
});

/**
 * GET /api/approvals/pending
 * 获取待审核列表
 * 需要Level >= 1权限
 * 返回所有pending状态的审批
 */
router.get('/pending', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT a.*, d.title as document_title, d.content as document_content,
             u.username as requester_name, u.avatar as requester_avatar,
             u.level as requester_level
      FROM approvals a
      LEFT JOIN documents d ON a.document_id = d.id
      LEFT JOIN users u ON a.requester_id = u.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const countSql = 'SELECT COUNT(*) as total FROM approvals WHERE status = ?';

    const approvals = await query(sql, [parseInt(limit), offset]);
    const countResult = await get(countSql, ['pending']);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        approvals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('获取待审核列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核列表失败'
    });
  }
});

/**
 * GET /api/approvals/:id
 * 获取审批详情
 * 返回审批完整信息，包含文档信息、申请人信息
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userLevel = req.user.level || 0;

    const sql = `
      SELECT a.*,
             d.id as document_id, d.title as document_title, d.content as document_content,
             d.file_path as document_file_path, d.file_type as document_file_type,
             d.category_id, d.status as document_status, d.version as document_version,
             d.created_at as document_created_at, d.updated_at as document_updated_at,
             u.id as requester_id, u.username as requester_name, u.avatar as requester_avatar,
             u.level as requester_level, u.title as requester_title,
             r.id as reviewer_id_field, r.username as reviewer_name, r.avatar as reviewer_avatar,
             c.name as category_name
      FROM approvals a
      LEFT JOIN documents d ON a.document_id = d.id
      LEFT JOIN users u ON a.requester_id = u.id
      LEFT JOIN users r ON a.reviewer_id = r.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE a.id = ?
    `;

    const approval = await get(sql, [id]);

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: '审批记录不存在'
      });
    }

    // 权限检查：普通用户只能查看自己的审批
    if (userLevel < 1 && approval.requester_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权查看此审批记录'
      });
    }

    // 构造返回数据
    const result = {
      id: approval.id,
      document_id: approval.document_id,
      status: approval.status,
      comment: approval.comment,
      created_at: approval.created_at,
      reviewed_at: approval.reviewed_at,
      document: {
        id: approval.document_id,
        title: approval.document_title,
        content: approval.document_content,
        file_path: approval.document_file_path,
        file_type: approval.document_file_type,
        category_id: approval.category_id,
        category_name: approval.category_name,
        status: approval.document_status,
        version: approval.document_version,
        created_at: approval.document_created_at,
        updated_at: approval.document_updated_at
      },
      requester: {
        id: approval.requester_id,
        username: approval.requester_name,
        avatar: approval.requester_avatar,
        level: approval.requester_level,
        title: approval.requester_title
      },
      reviewer: approval.reviewer_id_field ? {
        id: approval.reviewer_id_field,
        username: approval.reviewer_name,
        avatar: approval.reviewer_avatar
      } : null
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('获取审批详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审批详情失败'
    });
  }
});

/**
 * PUT /api/approvals/:id/approve
 * 审批通过
 * 需要Level >= 1权限
 * 更新approval状态为approved，自动将文档状态改为published
 */
router.put('/:id/approve', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    // 获取审批记录
    const approval = await get(
      'SELECT * FROM approvals WHERE id = ?',
      [id]
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: '审批记录不存在'
      });
    }

    // 检查审批状态
    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该审批已被处理'
      });
    }

    // 更新审批状态
    await run(
      `UPDATE approvals
       SET status = 'approved',
           reviewer_id = ?,
           comment = ?,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, comment || null, id]
    );

    // 更新文档状态为published
    await run(
      `UPDATE documents
       SET status = 'published',
           published_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [approval.document_id]
    );

    // 发送通知给申请人
    await run(
      `INSERT INTO notifications (user_id, type, title, content, related_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        approval.requester_id,
        'approval_result',
        '文档发布申请已通过',
        `您的文档发布申请已通过审核。${comment ? '审核意见：' + comment : ''}`,
        id
      ]
    );

    // 获取更新后的审批记录
    const updatedApproval = await get(
      'SELECT * FROM approvals WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '审批已通过',
      data: updatedApproval
    });

  } catch (error) {
    logger.error('审批通过错误:', error);
    res.status(500).json({
      success: false,
      message: '审批通过失败'
    });
  }
});

/**
 * PUT /api/approvals/:id/reject
 * 审批拒绝
 * 需要Level >= 1权限
 * 更新approval状态为rejected，文档保持draft状态
 */
router.put('/:id/reject', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: '拒绝审批时必须提供拒绝原因'
      });
    }

    // 获取审批记录
    const approval = await get(
      'SELECT * FROM approvals WHERE id = ?',
      [id]
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: '审批记录不存在'
      });
    }

    // 检查审批状态
    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该审批已被处理'
      });
    }

    // 更新审批状态
    await run(
      `UPDATE approvals
       SET status = 'rejected',
           reviewer_id = ?,
           comment = ?,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, comment, id]
    );

    // 文档保持draft状态（不需要更新）

    // 发送通知给申请人
    await run(
      `INSERT INTO notifications (user_id, type, title, content, related_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        approval.requester_id,
        'approval_result',
        '文档发布申请已被拒绝',
        `您的文档发布申请已被拒绝。拒绝原因：${comment}`,
        id
      ]
    );

    // 获取更新后的审批记录
    const updatedApproval = await get(
      'SELECT * FROM approvals WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '审批已拒绝',
      data: updatedApproval
    });

  } catch (error) {
    logger.error('审批拒绝错误:', error);
    res.status(500).json({
      success: false,
      message: '审批拒绝失败'
    });
  }
});

module.exports = router;