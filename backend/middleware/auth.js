const jwt = require('jsonwebtoken');

/**
 * 权限等级定义：
 * - Level 0: 普通成员 - 查看已发布文档、查看公告、提交文档申请
 * - Level 1: 管理员 - 发布/编辑文档、发布公告、审核普通成员申请
 * - Level 2: 超级管理员 - 全站管理、用户管理、系统配置
 * - Level 3: 文档管理员 - 专门管理文档分类和归档
 */

/**
 * 验证JWT Token中间件
 * 从请求头获取Authorization Bearer token
 * 使用jsonwebtoken验证本地JWT
 * 将用户信息附加到req.user
 * 验证失败返回401
 */
const authenticate = (req, res, next) => {
  try {
    // 从请求头获取 Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    // 提取 Bearer token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式错误'
      });
    }

    // 验证 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息附加到 req.user
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      level: decoded.level || 0, // 默认为普通成员
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

/**
 * 权限等级验证函数
 * 返回一个中间件函数
 * 检查req.user.level是否 >= minLevel
 * 权限不足返回403 Forbidden
 * @param {number} minLevel - 最低权限等级要求
 * @returns {Function} 中间件函数
 */
const requireLevel = (minLevel) => {
  return (req, res, next) => {
    // 确保用户已经通过 authenticate 中间件验证
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证，请先登录'
      });
    }

    // 检查权限等级
    const userLevel = req.user.level || 0;

    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        required: minLevel,
        current: userLevel
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireLevel
};