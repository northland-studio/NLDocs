const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');

// 测试目标：健康检查端点
describe('健康检查 API', () => {
  let app, server;

  before(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    server = app.listen(0);
  });

  after((done) => {
    server.close(done);
  });

  it('应返回200状态码和ok状态', async () => {
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.timestamp);
  });
});
