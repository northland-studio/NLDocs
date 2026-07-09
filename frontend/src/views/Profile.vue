<template>
  <div class="profile-page">
    <header class="page-header">
      <h1 class="t-section-heading">个人中心</h1>
    </header>

    <!-- 用户信息卡片 -->
    <BaseCard class="user-card">
      <div class="user-avatar">
        <UserIcon class="avatar-icon" />
      </div>
      <div class="user-details">
        <h2 class="user-name">{{ user.username }}</h2>
        <div class="user-badges">
          <span class="level-badge" :class="`level-${user.level || 0}`">
            {{ getLevelText(user.level) }}
          </span>
          <span v-if="user.title" class="title-badge">{{ user.title }}</span>
        </div>
        <div class="user-stats">
          <div class="stat-item">
            <span class="stat-label">贡献点</span>
            <span class="stat-value">{{ user.contribution || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">创建文档</span>
            <span class="stat-value">{{ myDocuments.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">审批记录</span>
            <span class="stat-value">{{ myApprovals.length }}</span>
          </div>
        </div>
        <div class="user-meta">
          <span class="meta-item">注册时间：{{ formatDate(user.created_at) }}</span>
          <span class="meta-item">最后登录：{{ formatDate(user.last_login) }}</span>
        </div>
      </div>
      <BaseButton variant="dark" class="logout-btn" @click="handleLogout">
        <LogoutIcon class="btn-icon" />
        <span>登出</span>
      </BaseButton>
    </BaseCard>

    <!-- 我的文档 -->
    <BaseCard class="section">
      <div class="section-header">
        <h3 class="section-title">我的文档</h3>
        <BaseButton variant="pill" @click="$router.push('/documents/new')">
          <PlusIcon class="btn-icon" />
          创建新文档
        </BaseButton>
      </div>

      <div v-if="loadingDocuments" class="loading">加载中...</div>

      <div v-else-if="myDocuments.length === 0" class="empty-state">
        <DocumentIcon class="empty-icon" />
        <p>暂无创建的文档</p>
      </div>

      <div v-else class="document-list">
        <div
          v-for="doc in myDocuments"
          :key="doc.id"
          class="document-item"
          @click="viewDocument(doc.id)"
        >
          <div class="doc-header">
            <h4 class="doc-title">{{ doc.title }}</h4>
            <span class="status-badge" :class="doc.status">{{ getStatusText(doc.status) }}</span>
          </div>
          <div class="doc-meta">
            <span class="meta-text">{{ doc.category_name || '未分类' }}</span>
            <span class="meta-text">{{ formatDate(doc.updated_at || doc.created_at) }}</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 我的审批记录 -->
    <BaseCard class="section">
      <div class="section-header">
        <h3 class="section-title">审批记录</h3>
      </div>

      <div v-if="loadingApprovals" class="loading">加载中...</div>

      <div v-else-if="myApprovals.length === 0" class="empty-state">
        <ApprovalIcon class="empty-icon" />
        <p>暂无审批记录</p>
      </div>

      <div v-else class="approval-list">
        <div
          v-for="approval in myApprovals"
          :key="approval.id"
          class="approval-item"
          @click="viewApproval(approval.id)"
        >
          <div class="approval-header">
            <h4 class="approval-title">{{ approval.document_title }}</h4>
            <span class="status-badge" :class="approval.status">{{ getApprovalStatusText(approval.status) }}</span>
          </div>
          <div class="approval-meta">
            <span class="meta-text">提交时间：{{ formatDate(approval.created_at) }}</span>
            <span v-if="approval.reviewed_at" class="meta-text">
              审核时间：{{ formatDate(approval.reviewed_at) }}
            </span>
          </div>
          <p v-if="approval.comment" class="approval-comment">{{ approval.comment }}</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api/auth';
import { documentsApi } from '@/api/documents';
import { approvalsApi } from '@/api/approvals';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import UserIcon from '@/assets/icons/UserIcon.vue';
import LogoutIcon from '@/assets/icons/LogoutIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import DocumentIcon from '@/assets/icons/DocumentIcon.vue';
import ApprovalIcon from '@/assets/icons/ApprovalIcon.vue';

const router = useRouter();

// 用户信息
const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});

// 状态
const myDocuments = ref([]);
const myApprovals = ref([]);
const loadingDocuments = ref(false);
const loadingApprovals = ref(false);

// 获取权限等级文本
const getLevelText = (level) => {
  const levels = {
    0: '普通成员',
    1: '管理员',
    2: '超级管理员',
    3: '文档管理员'
  };
  return levels[level || 0] || '普通成员';
};

// 获取文档状态文本
const getStatusText = (status) => {
  const statuses = {
    draft: '草稿',
    published: '已发布'
  };
  return statuses[status] || status;
};

// 获取审批状态文本
const getApprovalStatusText = (status) => {
  const statuses = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statuses[status] || status;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取我的文档列表
const fetchMyDocuments = async () => {
  loadingDocuments.value = true;
  try {
    const response = await documentsApi.getList({
      page: 1,
      limit: 100,
      status: '' // 获取所有状态的文档
    });

    if (response.data.success) {
      // 只显示当前用户创建的文档
      myDocuments.value = response.data.data.list.filter(
        doc => doc.author_id === user.value.id
      );
    }
  } catch (error) {
    console.error('获取我的文档失败:', error);
    if (error.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loadingDocuments.value = false;
  }
};

// 获取我的审批记录
const fetchMyApprovals = async () => {
  loadingApprovals.value = true;
  try {
    const response = await approvalsApi.getMyApprovals({
      page: 1,
      limit: 100
    });

    if (response.data.success) {
      myApprovals.value = response.data.data.approvals;
    }
  } catch (error) {
    console.error('获取我的审批记录失败:', error);
    if (error.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loadingApprovals.value = false;
  }
};

// 查看文档详情
const viewDocument = (id) => {
  router.push(`/documents/${id}`);
};

// 查看审批详情
const viewApproval = (id) => {
  router.push(`/approvals/${id}`);
};

// 登出
const handleLogout = async () => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('登出失败:', error);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

// 初始化
onMounted(() => {
  fetchMyDocuments();
  fetchMyApprovals();
});
</script>

<style scoped>
.profile-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-header .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

/* 用户卡片 - BaseCard */
.user-card {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
  position: relative;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-circle);
  background: rgba(0, 113, 227, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  width: 48px;
  height: 48px;
  color: var(--color-accent);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.14;
  letter-spacing: 0.196px;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.user-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.level-badge,
.title-badge {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.12px;
}

.level-badge {
  background: var(--color-accent);
  color: #ffffff;
}

.level-badge.level-0 {
  background: var(--color-text-tertiary);
}

.level-badge.level-1 {
  background: var(--color-success);
}

.level-badge.level-2 {
  background: var(--color-warning);
}

.level-badge.level-3 {
  background: var(--color-info);
}

.title-badge {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.user-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-tertiary);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-accent);
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-family: var(--font-text);
  font-size: 13px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
}

.logout-btn {
  flex-shrink: 0;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* 区块 - BaseCard */
.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
  margin: 0;
}

/* 加载和空状态 */
.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
  letter-spacing: -0.224px;
}

/* 文档列表 */
.document-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.document-item {
  padding: 16px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-standard);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.document-item:hover {
  transform: translateY(-2px);
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.374px;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.12px;
  white-space: nowrap;
}

.status-badge.draft {
  background: var(--color-warning);
  color: #ffffff;
}

.status-badge.published {
  background: var(--color-success);
  color: #ffffff;
}

.status-badge.pending {
  background: var(--color-warning);
  color: #ffffff;
}

.status-badge.approved {
  background: var(--color-success);
  color: #ffffff;
}

.status-badge.rejected {
  background: var(--color-error);
  color: #ffffff;
}

.doc-meta {
  display: flex;
  gap: 12px;
  font-family: var(--font-text);
  font-size: 13px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

/* 审批列表 */
.approval-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.approval-item {
  padding: 16px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-standard);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.approval-item:hover {
  transform: translateY(-2px);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.approval-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.374px;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.approval-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-family: var(--font-text);
  font-size: 13px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.approval-comment {
  font-family: var(--font-text);
  font-size: 13px;
  line-height: 1.43;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.meta-text {
  font-family: var(--font-text);
  font-size: 13px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
}

/* 响应式 */
@media (max-width: 640px) {
  .profile-page {
    padding: 24px 16px;
  }

  .user-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-badges,
  .user-stats,
  .user-meta {
    justify-content: center;
  }

  .logout-btn {
    width: 100%;
  }

  .document-list,
  .approval-list {
    grid-template-columns: 1fr;
  }
}
</style>
