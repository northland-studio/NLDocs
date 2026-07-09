const logger = require('../utils/logger');

/**
 * 请求日志中间件
 * 记录每个请求的方法、路径、状态码、响应时间
 * - 4xx 使用 warn 级别
 * - 5xx 使用 error 级别
 * - 跳过健康检查端点 /health 和静态文件 /uploads
 */
function requestLogger(req, res, next) {
  // 跳过健康检查和静态文件
  if (req.path === '/health' || req.path.startsWith('/uploads')) {
    return next();
  }

  const startTime = process.hrtime.bigint();

  // 响应结束时记录日志
  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs) / 1e6;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const message = `${method} ${url} ${statusCode} ${Math.round(durationMs)}ms`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
}

module.exports = requestLogger;
