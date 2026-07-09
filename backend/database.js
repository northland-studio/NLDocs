const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'nldocs.db');

// 确保data目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;
let SQL;

// 初始化数据库
const initDatabase = async () => {
  SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  console.log('已连接到 SQLite 数据库:', dbPath);
  return db;
};

// 保存数据库到文件
const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// 封装为Promise风格，保持API兼容性
const query = async (sql, params = []) => {
  if (!db) await initDatabase();
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();
    return results;
  } catch (err) {
    throw err;
  }
};

const get = async (sql, params = []) => {
  if (!db) await initDatabase();
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  } catch (err) {
    throw err;
  }
};

const run = async (sql, params = []) => {
  if (!db) await initDatabase();
  try {
    db.run(sql, params);
    saveDatabase();
    // sql.js不直接返回lastInsertRowId，需要查询
    const row = await get('SELECT last_insert_rowid() as insertId');
    const insertId = row?.insertId || 0;
    return { id: insertId, changes: db.getRowsModified() };
  } catch (err) {
    throw err;
  }
};

const exec = async (sql) => {
  if (!db) await initDatabase();
  try {
    db.run(sql);
    saveDatabase();
    return;
  } catch (err) {
    throw err;
  }
};

const close = async () => {
  if (db) {
    saveDatabase();
    db.close();
  }
};

// 导出初始化函数和数据库方法
module.exports = {
  initDatabase,
  query,
  get,
  run,
  exec,
  close,
  getDb: () => db
};