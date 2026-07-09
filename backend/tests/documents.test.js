const { describe, it } = require('node:test');
const assert = require('node:assert');

// 测试目标：文档路由模块加载
describe('文档路由模块', () => {
  it('应该能正确加载documents路由模块', () => {
    const documentsRoute = require('../routes/documents');
    assert.ok(documentsRoute);
    assert.strictEqual(typeof documentsRoute, 'function');
  });

  it('路由模块应该是Express Router实例', () => {
    const documentsRoute = require('../routes/documents');
    assert.ok(typeof documentsRoute === 'function');
    assert.ok(documentsRoute.stack, 'Router应该有stack属性');
  });
});
