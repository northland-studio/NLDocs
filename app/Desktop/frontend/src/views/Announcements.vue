<template>
  <div class="announcements-page">
    <!-- 页面标题 + 操作 -->
    <header class="page-header">
      <h1 class="t-section-heading">公告</h1>
      <BaseButton v-if="canCreate" variant="primary" @click="createNew">
        <PlusIcon class="btn-icon" />
        新建公告
      </BaseButton>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 空状态 -->
    <div v-else-if="announcements.length === 0" class="empty-state">
      <AnnouncementIcon class="empty-icon" />
      <p>暂无公告</p>
    </div>

    <!-- 公告网格 - 每行2列 -->
    <div v-else class="announcement-grid">
      <BaseCard
        v-for="ann in announcements"
        :key="ann.id"
        class="announcement-card"
        elevated
        @click="viewAnnouncement(ann.id)"
      >
        <div class="card-header">
          <h3 class="card-title">{{ ann.title }}</h3>
          <span v-if="ann.isPinned" class="pin-badge">置顶</span>
        </div>

        <p class="card-content">
          {{ getContentPreview(ann.content) }}
        </p>

        <div class="card-footer">
          <span v-if="ann.author?.name" class="meta-item">
            {{ ann.author.name }}
          </span>
          <span class="meta-time">{{ formatDate(ann.createdAt) }}</span>
        </div>
      </BaseCard>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <BaseButton variant="filter" :disabled="currentPage === 1" @click="prevPage">
        上一页
      </BaseButton>
      <div class="page-info">
        <span class="current-page">{{ currentPage }}</span>
        <span class="page-divider">/</span>
        <span class="total-pages">{{ totalPages }}</span>
      </div>
      <BaseButton variant="filter" :disabled="currentPage >= totalPages" @click="nextPage">
        下一页
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { announcementApi } from '@/api/announcements';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import AnnouncementIcon from '@/assets/icons/AnnouncementIcon.vue';

const router = useRouter();

// 状态
const announcements = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const pageSize = 10;

// 用户权限
const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});

const canCreate = computed(() => (user.value.level || 0) >= 1);

// 获取内容预览
const getContentPreview = (content) => {
  if (!content) return '暂无内容';
  const stripped = content.replace(/<[^>]+>/g, '').replace(/[#*`_~\[\]]/g, '');
  return stripped.substring(0, 150) + (stripped.length > 150 ? '...' : '');
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
};

// 获取公告列表
const fetchAnnouncements = async () => {
  loading.value = true;
  try {
    const response = await announcementApi.getList({
      page: currentPage.value,
      limit: pageSize
    });

    // 兼容多种响应结构
    const data = response.data;
    if (Array.isArray(data)) {
      announcements.value = data;
      total.value = data.length;
      totalPages.value = 1;
    } else if (data.data && Array.isArray(data.data)) {
      announcements.value = data.data;
      total.value = data.total || data.data.length;
      totalPages.value = data.totalPages || Math.ceil((data.total || data.data.length) / pageSize) || 1;
    } else if (data.list) {
      announcements.value = data.list;
      total.value = data.total || data.list.length;
      totalPages.value = data.totalPages || 1;
    } else {
      announcements.value = [];
      total.value = 0;
      totalPages.value = 1;
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
    announcements.value = [];
  } finally {
    loading.value = false;
  }
};

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchAnnouncements();
    window.scrollTo(0, 0);
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchAnnouncements();
    window.scrollTo(0, 0);
  }
};

// 查看公告详情
const viewAnnouncement = (id) => {
  router.push(`/announcements/${id}`);
};

// 新建公告
const createNew = () => {
  router.push('/announcements/new');
};

// 初始化
onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
.announcements-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面标题 */
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

.btn-icon {
  width: 18px;
  height: 18px;
}

/* 加载和空状态 */
.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 17px;
  letter-spacing: -0.374px;
}

/* 公告网格 - 每行2列 */
.announcement-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

/* 公告卡片 */
.announcement-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  min-height: 180px;
}

.announcement-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pin-badge {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: #ffffff;
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.12px;
  white-space: nowrap;
}

.card-content {
  flex: 1;
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.43;
  letter-spacing: -0.224px;
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.meta-item {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
}

.meta-time {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-tertiary);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
  color: var(--color-text-secondary);
}

.current-page {
  font-weight: 600;
  color: var(--color-accent);
  font-size: 16px;
}

.page-divider {
  color: var(--color-text-tertiary);
}

.total-pages {
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 640px) {
  .announcements-page {
    padding: 24px 16px;
  }

  .announcement-grid {
    grid-template-columns: 1fr;
  }
}
</style>
