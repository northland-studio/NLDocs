<template>
  <aside :class="['sidebar', { collapsed }]">
    <div class="logo">
      <img src="@/assets/icon.png" alt="NLDocs" class="logo-img" v-if="!collapsed" />
      <DocumentIcon v-else />
      <span v-if="!collapsed" class="logo-text">北域文档</span>
    </div>
    <nav class="nav-menu">
      <router-link to="/" class="nav-item">
        <HomeIcon />
        <span v-if="!collapsed" class="nav-label">首页</span>
      </router-link>
      <router-link to="/documents" class="nav-item">
        <DocumentIcon />
        <span v-if="!collapsed" class="nav-label">文档</span>
      </router-link>
      <router-link to="/announcements" class="nav-item">
        <AnnouncementIcon />
        <span v-if="!collapsed" class="nav-label">公告</span>
      </router-link>
      <router-link to="/approvals" class="nav-item" v-if="user?.level >= 1">
        <ApprovalIcon />
        <span v-if="!collapsed" class="nav-label">审批</span>
      </router-link>
      <router-link to="/notifications" class="nav-item">
        <NotificationIcon />
        <span v-if="!collapsed" class="nav-label">通知</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </router-link>
    </nav>
    <div class="nav-footer">
      <router-link to="/settings" class="nav-item">
        <SettingsIcon />
        <span v-if="!collapsed" class="nav-label">设置</span>
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import HomeIcon from '@/assets/icons/HomeIcon.vue';
import DocumentIcon from '@/assets/icons/DocumentIcon.vue';
import AnnouncementIcon from '@/assets/icons/AnnouncementIcon.vue';
import ApprovalIcon from '@/assets/icons/ApprovalIcon.vue';
import NotificationIcon from '@/assets/icons/NotificationIcon.vue';
import SettingsIcon from '@/assets/icons/SettingsIcon.vue';
import { notificationsApi } from '@/api/notifications';

defineProps(['collapsed']);
const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'));
const unreadCount = ref(0);

const loadUnreadCount = async () => {
  try {
    const response = await notificationsApi.getUnreadCount();
    unreadCount.value = response.data.count;
  } catch (error) {
    console.error('加载未读数量失败:', error);
  }
};

let interval;
onMounted(() => {
  loadUnreadCount();
  interval = setInterval(loadUnreadCount, 60000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--nav-bg);
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: var(--nav-height);
  box-sizing: border-box;
}

.logo-img {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-standard);
  flex-shrink: 0;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.374px;
}

.nav-menu {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #ffffff;
  text-decoration: none;
  border-radius: var(--radius-standard);
  transition: background-color 0.15s ease;
  position: relative;
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 400;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  background: var(--color-accent);
  color: #ffffff;
}

.nav-label {
  font-size: 14px;
  letter-spacing: -0.224px;
}

.nav-item svg {
  flex-shrink: 0;
}

.badge {
  position: absolute;
  right: 8px;
  background: var(--color-accent);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  min-width: 18px;
  text-align: center;
}

.nav-footer {
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>