<template>
  <div class="settings-page">
    <header class="page-header">
      <h1 class="t-section-heading">设置</h1>
    </header>

    <!-- 主题设置 -->
    <BaseCard class="settings-section">
      <div class="section-header">
        <h3 class="section-title">
          <MoonIcon class="section-icon" />
          主题设置
        </h3>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">外观主题</span>
            <span class="setting-desc">选择明亮或暗色主题以获得最佳体验</span>
          </div>
          <div class="setting-control">
            <BaseButton
              variant="filter"
              :class="{ 'theme-active': currentTheme === 'light' }"
              @click="setTheme('light')"
            >
              <SunIcon class="control-icon" />
              明亮
            </BaseButton>
            <BaseButton
              variant="filter"
              :class="{ 'theme-active': currentTheme === 'dark' }"
              @click="setTheme('dark')"
            >
              <MoonIcon class="control-icon" />
              暗色
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 通知设置 -->
    <BaseCard class="settings-section">
      <div class="section-header">
        <h3 class="section-title">
          <NotificationIcon class="section-icon" />
          通知设置
        </h3>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">审批通知</span>
            <span class="setting-desc">当您的文档审批申请被处理时收到通知</span>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="settings.approvalNotifications"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">文档更新通知</span>
            <span class="setting-desc">当您关注的文档被更新时收到通知</span>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="settings.documentNotifications"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">公告通知</span>
            <span class="setting-desc">接收新的公告通知</span>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="settings.announcementNotifications"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 个人偏好设置 -->
    <BaseCard class="settings-section">
      <div class="section-header">
        <h3 class="section-title">
          <SettingsIcon class="section-icon" />
          个人偏好
        </h3>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">默认文档列表视图</span>
            <span class="setting-desc">选择文档列表的默认显示方式</span>
          </div>
          <div class="setting-control setting-select-wrap">
            <BaseSelect
              v-model="settings.defaultView"
              :options="viewOptions"
              @update:modelValue="updateSettings"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">每页显示数量</span>
            <span class="setting-desc">设置文档列表每页显示的文档数量</span>
          </div>
          <div class="setting-control setting-select-wrap">
            <BaseSelect
              v-model="settings.pageSize"
              :options="pageSizeOptions"
              @update:modelValue="updateSettings"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">编辑器自动保存</span>
            <span class="setting-desc">编辑文档时自动保存更改</span>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input
                type="checkbox"
                v-model="settings.autoSave"
                @change="updateSettings"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">语言设置</span>
            <span class="setting-desc">选择界面显示语言</span>
          </div>
          <div class="setting-control setting-select-wrap">
            <BaseSelect
              v-model="settings.language"
              :options="languageOptions"
              @update:modelValue="updateSettings"
            />
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 保存提示 -->
    <div v-if="showSaveMessage" class="save-message">
      <CheckIcon class="save-icon" />
      设置已保存
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import MoonIcon from '@/assets/icons/MoonIcon.vue';
import SunIcon from '@/assets/icons/SunIcon.vue';
import NotificationIcon from '@/assets/icons/NotificationIcon.vue';
import SettingsIcon from '@/assets/icons/SettingsIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';

// 当前主题
const currentTheme = computed(() => {
  return document.documentElement.getAttribute('data-theme') || 'light';
});

// 设置数据
const settings = ref({
  approvalNotifications: true,
  documentNotifications: true,
  announcementNotifications: true,
  defaultView: 'grid',
  pageSize: '12',
  autoSave: true,
  language: 'zh-CN'
});

const showSaveMessage = ref(false);

// BaseSelect 选项
const viewOptions = computed(() => [
  { value: 'grid', label: '网格视图' },
  { value: 'list', label: '列表视图' }
]);

const pageSizeOptions = computed(() => [
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' },
  { value: '96', label: '96' }
]);

const languageOptions = computed(() => [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: '英文' }
]);

// 设置主题
const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// 更新设置
const updateSettings = () => {
  localStorage.setItem('userSettings', JSON.stringify(settings.value));
  showSaveMessage.value = true;
  setTimeout(() => {
    showSaveMessage.value = false;
  }, 2000);
};

// 加载设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings);
  }
};

// 初始化
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-header .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

/* 设置区块 - BaseCard */
.settings-section {
  margin-bottom: 20px;
  padding: 0;
  overflow: hidden;
}

.section-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
}

.section-icon {
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}

.settings-content {
  padding: 8px 24px;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-family: var(--font-text);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.224px;
  color: var(--color-text-primary);
}

.setting-desc {
  font-family: var(--font-text);
  font-size: 13px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
}

.setting-control {
  flex-shrink: 0;
  margin-left: 24px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.setting-select-wrap {
  min-width: 180px;
}

.control-icon {
  width: 18px;
  height: 18px;
}

/* 主题按钮激活态 */
.theme-active {
  background: var(--color-accent) !important;
  color: #ffffff !important;
  border-color: transparent !important;
}

/* 开关按钮 - Apple 风格 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-pill);
  transition: background 0.2s ease;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 27px;
  width: 27px;
  left: 2px;
  bottom: 2px;
  background: #ffffff;
  border-radius: var(--radius-circle);
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-accent);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* 保存提示 */
.save-message {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-success);
  color: #ffffff;
  border-radius: var(--radius-standard);
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.224px;
  box-shadow: var(--shadow-card);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.save-icon {
  width: 20px;
  height: 20px;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .settings-page {
    padding: 24px 16px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-control {
    margin-left: 0;
    width: 100%;
  }

  .setting-select-wrap {
    width: 100%;
  }

  .setting-control .base-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
