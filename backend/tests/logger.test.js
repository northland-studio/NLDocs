const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

// 测试目标：日志系统
describe('日志系统', () => {
  it('logger 应该导出四个分级方法', () => {
    const logger = require('../utils/logger');
    assert.strictEqual(typeof logger.debug, 'function');
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.warn, 'function');
    assert.strictEqual(typeof logger.error, 'function');
  });

  it('logger.error 应该能记录错误对象', () => {
    const logger = require('../utils/logger');
    assert.doesNotThrow(() => {
      logger.error('测试错误', new Error('test error'));
    });
  });

  it('logger.info 应该能记录字符串', () => {
    const logger = require('../utils/logger');
    assert.doesNotThrow(() => {
      logger.info('测试信息');
    });
  });
});
