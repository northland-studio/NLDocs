const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, requireLevel } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 支持的文件类型
const ALLOWED_MIME_TYPES = {
  // 文档
  'text/markdown': ['.md'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  // 图片
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // 代码
  'text/javascript': ['.js', '.mjs'],
  'application/javascript': ['.js'],
  'text/typescript': ['.ts', '.tsx'],
  'text/x-python': ['.py'],
  'text/x-java-source': ['.java'],
  'text/x-go': ['.go'],
  'text/x-rust': ['.rs'],
  'text/html': ['.html', '.htm'],
  'text/css': ['.css'],
  'application/json': ['.json'],
  'text/xml': ['.xml'],
  'application/xml': ['.xml']
};

// 扩展名白名单
const ALLOWED_EXTENSIONS = [
  // 文档
  '.md', '.pdf', '.docx', '.xlsx', '.txt',
  // 图片
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  // 代码
  '.js', '.mjs', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
  '.html', '.htm', '.css', '.json', '.xml'
];

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: timestamp-randomNumber.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 检查扩展名是否在白名单中
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`不支持的文件类型: ${ext}`), false);
  }

  // 检查 MIME 类型（如果有定义）
  const allowedExts = ALLOWED_MIME_TYPES[file.mimetype];
  if (allowedExts && !allowedExts.includes(ext)) {
    // MIME 类型与扩展名不匹配，但仍允许（某些系统MIME类型检测不准确）
    console.warn(`MIME类型不匹配: ${file.mimetype} vs ${ext}`);
  }

  cb(null, true);
};

// 配置 multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
    files: 5 // 最多5个文件
  },
  fileFilter: fileFilter
});

/**
 * 获取文件类型分类
 * @param {string} ext - 文件扩展名
 * @returns {string} 文件类型分类
 */
const getFileCategory = (ext) => {
  const docExts = ['.md', '.pdf', '.docx', '.xlsx', '.txt'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const codeExts = ['.js', '.mjs', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.html', '.htm', '.css', '.json', '.xml'];

  if (docExts.includes(ext)) return 'document';
  if (imageExts.includes(ext)) return 'image';
  if (codeExts.includes(ext)) return 'code';
  return 'other';
};

/**
 * 获取文件的 MIME 类型
 * @param {string} ext - 文件扩展名
 * @returns {string} MIME 类型
 */
const getMimeType = (ext) => {
  const mimeMap = {
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml'
  };
  return mimeMap[ext] || 'application/octet-stream';
};

/**
 * POST /api/upload
 * 上传单个文件
 */
router.post('/', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未提供文件'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileUrl = `/api/upload/${req.file.filename}`;
    const fileCategory = getFileCategory(ext);

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        category: fileCategory,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败'
    });
  }
});

/**
 * POST /api/upload/multiple
 * 上传多个文件（最多5个）
 */
router.post('/multiple', authenticate, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未提供文件'
      });
    }

    const files = req.files.map(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      return {
        filename: file.filename,
        originalName: file.originalname,
        url: `/api/upload/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype,
        category: getFileCategory(ext),
        uploadedAt: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      data: {
        files: files,
        count: files.length
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败'
    });
  }
});

/**
 * GET /api/upload/:filename
 * 获取文件
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }

    const filePath = path.join(uploadDir, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeType = getMimeType(ext);

    // 设置响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // 发送文件
    res.sendFile(filePath);

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: '获取文件失败'
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * 删除文件（需要 Level >= 2 超级管理员权限）
 */
router.delete('/:filename', authenticate, requireLevel(2), (req, res) => {
  try {
    const { filename } = req.params;

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件名'
      });
    }

    const filePath = path.join(uploadDir, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: '文件已删除',
      data: {
        filename: filename
      }
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败'
    });
  }
});

// Multer 错误处理中间件
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最多5个）'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段'
      });
    }
    return res.status(400).json({
      success: false,
      message: `上传错误: ${err.message}`
    });
  }

  // 文件类型错误
  if (err.message && err.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // 其他错误
  console.error('Upload middleware error:', err);
  res.status(500).json({
    success: false,
    message: '文件上传过程中发生错误'
  });
});

module.exports = router;