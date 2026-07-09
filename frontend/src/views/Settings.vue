<template>
  <div class="settings-page">
    <!-- 主题设置 -->
    <div class="settings-section">
      <div class="section-header">
        <h3>
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
            <button
              @click="setTheme('light')"
              class="theme-btn"
              :class="{ active: currentTheme === 'light' }"
            >
              <SunIcon />
              明亮
            </button>
            <button
              @click="setTheme('dark')"
              class="theme-btn"
              :class="{ active: currentTheme === 'dark' }"
            >
              <MoonIcon />
              暗色
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知设置 -->
    <div class="settings-section">
      <div class="section-header">
        <h3>
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
    </div>

    <!-- 个人偏好设置 -->
    <div class="settings-section">
      <div class="section-header">
        <h3>
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
          <div class="setting-control">
            <select v-model="settings.defaultView" @change="updateSettings" class="setting-select">
              <option value="grid">网格视图</option>
              <option value="list">列表视图</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">每页显示数量</span>
            <span class="setting-desc">设置文档列表每页显示的文档数量</span>
          </div>
          <div class="setting-control">
            <select v-model="settings.pageSize" @change="updateSettings" class="setting-select">
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
              <option value="96">96</option>
            </select>
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
          <div class="setting-control">
            <select v-model="settings.language" @change="updateSettings" class="setting-select">
              <option value="zh-CN">中文</option>
              <option value="en-US">英文</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存提示 -->
    <div v-if="showSaveMessage" class="save-message">
      <CheckIcon class="save-icon" />
      设置已保存
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

/* 设置区块 */
.settings-section {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
}

.section-header {
  padding: 20px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.settings-content {
  padding: 24px;
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-light);
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
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-control {
  flex-shrink: 0;
  margin-left: 24px;
}

/* 主题按钮 */
.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
}

.theme-btn:last-child {
  margin-right: 0;
}

.theme-btn:hover {
  border-color: var(--accent);
}

.theme-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.theme-btn svg {
  width: 18px;
  height: 18px;
}

/* 开关按钮 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
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
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  border-radius: 26px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* 下拉选择框 */
.setting-select {
  padding: 8px 32px 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.setting-select:hover {
  border-color: var(--accent);
}

.setting-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
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
  background: var(--success);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease;
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
@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
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

  .setting-select {
    width: 100%;
  }

  .theme-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>