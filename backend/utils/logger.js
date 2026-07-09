const fs = require('fs');
const path = require('path');

// 日志级别配置：名称、控制台颜色、优先级
const LEVELS = {
  debug: { name: 'DEBUG', color: '\x1b[90m', priority: 10 },
  info: { name: 'INFO', color: '\x1b[34m', priority: 20 },
  warn: { name: 'WARN', color: '\x1b[33m', priority: 30 },
  error: { name: 'ERROR', color: '\x1b[31m', priority: 40 }
};

const RESET = '\x1b[0m';
const MAX_LOG_DAYS = 14;

// 日志目录与日期跟踪
const logsDir = path.join(__dirname, '..', 'logs');
let currentDate = '';
let lastCleanupDate = '';

// 确保日志目录存在（自动创建）
fs.mkdirSync(logsDir, { recursive: true });

/**
 * 将日期对象格式化为 YYYY-MM-DD HH:mm:ss
 */
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 将日期对象格式化为 YYYY-MM-DD（用于日志文件名）
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 根据日期字符串获取日志文件路径
 */
function getLogFilePath(dateStr) {
  return path.join(logsDir, `app-${dateStr}.log`);
}

/**
 * 删除超过 MAX_LOG_DAYS 天的日志文件
 * 每天最多执行一次清理
 */
function cleanupOldLogs() {
  const today = new Date();
  const todayStr = formatDate(today);
  if (lastCleanupDate === todayStr) {
    return;
  }
  lastCleanupDate = todayStr;

  try {
    const files = fs.readdirSync(logsDir);
    for (const file of files) {
      // 匹配日志文件：app-YYYY-MM-DD.log
      const match = file.match(/^app-(\d{4})-(\d{2})-(\d{2})\.log$/);
      if (!match) continue;

      const fileDateStr = `${match[1]}-${match[2]}-${match[3]}`;
      const fileDate = new Date(fileDateStr + 'T00:00:00');
      const diffMs = today.getTime() - fileDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > MAX_LOG_DAYS) {
        try {
          fs.unlinkSync(path.join(logsDir, file));
        } catch (err) {
          // 忽略单个文件删除错误
        }
      }
    }
  } catch (err) {
    // 忽略清理过程中的错误
  }
}

/**
 * 将参数转换为字符串
 * error 级别遇到 Error 对象时记录完整堆栈
 */
function formatArg(arg, level) {
  if (arg instanceof Error) {
    return level === 'error' ? (arg.stack || arg.message) : arg.message;
  }
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }
  return String(arg);
}

/**
 * 写入一条日志
 */
function log(level, ...args) {
  const config = LEVELS[level];
  if (!config) return;

  const now = new Date();
  const timestamp = formatTimestamp(now);
  const dateStr = formatDate(now);

  const message = args.map(arg => formatArg(arg, level)).join(' ');
  const logLine = `[${timestamp}] [${config.name}] ${message}`;

  // 控制台输出（带颜色）
  const consoleMethod = level === 'debug' || level === 'info' ? 'log' : level;
  console[consoleMethod](config.color + logLine + RESET);

  // 写入文件（不含颜色码）
  try {
    fs.appendFileSync(getLogFilePath(dateStr), logLine + '\n');
  } catch (err) {
    console.error('Failed to write log file:', err.message);
  }

  // 日期变更时执行清理
  if (currentDate !== dateStr) {
    currentDate = dateStr;
    cleanupOldLogs();
  }
}

// 启动时执行一次清理
cleanupOldLogs();

module.exports = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args)
};
