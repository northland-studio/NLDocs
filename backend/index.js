const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const approvalRoutes = require('./routes/approvals');
const announcementRoutes = require('./routes/announcements');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/approvals', approvalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`NLDocs Backend服务器已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});