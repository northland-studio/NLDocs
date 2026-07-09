<template>
  <div class="approvals-page">
    <div class="page-header">
      <h1 class="t-section-heading">审批管理</h1>
      <BaseButton variant="primary" @click="showSubmitDialog = true">
        提交审批申请
      </BaseButton>
    </div>

    <!-- 状态筛选 - Apple pill 风格 -->
    <div class="tabs">
      <button
        :class="['tab', { active: currentStatus === '' }]"
        @click="changeStatus('')"
      >
        全部
      </button>
      <button
        :class="['tab', { active: currentStatus === 'pending' }]"
        @click="changeStatus('pending')"
      >
        待审核
        <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
      </button>
      <button
        :class="['tab', { active: currentStatus === 'approved' }]"
        @click="changeStatus('approved')"
      >
        已通过
      </button>
      <button
        :class="['tab', { active: currentStatus === 'rejected' }]"
        @click="changeStatus('rejected')"
      >
        已拒绝
      </button>
    </div>

    <!-- 搜索栏 - Apple filter 风格 -->
    <div class="search-bar">
      <input
        type="text"
        placeholder="搜索文档标题..."
        v-model="searchKeyword"
        @input="handleSearch"
        class="search-input"
      />
    </div>

    <!-- 审批列表 -->
    <div class="approval-list" v-if="approvals.length > 0">
      <BaseCard
        v-for="approval in approvals"
        :key="approval.id"
        class="approval-item"
        elevated
        @click="viewApproval(approval)"
      >
        <div class="approval-header">
          <span class="status-badge" :class="approval.status">
            {{ getStatusText(approval.status) }}
          </span>
          <span class="approval-time">{{ formatTime(approval.created_at) }}</span>
        </div>
        <h3 class="document-title">{{ approval.document_title }}</h3>
        <div class="approval-meta">
          <span class="requester">
            申请人：{{ approval.requester_name || '未知' }}
          </span>
          <span v-if="approval.reviewer_name" class="reviewer">
            审核人：{{ approval.reviewer_name }}
          </span>
        </div>
        <p v-if="approval.comment" class="comment">{{ approval.comment }}</p>
      </BaseCard>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <ApprovalIcon class="empty-icon" />
      <p>暂无审批记录</p>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <BaseButton
        variant="filter"
        :disabled="pagination.page === 1"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </BaseButton>
      <span class="page-info">
        {{ pagination.page }} / {{ pagination.totalPages }}
      </span>
      <BaseButton
        variant="filter"
        :disabled="pagination.page === pagination.totalPages"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </BaseButton>
    </div>

    <!-- 审批详情弹窗 -->
    <ApprovalDetailDialog
      v-if="showDetailDialog"
      :approval="selectedApproval"
      :isAdmin="isAdmin"
      @close="closeDetailDialog"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <!-- 提交审批弹窗 -->
    <SubmitApprovalDialog
      v-if="showSubmitDialog"
      @close="showSubmitDialog = false"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { approvalsApi } from '@/api/approvals';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import ApprovalIcon from '@/assets/icons/ApprovalIcon.vue';
import ApprovalDetailDialog from '@/components/ApprovalDetailDialog.vue';
import SubmitApprovalDialog from '@/components/SubmitApprovalDialog.vue';

const approvals = ref([]);
const currentStatus = ref('');
const searchKeyword = ref('');
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});
const pendingCount = ref(0);

const showDetailDialog = ref(false);
const showSubmitDialog = ref(false);
const selectedApproval = ref(null);

const user = computed(() => JSON.parse(localStorage.getItem('user') || '{}'));
const isAdmin = computed(() => (user.value.level || 0) >= 1);

// 加载审批列表
const loadApprovals = async () => {
  try {
    const params = {
      status: currentStatus.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    };

    const response = await approvalsApi.getList(params);
    if (response.data.success) {
      approvals.value = response.data.data.approvals;
      pagination.value = response.data.data.pagination;
    }
  } catch (error) {
    console.error('加载审批列表失败:', error);
  }
};

