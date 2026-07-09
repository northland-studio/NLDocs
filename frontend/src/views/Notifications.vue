<template>
  <div class="notifications-page">
    <div class="page-header">
      <h1 class="t-section-heading">通知中心</h1>
      <BaseButton v-if="unreadCount > 0" variant="primary" @click="markAllAsRead">
        全部标记已读
      </BaseButton>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="notifications-container">
      <div v-if="notifications.length === 0" class="empty-state">
        <p>暂无通知</p>
      </div>

      <div v-else class="notifications-list">
        <BaseCard
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
            <BaseButton
              v-if="!notification.is_read"
              variant="filter"
              @click="markAsRead(notification.id)"
            >
              标记已读
            </BaseButton>
            <BaseButton variant="dark" @click="deleteNotification(notification.id)">
              删除
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-if="pagination.total > pagination.limit" class="pagination">
        <BaseButton
          variant="filter"
          :disabled="pagination.page === 1"
          @click="loadPage(pagination.page - 1)"
        >
          上一页
        </BaseButton>
        <span class="page-info">{{ pagination.page }} / {{ pagination.total_pages }}</span>
        <BaseButton
          variant="filter"
          :disabled="pagination.page === pagination.total_pages"
          @click="loadPage(pagination.page + 1)"
        >
          下一页
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { notificationsApi } from '@/api/notifications';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';

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
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-large);
  font-family: var(--font-text);
  font-size: 17px;
  letter-spacing: -0.374px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 通知项 - BaseCard 包裹 */
.notification-item {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  transition: background 0.15s ease;
}

/* 未读通知用 Apple Blue 浅色背景 */
.notification-item.unread {
  background: rgba(0, 113, 227, 0.08);
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
  border-radius: var(--radius-standard);
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.224px;
  color: #ffffff;
}

/* 通知类型图标徽章用 Apple Blue/状态色 */
.icon-badge.approval {
  background: var(--color-warning);
}

.icon-badge.announcement {
  background: var(--color-info);
}

.icon-badge.system {
  background: var(--color-accent);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.374px;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.notification-text {
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.43;
  letter-spacing: -0.224px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.notification-time {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-tertiary);
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 32px;
}

.page-info {
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
}

/* 响应式 */
@media (max-width: 640px) {
  .notifications-page {
    padding: 24px 16px;
  }

  .notification-item {
    flex-direction: column;
    gap: 12px;
  }

  .notification-actions {
    width: 100%;
  }

  .notification-actions .base-btn {
    flex: 1;
  }
}
</style>
