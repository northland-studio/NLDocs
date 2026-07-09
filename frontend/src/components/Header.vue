<template>
  <header class="header">
    <button class="toggle-btn" @click="$emit('toggle-sidebar')" aria-label="切换侧边栏">
      <MenuIcon />
    </button>
    <div class="header-title">
      <h1>{{ title }}</h1>
    </div>
    <div class="header-actions">
      <button class="action-btn" @click="goToNotifications" aria-label="通知">
        <NotificationIcon :size="20" />
        <span v-if="unreadCount > 0" class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      <ThemeSwitch />
      <div class="user-info" v-if="user && user.username">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          :alt="user.username"
          class="user-avatar"
        />
        <span class="user-name">{{ user.username }}</span>
        <button @click="handleLogout" class="logout-btn" aria-label="退出登录">
          <LogoutIcon />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import ThemeSwitch from './ThemeSwitch.vue';
import MenuIcon from '@/assets/icons/MenuIcon.vue';
import LogoutIcon from '@/assets/icons/LogoutIcon.vue';
import NotificationIcon from '@/assets/icons/NotificationIcon.vue';
import { notificationsApi } from '@/api/notifications';

defineEmits(['toggle-sidebar']);
const router = useRouter();
const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'));
const title = computed(() => 'NLDocs');
const unreadCount = ref(0);

const loadUnreadCount = async () => {
  try {
    const response = await notificationsApi.getUnreadCount();
    unreadCount.value = response.data.count;
  } catch (error) {
    console.error('加载未读数量失败:', error);
  }
};

const goToNotifications = () => {
  router.push('/notifications');
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
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
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--nav-bg);
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: var(--nav-height);
  position: sticky;
  top: 0;
  z-index: 90;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #ffffff;
  border-radius: var(--radius-standard);
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toggle-btn svg {
  width: 20px;
  height: 20px;
}

.header-title {
  flex: 1;
  margin-left: 16px;
}

.header-title h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.374px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #ffffff;
  border-radius: var(--radius-standard);
  transition: background-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--color-accent);
  color: white;
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-text);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-pill);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  object-fit: cover;
}

.user-name {
  color: #ffffff;
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: -0.12px;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-standard);
  transition: background-color 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.logout-btn svg {
  width: 16px;
  height: 16px;
}
</style>