// 加载待审核数量
const loadPendingCount = async () => {
  if (!isAdmin.value) return;

  try {
    const response = await approvalsApi.getPending({ limit: 1000 });
    if (response.data.success) {
      pendingCount.value = response.data.data.pagination.total;
    }
  } catch (error) {
    console.error('加载待审核数量失败:', error);
  }
};

// 切换状态
const changeStatus = (status) => {
  currentStatus.value = status;
  pagination.value.page = 1;
  loadApprovals();
};

// 搜索
const handleSearch = () => {
  // 实际搜索逻辑可以在这里实现
  // 目前先简单刷新列表
  pagination.value.page = 1;
  loadApprovals();
};

// 切换页码
const changePage = (page) => {
  pagination.value.page = page;
  loadApprovals();
};

// 查看审批详情
const viewApproval = async (approval) => {
  try {
    const response = await approvalsApi.getDetail(approval.id);
    if (response.data.success) {
      selectedApproval.value = response.data.data;
      showDetailDialog.value = true;
    }
  } catch (error) {
    console.error('获取审批详情失败:', error);
  }
};

// 关闭详情弹窗
const closeDetailDialog = () => {
  showDetailDialog.value = false;
  selectedApproval.value = null;
};

// 审批通过
const handleApprove = async (id, comment) => {
  try {
    const response = await approvalsApi.approve(id, comment);
    if (response.data.success) {
      closeDetailDialog();
      loadApprovals();
      loadPendingCount();
    }
  } catch (error) {
    console.error('审批通过失败:', error);
  }
};

// 审批拒绝
const handleReject = async (id, comment) => {
  try {
    const response = await approvalsApi.reject(id, comment);
    if (response.data.success) {
      closeDetailDialog();
      loadApprovals();
      loadPendingCount();
    }
  } catch (error) {
    console.error('审批拒绝失败:', error);
  }
};

// 提交审批申请
const handleSubmit = async (document_id, comment) => {
  try {
    const response = await approvalsApi.submit(document_id, comment);
    if (response.data.success) {
      showSubmitDialog.value = false;
      loadApprovals();
    }
  } catch (error) {
    console.error('提交审批申请失败:', error);
  }
};

// 状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || status;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  loadApprovals();
  loadPendingCount();
});
</script>

<style scoped>
.approvals-page {
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

/* Tabs - Apple pill 风格 */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
  background: #fafafc;
  color: var(--color-text-secondary);
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.224px;
  transition: all 0.15s ease;
  position: relative;
}

.tab:hover {
  color: var(--color-text-primary);
}

.tab.active {
  background: var(--color-accent);
  color: #ffffff;
  border-color: transparent;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  background: var(--color-error);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  min-width: 18px;
  height: 18px;
  text-align: center;
}

.tab.active .badge {
  background: #ffffff;
  color: var(--color-accent);
}

/* 搜索栏 - Apple filter 风格 */
.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  background: #fafafc;
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  color: var(--color-text-primary);
  font-family: var(--font-text);
  font-size: 17px;
  letter-spacing: -0.374px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

/* 审批列表 */
.approval-list {
  display: grid;
  gap: 16px;
  margin-bottom: 32px;
}

.approval-item {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.approval-item:hover {
  transform: translateY(-2px);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.12px;
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

.approval-time {
  color: var(--color-text-tertiary);
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
}

.document-title {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.approval-meta {
  display: flex;
  gap: 16px;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
  flex-wrap: wrap;
}

.comment {
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.43;
  letter-spacing: -0.224px;
  margin: 8px 0 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-tertiary);
  font-family: var(--font-text);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 17px;
  letter-spacing: -0.374px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.page-info {
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
}

/* 响应式 */
@media (max-width: 640px) {
  .approvals-page {
    padding: 24px 16px;
  }

  .tabs {
    gap: 6px;
  }

  .tab {
    padding: 6px 12px;
    font-size: 13px;
  }

  .approval-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
