<template>
  <div class="approvals-page">
    <div class="page-header">
      <h1>审批管理</h1>
      <button class="btn-primary" @click="showSubmitDialog = true">
        提交审批申请
      </button>
    </div>

    <!-- 状态筛选 -->
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

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input
        type="text"
        placeholder="搜索文档标题..."
        v-model="searchKeyword"
        @input="handleSearch"
      />
    </div>

    <!-- 审批列表 -->
    <div class="approval-list" v-if="approvals.length > 0">
      <div
        v-for="approval in approvals"
        :key="approval.id"
        class="approval-item"
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
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <ApprovalIcon />
      <p>暂无审批记录</p>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="page-btn"
        :disabled="pagination.page === 1"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </button>
      <span class="page-info">
        {{ pagination.page }} / {{ pagination.totalPages }}
      </span>
      <button
        class="page-btn"
        :disabled="pagination.page === pagination.totalPages"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </button>
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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

h1 {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--accent);
  color: var(--btn-primary-text);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab:hover {
  background: var(--bg-hover);
}

.tab.active {
  background: var(--accent);
  color: var(--btn-primary-text);
  border-color: var(--accent);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--error);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* Search Bar */
.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  max-width: 400px;
  padding: 10px 14px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--input-focus-border);
}

/* Approval List */
.approval-list {
  display: grid;
  gap: 16px;
}

.approval-item {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.approval-item:hover {
  box-shadow: var(--card-shadow);
  border-color: var(--accent);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
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

.approval-time {
  color: var(--text-tertiary);
  font-size: 12px;
}

.document-title {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.approval-meta {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.comment {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 8px 0 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
}
</style>