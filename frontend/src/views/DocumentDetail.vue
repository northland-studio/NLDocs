<template>
  <div class="document-detail">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="detail-container">
      <!-- 文档头部信息 -->
      <div class="document-header">
        <div class="header-top">
          <h1>{{ document.title }}</h1>
          <div class="actions">
            <button
              v-if="isAdmin"
              @click="editDocument"
              class="btn-secondary"
            >
              编辑
            </button>
            <button @click="downloadDocument" class="btn-secondary">
              下载
            </button>
            <button @click="showVersionHistory" class="btn-secondary">
              版本历史
            </button>
            <button @click="goBack" class="btn-secondary">
              返回列表
            </button>
          </div>
        </div>
        <div class="meta-info">
          <span>作者: {{ document.author }}</span>
          <span>创建时间: {{ formatDate(document.createdAt) }}</span>
          <span>更新时间: {{ formatDate(document.updatedAt) }}</span>
          <span :class="['status', document.status]">{{ document.status }}</span>
        </div>
      </div>

      <!-- 文档内容 -->
      <div class="document-content">
        <div class="markdown-content" v-html="renderedContent"></div>
      </div>

      <!-- 附件区域 -->
      <div v-if="document.attachments && document.attachments.length > 0" class="attachments">
        <h2>附件文件</h2>
        <div class="attachment-tabs">
          <button
            v-for="(attachment, index) in document.attachments"
            :key="attachment.id"
            @click="activeAttachment = index"
            :class="['attachment-tab', { active: activeAttachment === index }]"
          >
            {{ attachment.filename }}
          </button>
        </div>
        <div class="attachment-preview">
          <!-- PDF预览 -->
          <PdfViewer
            v-if="getFileType(document.attachments[activeAttachment]?.filename) === 'pdf'"
            :url="document.attachments[activeAttachment].url"
          />
          <!-- Word预览 -->
          <DocxViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'docx'"
            :url="document.attachments[activeAttachment].url"
          />
          <!-- Excel预览 -->
          <XlsxViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'xlsx'"
            :url="document.attachments[activeAttachment].url"
          />
          <!-- 图片预览 -->
          <div
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'image'"
            class="image-preview"
          >
            <img :src="document.attachments[activeAttachment].url" alt="图片预览" />
          </div>
          <!-- 代码预览 -->
          <CodeViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'code'"
            :code="document.attachments[activeAttachment].content"
            :language="getLanguageType(document.attachments[activeAttachment]?.filename)"
          />
          <!-- 其他文件类型 -->
          <div v-else class="other-file">
            <p>该文件类型不支持在线预览</p>
            <button @click="downloadAttachment(document.attachments[activeAttachment])" class="btn-primary">
              下载文件
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本历史对话框 -->
    <div v-if="showVersionModal" class="modal-overlay" @click="closeVersionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>版本历史</h2>
          <button @click="closeVersionModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="versionsLoading" class="loading">加载中...</div>
          <div v-else class="versions-list">
            <div
              v-for="version in versions"
              :key="version.id"
              class="version-item"
            >
              <div class="version-info">
                <span class="version-number">版本 {{ version.versionNumber }}</span>
                <span class="version-date">{{ formatDate(version.createdAt) }}</span>
                <span class="version-author">{{ version.author }}</span>
              </div>
              <div class="version-actions">
                <button @click="viewVersion(version)" class="btn-small">查看</button>
                <button
                  v-if="isAdmin"
                  @click="restoreVersion(version.id)"
                  class="btn-small btn-primary"
                >
                  恢复
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { documentApi } from '../api/document';
import PdfViewer from '../components/preview/PdfViewer.vue';
import DocxViewer from '../components/preview/DocxViewer.vue';
import XlsxViewer from '../components/preview/XlsxViewer.vue';
import CodeViewer from '../components/preview/CodeViewer.vue';

const router = useRouter();
const route = useRoute();
const document = ref({});
const loading = ref(true);
const error = ref('');
const activeAttachment = ref(0);
const showVersionModal = ref(false);
const versions = ref([]);
const versionsLoading = ref(false);

// 判断是否为管理员（从localStorage获取用户信息）
const isAdmin = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  return userInfo.role === 'admin';
});

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (!document.value.content) return '';
  return marked(document.value.content);
});

const loadDocument = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await documentApi.getDetail(route.params.id);
    document.value = response.data;
    loading.value = false;
  } catch (err) {
    error.value = `加载文档失败: ${err.response?.data?.message || err.message}`;
    loading.value = false;
  }
};

const loadVersionHistory = async () => {
  try {
    versionsLoading.value = true;
    const response = await documentApi.getVersionHistory(route.params.id);
    versions.value = response.data;
    versionsLoading.value = false;
  } catch (err) {
    console.error('加载版本历史失败:', err);
    versionsLoading.value = false;
  }
};

const getFileType = (filename) => {
  if (!filename) return 'other';
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'json', 'xml', 'html', 'css', 'yaml', 'yml', 'md'].includes(ext)) return 'code';

  return 'other';
};

const getLanguageType = (filename) => {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'cpp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'sh': 'bash',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown'
  };

  return languageMap[ext] || 'javascript';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const editDocument = () => {
  router.push(`/documents/${route.params.id}/edit`);
};

const downloadDocument = async () => {
  try {
    const response = await documentApi.download(route.params.id);
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = document.value.title + '.md';
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('下载失败:', err);
  }
};

const downloadAttachment = (attachment) => {
  const link = document.createElement('a');
  link.href = attachment.url;
  link.download = attachment.filename;
  link.click();
};

const showVersionHistory = () => {
  showVersionModal.value = true;
  loadVersionHistory();
};

const closeVersionModal = () => {
  showVersionModal.value = false;
};

const viewVersion = (version) => {
  // 显示该版本的内容
  document.value.content = version.content;
  closeVersionModal();
};

const restoreVersion = async (versionId) => {
  try {
    await documentApi.restoreVersion(route.params.id, versionId);
    await loadDocument();
    closeVersionModal();
  } catch (err) {
    console.error('恢复版本失败:', err);
    alert('恢复版本失败: ' + (err.response?.data?.message || err.message));
  }
};

const goBack = () => {
  router.push('/documents');
};

onMounted(() => {
  loadDocument();
});
</script>

<style scoped>
.document-detail {
  padding: 20px;
}

.loading, .error {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.error {
  color: var(--color-error);
}

.detail-container {
  max-width: 900px;
  margin: 0 auto;
}

.document-header {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-top h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: var(--bg-primary);
  opacity: 0.8;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.meta-info {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: var(--text-secondary);
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status.published {
  background: #e6f7e6;
  color: #52c41a;
}

.status.draft {
  background: #fff7e6;
  color: #fa8c16;
}

.document-content {
  background: var(--bg-primary);
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.markdown-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.markdown-content :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background: #1e1e1e;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 30px;
  margin-bottom: 12px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content :deep(table td),
.markdown-content :deep(table th) {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
}

.attachments {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.attachments h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.attachment-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.attachment-tab {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
}

.attachment-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.attachment-preview {
  height: 600px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  overflow: auto;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.other-file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.other-file p {
  color: var(--text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.version-info {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: var(--text-primary);
}

.version-number {
  font-weight: 600;
}

.version-actions {
  display: flex;
  gap: 10px;
}

.btn-small {
  padding: 5px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 12px;
}
</style>