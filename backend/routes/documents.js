const express = require('express');
const { query, get, run } = require('../database');
const { authenticate, requireLevel } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/documents
 * 获取文档列表
 * 支持分页、分类筛选、全文搜索、状态筛选
 * 普通用户只能看到published状态的文档
 * 管理员可以看到所有状态
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.category_id;
    const keyword = req.query.keyword;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereConditions = [];
    let params = [];

    // 权限过滤：普通用户只能看到published
    const userLevel = req.user.level || 0;
    if (userLevel < 1) {
      whereConditions.push('d.status = ?');
      params.push('published');
    } else {
      // 管理员可以根据status筛选，默认看全部
      if (status) {
        whereConditions.push('d.status = ?');
        params.push(status);
      }
    }

    // 分类筛选
    if (categoryId) {
      whereConditions.push('d.category_id = ?');
      params.push(categoryId);
    }

    // 关键词搜索
    if (keyword) {
      whereConditions.push('(d.title LIKE ? OR d.content LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM documents d
      ${whereClause}
    `;
    const countResult = await get(countSql, params);
    const total = countResult.total;

    // 查询文档列表
    const listSql = `
      SELECT
        d.id,
        d.title,
        d.content,
        d.file_path,
        d.file_type,
        d.category_id,
        d.author_id,
        d.status,
        d.version,
        d.created_at,
        d.updated_at,
        d.published_at,
        u.username as author_name,
        c.name as category_name
      FROM documents d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      ${whereClause}
      ORDER BY d.updated_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    const documents = await query(listSql, params);

    res.json({
      success: true,
      data: {
        list: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('获取文档列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文档列表失败'
    });
  }
});

/**
 * GET /api/documents/:id
 * 获取文档详情
 * 包含作者信息、分类名称、版本历史列表
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询文档详情
    const docSql = `
      SELECT
        d.*,
        u.username as author_name,
        u.title as author_title,
        u.avatar as author_avatar,
        c.name as category_name
      FROM documents d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = ?
    `;
    const document = await get(docSql, [id]);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 权限检查：普通用户只能查看published状态
    const userLevel = req.user.level || 0;
    if (userLevel < 1 && document.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: '无权查看此文档'
      });
    }

    // 查询版本历史
    const versionsSql = `
      SELECT
        dv.id,
        dv.document_id,
        dv.version,
        dv.title,
        dv.created_at,
        u.username as author_name
      FROM document_versions dv
      LEFT JOIN users u ON dv.author_id = u.id
      WHERE dv.document_id = ?
      ORDER BY dv.version DESC
    `;
    const versions = await query(versionsSql, [id]);

    res.json({
      success: true,
      data: {
        ...document,
        versions
      }
    });

  } catch (error) {
    logger.error('获取文档详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取文档详情失败'
    });
  }
});

/**
 * POST /api/documents
 * 创建文档
 * 需要Level >= 1
 */
router.post('/', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { title, content, file_path, file_type, category_id, status } = req.body;
    const authorId = req.user.id;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '文档标题不能为空'
      });
    }

    // 创建文档记录
    const insertSql = `
      INSERT INTO documents (title, content, file_path, file_type, category_id, author_id, status, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;
    const result = await run(insertSql, [
      title,
      content || null,
      file_path || null,
      file_type || null,
      category_id || null,
      authorId,
      status || 'draft'
    ]);

    const documentId = result.id;

    // 创建初始版本记录
    const versionSql = `
      INSERT INTO document_versions (document_id, version, title, content, file_path, author_id)
      VALUES (?, 1, ?, ?, ?, ?)
    `;
    await run(versionSql, [
      documentId,
      title,
      content || null,
      file_path || null,
      authorId
    ]);

    // 查询创建的文档
    const newDoc = await get(
      `SELECT d.*, u.username as author_name, c.name as category_name
       FROM documents d
       LEFT JOIN users u ON d.author_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.id = ?`,
      [documentId]
    );

    res.status(201).json({
      success: true,
      message: '文档创建成功',
      data: newDoc
    });

  } catch (error) {
    logger.error('创建文档失败:', error);
    res.status(500).json({
      success: false,
      message: '创建文档失败'
    });
  }
});

/**
 * PUT /api/documents/:id
 * 更新文档
 * 需要Level >= 1
 * 自动保存版本历史
 */
router.put('/:id', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, file_path, file_type, category_id, status } = req.body;
    const authorId = req.user.id;

    // 查询现有文档
    const existingDoc = await get('SELECT * FROM documents WHERE id = ?', [id]);

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 准备更新数据
    const updateFields = [];
    const updateParams = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateParams.push(content);
    }
    if (file_path !== undefined) {
      updateFields.push('file_path = ?');
      updateParams.push(file_path);
    }
    if (file_type !== undefined) {
      updateFields.push('file_type = ?');
      updateParams.push(file_type);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateParams.push(category_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);

      // 如果状态变为published，设置发布时间
      if (status === 'published' && !existingDoc.published_at) {
        updateFields.push('published_at = CURRENT_TIMESTAMP');
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的内容'
      });
    }

    // 更新版本号
    const newVersion = existingDoc.version + 1;
    updateFields.push('version = ?');
    updateParams.push(newVersion);
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(id);

    // 更新文档
    const updateSql = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`;
    await run(updateSql, updateParams);

    // 创建版本历史记录
    const versionSql = `
      INSERT INTO document_versions (document_id, version, title, content, file_path, author_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await run(versionSql, [
      id,
      newVersion,
      title !== undefined ? title : existingDoc.title,
      content !== undefined ? content : existingDoc.content,
      file_path !== undefined ? file_path : existingDoc.file_path,
      authorId
    ]);

    // 查询更新后的文档
    const updatedDoc = await get(
      `SELECT d.*, u.username as author_name, c.name as category_name
       FROM documents d
       LEFT JOIN users u ON d.author_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '文档更新成功',
      data: updatedDoc
    });

  } catch (error) {
    logger.error('更新文档失败:', error);
    res.status(500).json({
      success: false,
      message: '更新文档失败'
    });
  }
});

