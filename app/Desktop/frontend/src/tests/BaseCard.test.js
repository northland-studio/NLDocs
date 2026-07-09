import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseCard from '@/components/BaseCard.vue';

describe('BaseCard', () => {
  it('应该正确渲染卡片内容', () => {
    const wrapper = mount(BaseCard, {
      slots: { default: '卡片内容' }
    });
    expect(wrapper.classes()).toContain('base-card');
    expect(wrapper.text()).toBe('卡片内容');
  });

  it('elevated属性应该添加elevated类', () => {
    const wrapper = mount(BaseCard, {
      props: { elevated: true },
      slots: { default: '悬浮卡片' }
    });
    expect(wrapper.classes()).toContain('base-card--elevated');
  });

  it('默认不应该有elevated类', () => {
    const wrapper = mount(BaseCard, {
      slots: { default: '普通卡片' }
    });
    expect(wrapper.classes()).not.toContain('base-card--elevated');
  });
});
