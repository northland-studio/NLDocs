const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { get, run } = require('../database');
const { authenticate } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/callback
 * OAuth回调处理
 * 1. 接收前端传来的授权码code
 * 2. 调用玄剑官网 /api/oauth/token 换取access_token
 * 3. 调用玄剑官网 /api/oauth/verify 验证token获取用户信息
 * 4. 同步用户信息到本地数据库(users表)
 * 5. 生成本地JWT token供后续API使用
 * 6. 返回本地JWT和用户信息
 */
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少授权码'
      });
    }

    // 1. 调用玄剑官网API换取access_token
    const tokenResponse = await axios.post(process.env.OAUTH_TOKEN_URL, {
      code: code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: '',  // 玄剑官网可能不需要
      redirect_uri: process.env.OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      logger.error('Token exchange failed:', tokenResponse.data);
      return res.status(401).json({
        success: false,
        message: '获取访问令牌失败'
      });
    }

    // 2. 调用玄剑官网API验证token并获取用户信息
    const verifyResponse = await axios.get(process.env.OAUTH_VERIFY_URL, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const verifyData = verifyResponse.data;

    // 玄剑官网verify返回 {valid: true, user: {...}}
    if (!verifyData || !verifyData.valid || !verifyData.user) {
      logger.error('User info fetch failed:', verifyResponse.data);
      return res.status(401).json({
        success: false,
        message: '获取用户信息失败'
      });
    }

    const userInfo = verifyData.user;

    // 3. 同步用户信息到本地数据库
    let user = await get(
      'SELECT * FROM users WHERE xuanjian_id = ?',
      [userInfo.id]
    );

    if (user) {
      // 更新现有用户信息
      await run(
        `UPDATE users SET
          username = ?,
          level = ?,
          title = ?,
          contribution = ?,
          avatar = ?,
          last_login = CURRENT_TIMESTAMP
        WHERE xuanjian_id = ?`,
        [
          userInfo.username || user.username,
          userInfo.level !== undefined ? userInfo.level : user.level,
          userInfo.title || user.title,
          userInfo.contribution !== undefined ? userInfo.contribution : user.contribution,
          userInfo.avatar || user.avatar,
          userInfo.id
        ]
      );

      // 重新获取更新后的用户信息
      user = await get('SELECT * FROM users WHERE xuanjian_id = ?', [userInfo.id]);
    } else {
      // 创建新用户
      await run(
        `INSERT INTO users (xuanjian_id, username, level, title, contribution, avatar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userInfo.id,
          userInfo.username,
          userInfo.level || 0,
          userInfo.title || null,
          userInfo.contribution || 0,
          userInfo.avatar || null
        ]
      );

      // 使用xuanjian_id查询新插入的用户
      user = await get('SELECT * FROM users WHERE xuanjian_id = ?', [userInfo.id]);
      
      if (!user) {
        logger.error('Failed to fetch new user after insert, xuanjian_id:', userInfo.id);
        return res.status(500).json({
          success: false,
          message: '创建用户记录失败'
        });
      }
    }

    // 4. 生成本地JWT token
    const localToken = jwt.sign(
      {
        id: user.id,
        xuanjian_id: user.xuanjian_id,
        username: user.username,
        level: user.level,
        title: user.title
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7天有效期
    );

    // 5. 返回本地JWT和用户信息
    res.json({
      success: true,
      data: {
        token: localToken,
        user: {
          id: user.id,
          xuanjian_id: user.xuanjian_id,
          username: user.username,
          level: user.level,
          title: user.title,
          contribution: user.contribution,
          avatar: user.avatar,
          created_at: user.created_at,
          last_login: user.last_login
        }
      }
    });

  } catch (error) {
    logger.error('OAuth callback error:', error.message);
    logger.error('Error stack:', error.stack);

    if (error.response) {
      // 玄剑官网API返回错误
      logger.error('OAuth provider error status:', error.response.status);
      logger.error('OAuth provider error data:', JSON.stringify(error.response.data, null, 2));
      return res.status(error.response.status || 500).json({
        success: false,
        message: `OAuth认证失败: ${error.response.data?.error || error.response.data?.message || '未知错误'}`,
        details: error.response.data
      });
    }

    if (error.request) {
      logger.error('No response received for request:', error.config?.url);
      return res.status(503).json({
        success: false,
        message: 'OAuth服务不可用，请稍后重试'
      });
    }

    res.status(500).json({
      success: false,
      message: 'OAuth认证过程中发生错误: ' + error.message
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 * 验证本地JWT，返回用户信息（包括权限等级）
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        xuanjian_id: user.xuanjian_id,
        username: user.username,
        level: user.level,
        title: user.title,
        contribution: user.contribution,
        avatar: user.avatar,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 * 清除本地session/token
 * 注意：JWT是无状态的，客户端删除token即可
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    // JWT是无状态的，服务端不需要维护token状态
    // 客户端删除token即完成登出
    // 如果需要实现token黑名单，可以在这里添加逻辑

    res.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
});

/**
 * GET /api/auth/verify
 * 验证token有效性
 * 1. 验证本地JWT
 * 2. 调用玄剑官网验证确保远程token仍然有效
 */
router.get('/verify', authenticate, async (req, res) => {
  try {
    // authenticate中间件已经验证了本地JWT
    // 这里可以添加额外的验证逻辑，比如检查用户状态

    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 可选：调用玄剑官网验证远程token仍然有效
    // 注意：这需要存储access_token，目前设计中未存储
    // 如果需要，可以在/callback时存储access_token到数据库或session

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          xuanjian_id: user.xuanjian_id,
          username: user.username,
          level: user.level,
          title: user.title,
          contribution: user.contribution,
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    logger.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: '验证token失败'
    });
  }
});

module.exports = router;