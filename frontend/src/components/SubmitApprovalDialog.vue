<template>
  <div class="dialog-overlay" @click.self="handleClose">
    <div class="dialog">
      <div class="dialog-header">
        <h2>提交审批申请</h2>
        <button class="close-btn" @click="handleClose">
          <CloseIcon />
        </button>
      </div>

      <div class="dialog-content">
        <!-- 选择文档 -->
        <div class="section">
          <h3>选择文档</h3>
          <p class="hint">请选择一个草稿状态的文档提交审批申请</p>

          <div class="search-bar">
            <input
              type="text"
              placeholder="搜索文档标题..."
              v-model="searchKeyword"
              @input="handleSearch"
            />
          </div>

          <!-- 文档列表 -->
          <div class="document-list" v-if="documents.length > 0">
            <div
              v-for="doc in documents"
              :key="doc.id"
              :class="['document-item', { selected: selectedDocument?.id === doc.id }]"
              @click="selectDocument(doc)"
            >
              <div class="doc-header">
                <span class="status-badge draft">草稿</span>
                <span class="doc-time">{{ formatTime(doc.created_at) }}</span>
              </div>
              <h4 class="doc-title">{{ doc.title }}</h4>
              <div class="doc-meta">
                <span>{{ doc.category_name || '未分类' }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-else>
            <DocumentIcon />
            <p>暂无可提交的草稿文档</p>
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
        </div>

        <!-- 申请说明 -->
        <div class="section" v-if="selectedDocument">
          <h3>申请说明</h3>
          <textarea
            v-model="commentText"
            placeholder="填写申请说明（可选）"
            rows="3"
          ></textarea>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button
            class="btn-submit"
            :disabled="!selectedDocument"
            @click="handleSubmit"
          >
            提交申请
          </button>
          <button class="btn-cancel" @click="handleClose">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { documentsApi } from '@/api/documents';
import CloseIcon from '@/assets/icons/CloseIcon.vue';
import DocumentIcon from '@/assets/icons/DocumentIcon.vue';

const emit = defineEmits(['close', 'submit']);

const documents = ref([]);
const selectedDocument = ref(null);
const searchKeyword = ref('');
const commentText = ref('');
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

const handleClose = () => {
  emit('close');
};

// 加载草稿文档列表
const loadDocuments = async () => {
  try {
    const params = {
      status: 'draft',
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchKeyword.value
    };

    const response = await documentsApi.getList(params);
    if (response.data.success) {
      documents.value = response.data.data.list;
      pagination.value = {
        page: response.data.data.page,
        limit: response.data.data.limit,
        total: response.data.data.total,
        totalPages: response.data.data.totalPages
      };
    }
  } catch (error) {
    console.error('加载文档列表失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.page = 1;
  loadDocuments();
};

// 切换页码
const changePage = (page) => {
  pagination.value.page = page;
  loadDocuments();
};

// 选择文档
const selectDocument = (doc) => {
  selectedDocument.value = doc;
};

// 提交申请
const handleSubmit = () => {
  if (!selectedDocument.value) {
    alert('请选择一个文档');
    return;
  }

  emit('submit', selectedDocument.value.id, commentText.value);
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleDateString('zh-CN');
};

onMounted(() => {
  loadDocuments();
});
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

.hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0 0 12px 0;
}

/* Search Bar */
.search-bar {
  margin-bottom: 12px;
}

.search-bar input {
  width: 100%;
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

/* Document List */
.document-list {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.document-item {
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.document-item:hover {
  border-color: var(--accent);
}

.document-item.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.doc-header {
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

.status-badge.draft {
  background: var(--info);
  color: white;
}

.doc-time {
  color: var(--text-tertiary);
  font-size: 12px;
}

.doc-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.doc-meta {
  color: var(--text-secondary);
  font-size: 12px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
}

.empty-state svg {
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.page-btn {
  padding: 6px 12px;
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
  font-size: 14px;
}

/* Comment Textarea */
textarea {
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

textarea:focus {
  outline: none;
  border-color: var(--input-focus-border);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-submit,
.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit {
  background: var(--accent);
  color: var(--btn-primary-text);
}

.btn-submit:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}
</style>