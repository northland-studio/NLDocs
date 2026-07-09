<template>
  <div class="announcement-detail-page">
    <div v-if="loading" class="loading-state">
      加载中...
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="goBack" class="btn-secondary">返回列表</button>
    </div>

    <article v-else class="announcement-content">
      <header class="announcement-header">
        <button @click="goBack" class="back-btn">
          ← 返回列表
        </button>
        <div class="header-actions">
          <span v-if="!announcement.isRead" class="unread-badge">未读</span>
          <span v-if="announcement.isPinned" class="pin-badge">置顶</span>
          <button v-if="isAdmin" @click="editAnnouncement" class="btn-edit">
            <EditIcon :size="18" />
            编辑
          </button>
        </div>
      </header>

      <h1 class="announcement-title">{{ announcement.title }}</h1>

      <div class="announcement-meta">
        <div class="meta-item">
          <UserIcon :size="16" />
          <span>{{ announcement.author?.name || '未知作者' }}</span>
        </div>
        <span class="separator">·</span>
        <div class="meta-item">
          <span>发布于 {{ formatDateTime(announcement.createdAt) }}</span>
        </div>
        <span class="separator">·</span>
        <div class="meta-item">
          <span>{{ announcement.views || 0 }} 次阅读</span>
        </div>
      </div>

      <div class="announcement-body" v-html="renderedContent"></div>

      <footer v-if="announcement.updatedAt && announcement.updatedAt !== announcement.createdAt" class="announcement-footer">
        <p>最后更新于 {{ formatDateTime(announcement.updatedAt) }}</p>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { announcementApi } from '@/api/announcements';
import EditIcon from '@/assets/icons/EditIcon.vue';
import UserIcon from '@/assets/icons/UserIcon.vue';

const router = useRouter();
const route = useRoute();

const announcement = ref({});
const loading = ref(true);
const error = ref('');

const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});

const isAdmin = computed(() => user.value?.level >= 1);

const renderedContent = computed(() => {
  if (!announcement.value.content) return '';
  return marked(announcement.value.content);
});

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchAnnouncement = async () => {
  const id = route.params.id;
  if (!id) {
    error.value = '公告ID不存在';
    loading.value = false;
    return;
  }

  try {
    const response = await announcementApi.getDetail(id);
    announcement.value = response.data;

    // 标记为已读
    if (!announcement.value.isRead) {
      await announcementApi.markAsRead(id);
    }
  } catch (err) {
    console.error('获取公告详情失败:', err);
    error.value = err.response?.data?.message || '加载公告失败';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/announcements');
};

const editAnnouncement = () => {
  router.push(`/announcements/${announcement.value.id}/edit`);
};

onMounted(() => {
  fetchAnnouncement();
});
</script>

<style scoped>
.announcement-detail-page {
  max-width: 900px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.error-state {
  gap: 16px;
}

.announcement-content {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 32px;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--accent-hover);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unread-badge {
  padding: 4px 10px;
  background: var(--error);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.pin-badge {
  padding: 4px 10px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.btn-edit {
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
}

.btn-edit:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}

.btn-secondary {
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.announcement-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.announcement-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.separator {
  color: var(--border);
}

.announcement-body {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
}

.announcement-body :deep(h1),
.announcement-body :deep(h2),
.announcement-body :deep(h3),
.announcement-body :deep(h4),
.announcement-body :deep(h5),
.announcement-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.announcement-body :deep(h1) { font-size: 28px; }
.announcement-body :deep(h2) { font-size: 24px; }
.announcement-body :deep(h3) { font-size: 20px; }
.announcement-body :deep(h4) { font-size: 18px; }

.announcement-body :deep(p) {
  margin: 0 0 16px 0;
}

.announcement-body :deep(ul),
.announcement-body :deep(ol) {
  margin: 0 0 16px 0;
  padding-left: 24px;
}

.announcement-body :deep(li) {
  margin-bottom: 8px;
}

.announcement-body :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 4px solid var(--accent);
  background: var(--bg-secondary);
  border-radius: 4px;
}

.announcement-body :deep(code) {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}

.announcement-body :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow-x: auto;
}

.announcement-body :deep(pre code) {
  padding: 0;
  background: transparent;
}

.announcement-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.announcement-body :deep(a:hover) {
  border-bottom-color: var(--accent);
}

.announcement-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.announcement-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}

.announcement-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-tertiary);
}

.announcement-footer p {
  margin: 0;
}
</style>