const { describe, it } = require('node:test');
const assert = require('node:assert');

// 测试目标：通知路由模块加载
describe('通知路由模块', () => {
  it('应该能正确加载notifications路由模块', () => {
    const notificationsRoute = require('../routes/notifications');
    assert.ok(notificationsRoute);
    assert.strictEqual(typeof notificationsRoute, 'function');
  });

  it('路由模块应该是Express Router实例', () => {
    const notificationsRoute = require('../routes/notifications');
    assert.ok(typeof notificationsRoute === 'function');
    assert.ok(notificationsRoute.stack, 'Router应该有stack属性');
  });
});
