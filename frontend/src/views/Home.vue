<template>
  <div class="home-page">
    <!-- 英雄区 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="t-display-hero">北域文档</h1>
        <p class="hero-subtitle t-sub-heading">团队文档管理 · 高效协作 · 安全可控</p>
        <div class="hero-actions">
          <BaseButton variant="pill-dark" @click="$router.push('/documents')">
            浏览文档 &gt;
          </BaseButton>
          <BaseButton variant="primary" @click="$router.push('/documents/new')">
            新建文档
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- 数据概览 -->
    <section class="stats-section">
      <div class="stats-grid">
        <BaseCard class="stat-card">
          <div class="stat-value">{{ stats.documents }}</div>
          <div class="stat-label">文档总数</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ stats.announcements }}</div>
          <div class="stat-label">公告数量</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ stats.pendingApprovals }}</div>
          <div class="stat-label">待审批</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ stats.unreadNotifications }}</div>
          <div class="stat-label">未读通知</div>
        </BaseCard>
      </div>
    </section>

    <!-- 最近文档 -->
    <section class="recent-section">
      <h2 class="t-section-heading">最近文档</h2>
      <div class="recent-grid" v-if="recentDocuments.length > 0">
        <BaseCard
          v-for="doc in recentDocuments"
          :key="doc.id"
          class="doc-card"
          elevated
          @click="$router.push(`/documents/${doc.id}`)"
        >
          <div class="doc-title t-card-title">{{ doc.title }}</div>
          <div class="doc-meta t-caption">{{ formatDate(doc.created_at) }}</div>
        </BaseCard>
      </div>
      <div v-else class="empty-state t-body">暂无文档</div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import { documentApi } from '@/api/document';
import { announcementsApi } from '@/api/announcements';
import { notificationsApi } from '@/api/notifications';

const stats = ref({ documents: 0, announcements: 0, pendingApprovals: 0, unreadNotifications: 0 });
const recentDocuments = ref([]);

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
};

const loadStats = async () => {
  try {
    const [docs, anns, notifs] = await Promise.allSettled([
      documentApi.getList({ limit: 1 }),
      announcementsApi.getList({ limit: 1 }),
      notificationsApi.getUnreadCount()
    ]);
    if (docs.status === 'fulfilled') stats.value.documents = docs.value.data.total || docs.value.data.length || 0;
    if (anns.status === 'fulfilled') stats.value.announcements = anns.value.data.total || anns.value.data.length || 0;
    if (notifs.status === 'fulfilled') stats.value.unreadNotifications = notifs.value.data.count || 0;
  } catch (error) {
    console.error('加载统计失败:', error);
  }
};

const loadRecent = async () => {
  try {
    const response = await documentApi.getList({ limit: 6 });
    recentDocuments.value = response.data.documents || response.data || [];
  } catch (error) {
    console.error('加载最近文档失败:', error);
  }
};

onMounted(() => {
  loadStats();
  loadRecent();
});
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

.hero-section {
  background: #000000;
  padding: 120px 24px;
  text-align: center;
}

.hero-content {
  max-width: 980px;
  margin: 0 auto;
}

.hero-content .t-display-hero {
  color: #ffffff;
  margin: 0 0 8px 0;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 40px 0;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.stats-section {
  background: var(--color-bg-primary);
  padding: 60px 24px;
}

.stats-grid {
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  text-align: center;
  cursor: default;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-family: var(--font-text);
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: -0.224px;
}

.recent-section {
  background: var(--color-bg-primary);
  padding: 0 24px 80px 24px;
  max-width: 980px;
  margin: 0 auto;
}

.recent-section .t-section-heading {
  color: var(--color-text-primary);
  margin: 0 0 32px 0;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.doc-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.doc-card:hover {
  transform: translateY(-2px);
}

.doc-title {
  color: var(--color-text-primary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  color: var(--color-text-tertiary);
}

.empty-state {
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 40px;
}

@media (max-width: 834px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .recent-grid {
    grid-template-columns: 1fr;
  }
}
</style>