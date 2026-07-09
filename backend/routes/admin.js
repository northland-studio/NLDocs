const express = require('express');
const { query, get, run } = require('../database');
const { authenticate, requireLevel } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/admin/users
 * 获取用户列表
 * 需要Level >= 2权限
 */
router.get('/users', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (keyword) {
      whereClause = 'WHERE username LIKE ?';
      params.push(`%${keyword}%`);
    }

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await get(countSql, params);
    const total = countResult.total;

    // 查询用户列表
    const sql = `
      SELECT id, xuanjian_id, username, level, title, contribution, avatar, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);
    const users = await query(sql, params);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

/**
 * PUT /api/admin/users/:id/level
 * 修改用户权限等级
 * 需要Level >= 2权限
 */
router.put('/users/:id/level', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { id } = req.params;
    const { level } = req.body;

    if (level === undefined || level < 0 || level > 3) {
      return res.status(400).json({
        success: false,
        message: '权限等级必须在0-3之间'
      });
    }

    // 检查用户是否存在
    const user = await get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能修改自己的权限等级
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的权限等级'
      });
    }

    // 更新权限等级
    await run('UPDATE users SET level = ? WHERE id = ?', [level, id]);

    // 获取更新后的用户信息
    const updatedUser = await get(
      'SELECT id, username, level, title, contribution FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: '权限等级已更新',
      data: updatedUser
    });

  } catch (error) {
    console.error('修改用户权限错误:', error);
    res.status(500).json({
      success: false,
      message: '修改用户权限失败'
    });
  }
});

/**
 * GET /api/admin/categories
 * 获取分类列表（管理后台）
 * 需要Level >= 2权限
 * 包含更详细的管理信息
 */
router.get('/categories', authenticate, requireLevel(2), async (req, res) => {
  try {
    const sql = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM documents WHERE category_id = c.id) as document_count,
        (SELECT COUNT(*) FROM documents WHERE category_id = c.id AND status = 'published') as published_count
      FROM categories c
      ORDER BY c.name ASC
    `;

    const categories = await query(sql);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

/**
 * POST /api/admin/categories
 * 创建分类
 * 需要Level >= 2权限
 */
router.post('/categories', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    // 检查是否已存在同名分类
    const existingCategory = await get(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }

    // 创建分类
    const result = await run(
      'INSERT INTO categories (name, parent_id, description) VALUES (?, ?, ?)',
      [name, parent_id || null, description || null]
    );

    const newCategory = await get('SELECT * FROM categories WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: newCategory
    });

  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * 更新分类
 * 需要Level >= 2权限
 */
router.put('/categories/:id', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // 检查分类是否存在
    const category = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 如果修改名称，检查是否已存在同名分类
    if (name && name !== category.name) {
      const existingCategory = await get(
        'SELECT * FROM categories WHERE name = ? AND id != ?',
        [name, id]
      );

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }
    }

    // 更新分类
    const updateFields = [];
    const updateParams = [];

    if (name) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的内容'
      });
    }

    updateParams.push(id);
    await run(`UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

    const updatedCategory = await get('SELECT * FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '分类更新成功',
      data: updatedCategory
    });

  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * 删除分类
 * 需要Level >= 2权限
 * 注意：删除分类前需要先将该分类下的文档转移到其他分类或删除
 */
router.delete('/categories/:id', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类是否存在
    const category = await get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    // 检查分类下是否有文档
    const documentCount = await get(
      'SELECT COUNT(*) as count FROM documents WHERE category_id = ?',
      [id]
    );

    if (documentCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `该分类下还有${documentCount.count}个文档，无法删除`
      });
    }

    // 删除分类
    await run('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '分类已删除'
    });

  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
});

/**
 * GET /api/admin/settings
 * 获取系统设置
 * 需要Level >= 2权限
 */
router.get('/settings', authenticate, requireLevel(2), async (req, res) => {
  try {
    // 返回OAuth配置信息（不包含敏感信息）
    const settings = {
      oauth: {
        provider: '玄剑官网',
        token_url: process.env.OAUTH_TOKEN_URL,
        verify_url: process.env.OAUTH_VERIFY_URL,
        redirect_uri: process.env.OAUTH_REDIRECT_URI,
        client_id: process.env.OAUTH_CLIENT_ID ? '已配置' : '未配置'
      },
      smtp: {
        host: process.env.SMTP_HOST || '未配置',
        port: process.env.SMTP_PORT || '未配置',
        user: process.env.SMTP_USER ? '已配置' : '未配置'
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('获取系统设置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败'
    });
  }
});

/**
 * GET /api/admin/stats
 * 获取系统统计信息
 * 需要Level >= 2权限
 */
router.get('/stats', authenticate, requireLevel(2), async (req, res) => {
  try {
    // 获取各种统计数据
    const userCount = await get('SELECT COUNT(*) as count FROM users');
    const documentCount = await get('SELECT COUNT(*) as count FROM documents');
    const publishedCount = await get('SELECT COUNT(*) as count FROM documents WHERE status = "published"');
    const draftCount = await get('SELECT COUNT(*) as count FROM documents WHERE status = "draft"');
    const categoryCount = await get('SELECT COUNT(*) as count FROM categories');
    const pendingApprovals = await get('SELECT COUNT(*) as count FROM approvals WHERE status = "pending"');

    const stats = {
      users: userCount.count,
      documents: documentCount.count,
      publishedDocuments: publishedCount.count,
      draftDocuments: draftCount.count,
      categories: categoryCount.count,
      pendingApprovals: pendingApprovals.count
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

module.exports = router;