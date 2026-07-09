const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { exec, close } = require('../database');

const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    // 创建 users 表
    await exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        xuanjian_id INTEGER UNIQUE NOT NULL,
        username TEXT NOT NULL,
        level INTEGER DEFAULT 0,
        title TEXT,
        contribution INTEGER DEFAULT 0,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);
    console.log('✓ users 表创建成功');

    // 创建 categories 表
    await exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )
    `);
    console.log('✓ categories 表创建成功');

    // 创建 documents 表
    await exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        file_type TEXT,
        category_id INTEGER,
        author_id INTEGER NOT NULL,
        status TEXT DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        published_at DATETIME,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);
    console.log('✓ documents 表创建成功');

    // 创建 document_versions 表
    await exec(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        author_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);
    console.log('✓ document_versions 表创建成功');

    // 创建 announcements 表
    await exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        is_pinned BOOLEAN DEFAULT 0,
        publish_time DATETIME,
        status TEXT DEFAULT 'draft',
        read_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);
    console.log('✓ announcements 表创建成功');

    // 创建 announcement_reads 表
    await exec(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        announcement_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ announcement_reads 表创建成功');

    // 创建 approvals 表
    await exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        reviewer_id INTEGER,
        status TEXT DEFAULT 'pending',
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        FOREIGN KEY (document_id) REFERENCES documents(id),
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (reviewer_id) REFERENCES users(id)
      )
    `);
    console.log('✓ approvals 表创建成功');

    // 创建 notifications 表
    await exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ notifications 表创建成功');

    console.log('\n数据库初始化完成！');

  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  } finally {
    await close();
  }
};

initDatabase();