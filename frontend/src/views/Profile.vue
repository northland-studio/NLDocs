<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <div class="user-card">
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
      <button @click="handleLogout" class="logout-btn">
        <LogoutIcon />
        <span>登出</span>
      </button>
    </div>

    <!-- 我的文档 -->
    <div class="section">
      <div class="section-header">
        <h3>我的文档</h3>
        <router-link to="/documents/new" class="create-link">
          <PlusIcon />
          创建新文档
        </router-link>
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
    </div>

    <!-- 我的审批记录 -->
    <div class="section">
      <div class="section-header">
        <h3>审批记录</h3>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api/auth';
import { documentsApi } from '@/api/documents';
import { approvalsApi } from '@/api/approvals';
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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 用户卡片 */
.user-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
  position: relative;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  width: 48px;
  height: 48px;
  color: var(--accent);
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.user-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.level-badge,
.title-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.level-badge {
  background: var(--accent);
  color: white;
}

.level-badge.level-0 {
  background: var(--text-tertiary);
}

.level-badge.level-1 {
  background: var(--success);
}

.level-badge.level-2 {
  background: var(--warning);
}

.level-badge.level-3 {
  background: var(--info);
}

.title-badge {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.user-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
}

.user-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  color: var(--error);
  border: 1px solid var(--error);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--error);
  color: white;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* 区块 */
.section {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.create-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-link:hover {
  background: var(--accent-hover);
}

.create-link svg {
  width: 16px;
  height: 16px;
}

/* 加载和空状态 */
.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
}

/* 文档列表 */
.document-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.document-item {
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.document-item:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.draft {
  background: var(--warning);
  color: white;
}

.status-badge.published {
  background: var(--success);
  color: white;
}

.doc-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 审批列表 */
.approval-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.approval-item {
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.approval-item:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.approval-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.status-badge.pending {
  background: var(--warning);
  color: white;
}

.status-badge.approved {
  background: var(--success);
  color: white;
}

.status-badge.rejected {
  background: var(--error);
  color: white;
}

.approval-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.approval-comment {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }

  .user-card {
    padding: 20px;
    flex-direction: column;
    align-items: center;
  }

  .logout-btn {
    width: 100%;
    justify-content: center;
  }

  .user-stats {
    justify-content: center;
  }

  .user-meta {
    justify-content: center;
  }

  .document-list,
  .approval-list {
    grid-template-columns: 1fr;
  }
}
</style>