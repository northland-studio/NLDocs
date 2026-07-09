<template>
  <div class="dialog-overlay" @click.self="handleClose">
    <div class="dialog">
      <div class="dialog-header">
        <h2>审批详情</h2>
        <button class="close-btn" @click="handleClose">
          <CloseIcon />
        </button>
      </div>

      <div class="dialog-content">
        <!-- 审批状态 -->
        <div class="status-section">
          <span class="status-badge" :class="approval.status">
            {{ getStatusText(approval.status) }}
          </span>
        </div>

        <!-- 文档信息 -->
        <div class="section">
          <h3>文档信息</h3>
          <div class="info-card">
            <div class="info-item">
              <label>文档标题</label>
              <p>{{ approval.document?.title || '未知' }}</p>
            </div>
            <div class="info-item">
              <label>分类</label>
              <p>{{ approval.document?.category_name || '未分类' }}</p>
            </div>
            <div class="info-item">
              <label>文档状态</label>
              <p>{{ approval.document?.status || '未知' }}</p>
            </div>
          </div>

          <!-- 文档内容预览 -->
          <div class="content-preview" v-if="approval.document?.content">
            <h4>文档内容预览</h4>
            <div class="preview-box">
              {{ approval.document.content }}
            </div>
          </div>
        </div>

        <!-- 申请信息 -->
        <div class="section">
          <h3>申请信息</h3>
          <div class="info-card">
            <div class="info-item">
              <label>申请人</label>
              <p>{{ approval.requester?.username || '未知' }}</p>
            </div>
            <div class="info-item">
              <label>申请人头衔</label>
              <p>{{ approval.requester?.title || '无' }}</p>
            </div>
            <div class="info-item">
              <label>申请时间</label>
              <p>{{ formatTime(approval.created_at) }}</p>
            </div>
            <div class="info-item" v-if="approval.comment && approval.status !== 'pending'">
              <label>审批意见</label>
              <p>{{ approval.comment }}</p>
            </div>
          </div>
        </div>

        <!-- 审核信息（已审核的审批） -->
        <div class="section" v-if="approval.reviewer">
          <h3>审核信息</h3>
          <div class="info-card">
            <div class="info-item">
              <label>审核人</label>
              <p>{{ approval.reviewer?.username || '未知' }}</p>
            </div>
            <div class="info-item">
              <label>审核时间</label>
              <p>{{ formatTime(approval.reviewed_at) }}</p>
            </div>
          </div>
        </div>

        <!-- 审核操作（管理员 + 待审核状态） -->
        <div class="action-section" v-if="isAdmin && approval.status === 'pending'">
          <div class="comment-input">
            <label>审核意见</label>
            <textarea
              v-model="commentText"
              placeholder="填写审核意见（拒绝时必须填写原因）"
              rows="3"
            ></textarea>
          </div>
          <div class="action-buttons">
            <button class="btn-approve" @click="handleApprove">
              <CheckIcon />
              通过
            </button>
            <button class="btn-reject" @click="handleReject">
              <CloseIcon />
              拒绝
            </button>
            <button class="btn-cancel" @click="handleClose">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CloseIcon from '@/assets/icons/CloseIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';

const props = defineProps({
  approval: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'approve', 'reject']);

const commentText = ref('');

const handleClose = () => {
  emit('close');
};

const handleApprove = () => {
  emit('approve', props.approval.id, commentText.value);
};

const handleReject = () => {
  if (!commentText.value.trim()) {
    alert('拒绝审批时必须填写拒绝原因');
    return;
  }
  emit('reject', props.approval.id, commentText.value);
};

const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || status;
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

h2 {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.dialog-content {
  padding: 20px;
  overflow-y: auto;
}

/* Status Section */
.status-section {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
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

/* Section */
.section {
  margin-bottom: 20px;
}

.section h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.info-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  font-size: 12px;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: 4px;
}

.info-item p {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

/* Content Preview */
.content-preview {
  margin-top: 12px;
}

.content-preview h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.preview-box {
  background: var(--bg-tertiary);
  border-radius: 6px;
  padding: 12px;
  color: var(--text-primary);
  font-size: 14px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Action Section */
.action-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.comment-input {
  margin-bottom: 16px;
}

.comment-input label {
  font-size: 14px;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8px;
}

.comment-input textarea {
  width: 100%;
  padding: 10px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-input textarea:focus {
  outline: none;
  border-color: var(--input-focus-border);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-approve,
.btn-reject,
.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-approve {
  background: var(--success);
  color: white;
}

.btn-approve:hover {
  opacity: 0.9;
}

.btn-reject {
  background: var(--error);
  color: white;
}

.btn-reject:hover {
  opacity: 0.9;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-approve svg,
.btn-reject svg {
  width: 16px;
  height: 16px;
}
</style>