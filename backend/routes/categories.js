const express = require('express');
const { query, get, run } = require('../database');
const { authenticate } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/categories
 * 获取所有分类列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await query(
      'SELECT * FROM categories ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类失败'
    });
  }
});

/**
 * POST /api/categories
 * 创建新分类（管理员）
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.level < 1) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    await run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );

    const newCategory = await get(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );

    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    logger.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
});

module.exports = router;