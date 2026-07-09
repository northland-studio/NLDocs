<template>
  <aside :class="['sidebar', { collapsed }]">
    <div class="logo">
      <DocumentIcon />
      <span v-if="!collapsed">NLDocs</span>
    </div>
    <nav class="nav-menu">
      <router-link to="/" class="nav-item">
        <HomeIcon />
        <span v-if="!collapsed">首页</span>
      </router-link>
      <router-link to="/documents" class="nav-item">
        <DocumentIcon />
        <span v-if="!collapsed">文档</span>
      </router-link>
      <router-link to="/announcements" class="nav-item">
        <AnnouncementIcon />
        <span v-if="!collapsed">公告</span>
      </router-link>
      <router-link to="/approvals" class="nav-item" v-if="user?.level >= 1">
        <ApprovalIcon />
        <span v-if="!collapsed">审批</span>
      </router-link>
      <router-link to="/notifications" class="nav-item">
        <NotificationIcon />
        <span v-if="!collapsed">通知</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </router-link>
    </nav>
    <div class="nav-footer">
      <router-link to="/settings" class="nav-item">
        <SettingsIcon />
        <span v-if="!collapsed">设置</span>
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
  // 每分钟刷新未读数量
  interval = setInterval(loadUnreadCount, 60000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo svg {
  flex-shrink: 0;
}

.nav-menu {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.router-link-active {
  background: var(--primary-color);
  color: white;
}

.nav-item svg {
  flex-shrink: 0;
}

.badge {
  position: absolute;
  right: 8px;
  background: var(--error-color, #ef4444);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.nav-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
}
</style>