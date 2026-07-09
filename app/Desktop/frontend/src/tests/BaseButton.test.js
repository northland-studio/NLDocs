import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '@/components/BaseButton.vue';

describe('BaseButton', () => {
  it('应该正确渲染默认primary变体', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: '点击我' }
    });
    expect(wrapper.classes()).toContain('base-btn--primary');
    expect(wrapper.text()).toBe('点击我');
  });

  it('应该支持dark变体', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'dark' },
      slots: { default: '深色按钮' }
    });
    expect(wrapper.classes()).toContain('base-btn--dark');
  });

  it('应该支持pill变体', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'pill' },
      slots: { default: '了解更多' }
    });
    expect(wrapper.classes()).toContain('base-btn--pill');
  });

  it('disabled状态应该禁用按钮', () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: '禁用' }
    });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('点击应该触发click事件', async () => {
    const wrapper = mount(BaseButton, {
      slots: { default: '点击' }
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('block属性应该添加block类', () => {
    const wrapper = mount(BaseButton, {
      props: { block: true },
      slots: { default: '全宽' }
    });
    expect(wrapper.classes()).toContain('base-btn--block');
  });
});
