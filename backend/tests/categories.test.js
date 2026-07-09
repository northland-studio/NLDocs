const { describe, it } = require('node:test');
const assert = require('node:assert');

// 测试目标：分类路由模块加载
describe('分类路由模块', () => {
  it('应该能正确加载categories路由模块', () => {
    const categoriesRoute = require('../routes/categories');
    assert.ok(categoriesRoute);
    assert.strictEqual(typeof categoriesRoute, 'function');
  });

  it('路由模块应该是Express Router实例', () => {
    const categoriesRoute = require('../routes/categories');
    assert.ok(typeof categoriesRoute === 'function');
    assert.ok(categoriesRoute.stack, 'Router应该有stack属性');
  });
});
