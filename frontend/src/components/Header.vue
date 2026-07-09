<template>
  <header class="header">
    <button class="toggle-btn" @click="$emit('toggle-sidebar')">
      <MenuIcon />
    </button>
    <div class="header-title">
      <h1>{{ title }}</h1>
    </div>
    <div class="header-actions">
      <button class="notification-btn" @click="goToNotifications">
        <NotificationIcon :size="20" />
        <span v-if="unreadCount > 0" class="notification-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
      <ThemeSwitch />
      <div class="user-info" v-if="user">
        <span>{{ user.username }}</span>
        <button @click="handleLogout" class="logout-btn">
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
  // 每分钟刷新未读数量
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
  padding: 16px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--text-primary);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: var(--bg-hover);
}

.toggle-btn svg {
  width: 24px;
  height: 24px;
}

.header-title {
  flex: 1;
  margin-left: 16px;
}

.header-title h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--text-primary);
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  background: var(--bg-hover);
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--error);
  color: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.user-info span {
  color: var(--text-primary);
  font-size: 14px;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-secondary);
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: var(--bg-hover);
  color: var(--error-color, #ef4444);
}

.logout-btn svg {
  width: 20px;
  height: 20px;
}
</style>