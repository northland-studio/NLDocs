<template>
  <div class="document-detail">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p class="t-body">加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="t-body" style="color: var(--color-error)">{{ error }}</p>
    </div>
    <div v-else class="detail-container">
      <!-- 文档头部信息 -->
      <BaseCard class="document-header">
        <div class="header-top">
          <h1 class="t-section-heading">{{ document.title }}</h1>
          <div class="actions">
            <BaseButton v-if="isAdmin" variant="dark" @click="editDocument">编辑</BaseButton>
            <BaseButton variant="dark" @click="downloadDocument">下载</BaseButton>
            <BaseButton variant="dark" @click="showVersionHistory">版本历史</BaseButton>
            <BaseButton variant="filter" @click="goBack">返回列表</BaseButton>
          </div>
        </div>
        <div class="meta-info t-caption">
          <span>作者: {{ document.author }}</span>
          <span>创建: {{ formatDate(document.createdAt) }}</span>
          <span>更新: {{ formatDate(document.updatedAt) }}</span>
          <span :class="['status-badge', document.status]">{{ document.status }}</span>
        </div>
      </BaseCard>

      <!-- 文档内容 -->
      <BaseCard class="document-content">
        <div class="markdown-content" v-html="renderedContent"></div>
      </BaseCard>

      <!-- 附件区域 -->
      <BaseCard v-if="document.attachments && document.attachments.length > 0" class="attachments">
        <h2 class="t-card-title">附件文件</h2>
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
          <PdfViewer
            v-if="getFileType(document.attachments[activeAttachment]?.filename) === 'pdf'"
            :url="document.attachments[activeAttachment].url"
          />
          <DocxViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'docx'"
            :url="document.attachments[activeAttachment].url"
          />
          <XlsxViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'xlsx'"
            :url="document.attachments[activeAttachment].url"
          />
          <PptxViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'pptx'"
            :url="document.attachments[activeAttachment].url"
          />
          <div
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'image'"
            class="image-preview"
          >
            <img :src="document.attachments[activeAttachment].url" alt="图片预览" />
          </div>
          <CodeViewer
            v-else-if="getFileType(document.attachments[activeAttachment]?.filename) === 'code'"
            :code="document.attachments[activeAttachment].content"
            :language="getLanguageType(document.attachments[activeAttachment]?.filename)"
          />
          <div v-else class="other-file">
            <p class="t-body">该文件类型不支持在线预览</p>
            <BaseButton variant="primary" @click="downloadAttachment(document.attachments[activeAttachment])">
              下载文件
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- 版本历史对话框 -->
    <div v-if="showVersionModal" class="modal-overlay" @click="closeVersionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="t-card-title">版本历史</h2>
          <button @click="closeVersionModal" class="close-btn" aria-label="关闭">×</button>
        </div>
        <div class="modal-body">
          <div v-if="versionsLoading" class="loading-inline t-body">加载中...</div>
          <div v-else class="versions-list">
            <div
              v-for="version in versions"
              :key="version.id"
              class="version-item"
            >
              <div class="version-info t-caption">
                <span class="version-number">版本 {{ version.versionNumber }}</span>
                <span>{{ formatDate(version.createdAt) }}</span>
                <span>{{ version.author }}</span>
              </div>
              <div class="version-actions">
                <BaseButton variant="filter" @click="viewVersion(version)">查看</BaseButton>
                <BaseButton v-if="isAdmin" variant="primary" @click="restoreVersion(version.id)">恢复</BaseButton>
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
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import PdfViewer from '../components/preview/PdfViewer.vue';
import DocxViewer from '../components/preview/DocxViewer.vue';
import XlsxViewer from '../components/preview/XlsxViewer.vue';
import PptxViewer from '../components/preview/PptxViewer.vue';
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

const isAdmin = computed(() => {
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  return userInfo.role === 'admin';
});

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
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'json', 'xml', 'html', 'css', 'yaml', 'yml', 'md'].includes(ext)) return 'code';
  return 'other';
};

const getLanguageType = (filename) => {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript', 'ts': 'typescript', 'py': 'python', 'java': 'java',
    'cpp': 'cpp', 'c': 'cpp', 'go': 'go', 'rs': 'rust', 'php': 'php',
    'rb': 'ruby', 'swift': 'swift', 'kt': 'kotlin', 'sql': 'sql',
    'sh': 'bash', 'json': 'json', 'xml': 'xml', 'html': 'html',
    'css': 'css', 'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown'
  };
  return languageMap[ext] || 'javascript';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

const editDocument = () => router.push(`/documents/${route.params.id}/edit`);

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

const closeVersionModal = () => { showVersionModal.value = false; };
const viewVersion = (version) => {
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

const goBack = () => router.push('/documents');

onMounted(() => { loadDocument(); });
</script>

<style scoped>
.document-detail {
  padding: 32px 24px;
  max-width: 980px;
  margin: 0 auto;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 113, 227, 0.2);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-circle);
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.detail-container { display: flex; flex-direction: column; gap: 20px; }

.document-header { padding: 24px; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-top .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

.actions { display: flex; gap: 8px; flex-wrap: wrap; }

.meta-info {
  display: flex;
  gap: 16px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.status-badge {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-weight: 600;
}

.status-badge.published { background: var(--color-success); color: #fff; }
.status-badge.draft { background: var(--color-warning); color: #fff; }

.document-content { padding: 32px; }

.markdown-content {
  line-height: 1.47;
  color: var(--color-text-primary);
  font-family: var(--font-text);
  font-size: 17px;
  letter-spacing: -0.374px;
}

.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) {
  font-family: var(--font-display);
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-content :deep(p) { margin-bottom: 12px; }

.markdown-content :deep(code) {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-micro);
  font-family: 'Consolas', monospace;
}

.markdown-content :deep(pre) {
  background: #1d1d1f;
  padding: 16px;
  border-radius: var(--radius-standard);
  overflow-x: auto;
}

.markdown-content :deep(pre code) { background: transparent; padding: 0; color: #d4d4d4; }

.attachments { padding: 24px; }

.attachments .t-card-title {
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
}

.attachment-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.attachment-tab {
  padding: 6px 14px;
  background: var(--color-bg-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  transition: all 0.15s ease;
}

.attachment-tab:hover { background: rgba(0, 113, 227, 0.1); }

.attachment-tab.active {
  background: var(--color-accent);
  color: #fff;
}

.attachment-preview {
  height: 600px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-standard);
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.image-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }

.other-file {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-large);
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  box-shadow: var(--shadow-card);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header .t-card-title { color: var(--color-text-primary); margin: 0; }

.close-btn {
  font-size: 24px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--radius-circle);
  transition: background 0.15s ease;
}

.close-btn:hover { background: var(--color-bg-tertiary); }

.modal-body { padding: 20px 24px; }

.loading-inline { text-align: center; padding: 20px; color: var(--color-text-secondary); }

.versions-list { display: flex; flex-direction: column; gap: 8px; }

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-standard);
}

.version-info { display: flex; gap: 12px; color: var(--color-text-primary); flex-wrap: wrap; }
.version-number { font-weight: 600; }
.version-actions { display: flex; gap: 8px; }
</style>