/**
 * DELETE /api/documents/:id
 * 删除文档
 * 需要Level >= 2（超级管理员）
 */
router.delete('/:id', authenticate, requireLevel(2), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查文档是否存在
    const existingDoc = await get('SELECT * FROM documents WHERE id = ?', [id]);

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 删除版本历史
    await run('DELETE FROM document_versions WHERE document_id = ?', [id]);

    // 删除文档（硬删除）
    await run('DELETE FROM documents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '文档删除成功'
    });

  } catch (error) {
    logger.error('删除文档失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文档失败'
    });
  }
});

/**
 * GET /api/documents/:id/versions
 * 获取文档版本历史
 */
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查文档是否存在
    const document = await get('SELECT * FROM documents WHERE id = ?', [id]);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 权限检查：普通用户只能查看published状态的文档版本
    const userLevel = req.user.level || 0;
    if (userLevel < 1 && document.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: '无权查看此文档版本历史'
      });
    }

    // 查询版本历史
    const versionsSql = `
      SELECT
        dv.*,
        u.username as author_name
      FROM document_versions dv
      LEFT JOIN users u ON dv.author_id = u.id
      WHERE dv.document_id = ?
      ORDER BY dv.version DESC
    `;
    const versions = await query(versionsSql, [id]);

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    logger.error('获取版本历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取版本历史失败'
    });
  }
});

/**
 * POST /api/documents/:id/restore/:version
 * 恢复历史版本
 * 需要Level >= 1
 */
router.post('/:id/restore/:version', authenticate, requireLevel(1), async (req, res) => {
  try {
    const { id, version } = req.params;
    const authorId = req.user.id;

    // 查询当前文档
    const document = await get('SELECT * FROM documents WHERE id = ?', [id]);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: '文档不存在'
      });
    }

    // 查询要恢复的版本
    const targetVersion = await get(
      'SELECT * FROM document_versions WHERE document_id = ? AND version = ?',
      [id, parseInt(version)]
    );

    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        message: '指定的版本不存在'
      });
    }

    // 更新文档内容
    const newVersion = document.version + 1;
    const updateSql = `
      UPDATE documents SET
        title = ?,
        content = ?,
        file_path = ?,
        version = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await run(updateSql, [
      targetVersion.title,
      targetVersion.content,
      targetVersion.file_path,
      newVersion,
      id
    ]);

    // 创建新版本记录
    const versionSql = `
      INSERT INTO document_versions (document_id, version, title, content, file_path, author_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await run(versionSql, [
      id,
      newVersion,
      targetVersion.title,
      targetVersion.content,
      targetVersion.file_path,
      authorId
    ]);

    // 查询更新后的文档
    const updatedDoc = await get(
      `SELECT d.*, u.username as author_name, c.name as category_name
       FROM documents d
       LEFT JOIN users u ON d.author_id = u.id
       LEFT JOIN categories c ON d.category_id = c.id
       WHERE d.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '版本恢复成功',
      data: updatedDoc
    });

  } catch (error) {
    logger.error('恢复版本失败:', error);
    res.status(500).json({
      success: false,
      message: '恢复版本失败'
    });
  }
});

/**
 * GET /api/categories
 * 获取分类列表
 * 支持parent_id筛选
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    const parentId = req.query.parent_id;

    let sql = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM documents WHERE category_id = c.id) as document_count
      FROM categories c
    `;
    let params = [];

    if (parentId !== undefined) {
      sql += ' WHERE c.parent_id = ?';
      params.push(parentId === 'null' ? null : parseInt(parentId));
    }

    sql += ' ORDER BY c.name ASC';

    const categories = await query(sql, params);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
});

/**
 * POST /api/categories
 * 创建分类
 * 需要Level >= 3（文档管理员）
 */
router.post('/categories', authenticate, requireLevel(3), async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    // 如果有父分类，检查父分类是否存在
    if (parent_id) {
      const parentCategory = await get('SELECT * FROM categories WHERE id = ?', [parent_id]);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: '父分类不存在'
        });
      }
    }

    const insertSql = `
      INSERT INTO categories (name, parent_id, description)
      VALUES (?, ?, ?)
    `;
    const result = await run(insertSql, [name, parent_id || null, description || null]);

    const newCategory = await get('SELECT * FROM categories WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: newCategory
    });

  } catch (error) {
    logger.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

module.exports = router;