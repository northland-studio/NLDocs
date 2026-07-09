<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1>通知中心</h1>
      <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-btn">
        全部标记已读
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="notifications-container">
      <div v-if="notifications.length === 0" class="empty-state">
        <p>暂无通知</p>
      </div>

      <div v-else class="notifications-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification-item', { unread: !notification.is_read }]"
        >
          <div class="notification-icon">
            <span :class="['icon-badge', notification.type]">
              {{ getTypeIcon(notification.type) }}
            </span>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <div class="notification-actions">
            <button
              v-if="!notification.is_read"
              @click="markAsRead(notification.id)"
              class="action-btn read"
            >
              标记已读
            </button>
            <button @click="deleteNotification(notification.id)" class="action-btn delete">
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-if="pagination.total > pagination.limit" class="pagination">
        <button
          @click="loadPage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.total_pages }}</span>
        <button
          @click="loadPage(pagination.page + 1)"
          :disabled="pagination.page === pagination.total_pages"
          class="page-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { notificationsApi } from '@/api/notifications';

const notifications = ref([]);
const loading = ref(false);
const unreadCount = ref(0);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0
});

const loadNotifications = async (page = 1) => {
  try {
    loading.value = true;
    const response = await notificationsApi.getList({
      page,
      limit: pagination.value.limit
    });
    notifications.value = response.data.notifications;
    unreadCount.value = response.data.unread_count;
    pagination.value = response.data.pagination;
    loading.value = false;
  } catch (error) {
    console.error('加载通知失败:', error);
    loading.value = false;
  }
};

const markAsRead = async (id) => {
  try {
    await notificationsApi.markAsRead(id);
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.is_read = true;
      unreadCount.value--;
    }
  } catch (error) {
    console.error('标记已读失败:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await notificationsApi.markAllAsRead();
    notifications.value.forEach(n => n.is_read = true);
    unreadCount.value = 0;
  } catch (error) {
    console.error('全部标记已读失败:', error);
  }
};

const deleteNotification = async (id) => {
  try {
    await notificationsApi.delete(id);
    notifications.value = notifications.value.filter(n => n.id !== id);
    pagination.value.total--;
  } catch (error) {
    console.error('删除通知失败:', error);
  }
};

const loadPage = (page) => {
  loadNotifications(page);
};

const getTypeIcon = (type) => {
  const icons = {
    approval: '审',
    announcement: '公',
    system: '系'
  };
  return icons[type] || '通';
};

const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString();
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.mark-all-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  opacity: 0.9;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 8px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.notification-item.unread {
  background: var(--accent-light);
  border-color: var(--accent);
}

.notification-icon {
  flex-shrink: 0;
}

.icon-badge {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.icon-badge.approval {
  background: var(--warning);
  color: white;
}

.icon-badge.announcement {
  background: var(--info);
  color: white;
}

.icon-badge.system {
  background: var(--accent);
  color: white;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.notification-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.action-btn.read {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.action-btn.delete {
  background: var(--error);
  color: white;
  border-color: var(--error);
}

.action-btn:hover {
  opacity: 0.9;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>