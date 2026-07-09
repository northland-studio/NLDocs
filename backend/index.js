const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const approvalRoutes = require('./routes/approvals');
const announcementRoutes = require('./routes/announcements');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 上传文件访问
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NLDocs Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动时检查数据库
const initDatabaseCheck = async () => {
  try {
    console.log('正在检查数据库...');
    // 检查 users 表是否存在
    const tableCheck = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );

    if (!tableCheck) {
      console.error('❌ 数据库表不存在，请先运行: npm run init-db');
      process.exit(1);
    }

    console.log('✓ 数据库检查通过');
    return true;
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
    process.exit(1);
  }
};

// 启动服务器
const startServer = async () => {
  await initDatabaseCheck();

  app.listen(PORT, () => {
    console.log(`NLDocs Backend服务器已启动`);
    console.log(`端口: ${PORT}`);
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();