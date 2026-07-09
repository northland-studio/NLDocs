<template>
  <div class="document-edit">
    <div class="header">
      <h1 class="t-section-heading">{{ isNewDocument ? '新建文档' : '编辑文档' }}</h1>
      <div class="actions">
        <BaseButton variant="filter" @click="goBack">取消</BaseButton>
        <BaseButton variant="dark" :disabled="saving" @click="saveAsDraft">
          {{ saving ? '保存中...' : '保存为草稿' }}
        </BaseButton>
        <BaseButton variant="primary" :disabled="saving" @click="publishDocument">
          {{ saving ? '发布中...' : '发布' }}
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="edit-container">
      <!-- 基本信息 -->
      <BaseCard class="form-section">
        <div class="form-group">
          <BaseInput
            v-model="document.title"
            label="标题"
            placeholder="请输入文档标题"
          />
        </div>

        <div class="form-group">
          <BaseSelect
            v-model="document.categoryId"
            label="分类"
            placeholder="请选择分类"
            :options="categoryOptions"
          />
        </div>
      </BaseCard>

      <!-- Markdown编辑器 -->
      <BaseCard class="editor-section">
        <div class="editor-tabs">
          <button
            @click="editorMode = 'edit'"
            :class="['editor-tab', { active: editorMode === 'edit' }]"
          >
            编辑
          </button>
          <button
            @click="editorMode = 'preview'"
            :class="['editor-tab', { active: editorMode === 'preview' }]"
          >
            预览
          </button>
          <button
            @click="editorMode = 'split'"
            :class="['editor-tab', { active: editorMode === 'split' }]"
          >
            分屏
          </button>
        </div>

        <div class="editor-container">
          <!-- 编辑模式 -->
          <div v-if="editorMode === 'edit'" class="editor-mode">
            <textarea
              v-model="document.content"
              placeholder="请输入文档内容（支持Markdown格式）"
              class="markdown-editor"
            ></textarea>
          </div>

          <!-- 预览模式 -->
          <div v-else-if="editorMode === 'preview'" class="preview-mode">
            <div class="markdown-content" v-html="renderedContent"></div>
          </div>

          <!-- 分屏模式 -->
          <div v-else class="split-mode">
            <div class="split-pane">
              <textarea
                v-model="document.content"
                placeholder="请输入文档内容（支持Markdown格式）"
                class="markdown-editor"
              ></textarea>
            </div>
            <div class="split-pane">
              <div class="markdown-content" v-html="renderedContent"></div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 文件上传区域 -->
      <BaseCard class="upload-section">
        <h2 class="section-title">附件文件</h2>
        <div class="upload-area">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.sql,.sh,.json,.xml,.html,.css,.yaml,.yml,.md"
            style="display: none"
          />
          <BaseButton variant="primary" @click="triggerFileUpload">
            选择文件
          </BaseButton>
          <span class="upload-hint">
            支持的文件类型：PDF、Word、Excel、图片、代码文件等
          </span>
        </div>

        <div v-if="document.attachments && document.attachments.length > 0" class="attachments-list">
          <div
            v-for="(attachment, index) in document.attachments"
            :key="index"
            class="attachment-item"
          >
            <span class="attachment-name">{{ attachment.filename }}</span>
            <button @click="removeAttachment(index)" class="remove-btn">×</button>
          </div>
        </div>
      </BaseCard>
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
import BaseInput from '@/components/BaseInput.vue';
import BaseSelect from '@/components/BaseSelect.vue';

const router = useRouter();
const route = useRoute();
const document = ref({
  title: '',
  content: '',
  categoryId: '',
  attachments: [],
  status: 'draft'
});
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const editorMode = ref('edit');
const fileInput = ref(null);

const isNewDocument = computed(() => {
  return route.params.id === undefined || route.name === 'DocumentNew';
});

const renderedContent = computed(() => {
  if (!document.value.content) return '';
  return marked(document.value.content);
});

// BaseSelect 选项格式化
const categoryOptions = computed(() =>
  categories.value.map((cat) => ({
    value: cat.id,
    label: cat.name
  }))
);

const loadDocument = async () => {
  if (isNewDocument.value) {
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const response = await documentApi.getDetail(route.params.id);
    document.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('加载文档失败:', err);
    alert('加载文档失败: ' + (err.response?.data?.message || err.message));
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await documentApi.getCategories();
    categories.value = response.data;
  } catch (err) {
    console.error('加载分类失败:', err);
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  for (const file of files) {
    // 为新文档创建临时附件对象
    const attachment = {
      filename: file.name,
      size: file.size,
      file: file,
      url: URL.createObjectURL(file) // 临时URL用于预览
    };

    document.value.attachments.push(attachment);
  }

  // 清空文件输入
  event.target.value = '';
};

const removeAttachment = (index) => {
  const attachment = document.value.attachments[index];
  if (attachment.url && attachment.url.startsWith('blob:')) {
    URL.revokeObjectURL(attachment.url);
  }
  document.value.attachments.splice(index, 1);
};

const saveDocument = async (status) => {
  if (!document.value.title.trim()) {
    alert('请输入文档标题');
    return;
  }

  if (!document.value.content.trim()) {
    alert('请输入文档内容');
    return;
  }

  try {
    saving.value = true;

    const data = {
      title: document.value.title,
      content: document.value.content,
      categoryId: document.value.categoryId,
      status: status
    };

    let response;
    if (isNewDocument.value) {
      response = await documentApi.create(data);

      // 上传附件
      if (document.value.attachments.length > 0) {
        for (const attachment of document.value.attachments) {
          if (attachment.file) {
            await documentApi.uploadAttachment(response.data.id, attachment.file);
          }
        }
      }

      router.push(`/documents/${response.data.id}`);
    } else {
      await documentApi.update(route.params.id, data);

      // 上传新附件
      if (document.value.attachments.length > 0) {
        for (const attachment of document.value.attachments) {
          if (attachment.file) {
            await documentApi.uploadAttachment(route.params.id, attachment.file);
          }
        }
      }

      router.push(`/documents/${route.params.id}`);
    }

    saving.value = false;
  } catch (err) {
    console.error('保存失败:', err);
    alert('保存失败: ' + (err.response?.data?.message || err.message));
    saving.value = false;
  }
};

const saveAsDraft = () => {
  saveDocument('draft');
};

const publishDocument = () => {
  saveDocument('published');
};

const goBack = () => {
  if (isNewDocument.value) {
    router.push('/documents');
  } else {
    router.push(`/documents/${route.params.id}`);
  }
};

onMounted(() => {
  loadCategories();
  loadDocument();
});
</script>

<style scoped>
.document-edit {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
}

.edit-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
  margin: 0 0 15px 0;
}

/* 编辑器 */
.editor-section {
  padding: 0;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.editor-tab {
  padding: 8px 16px;
  background: #fafafc;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.224px;
  transition: all 0.15s ease;
}

.editor-tab:hover {
  color: var(--color-text-primary);
}

.editor-tab.active {
  background: var(--color-accent);
  color: #ffffff;
}

.editor-container {
  min-height: 500px;
}

.editor-mode,
.preview-mode {
  padding: 20px;
}

/* 编辑器 textarea - Apple 输入样式 */
.markdown-editor {
  width: 100%;
  min-height: 450px;
  padding: 15px;
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  font-family: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: #fafafc;
  color: var(--color-text-primary);
  resize: vertical;
  outline: none;
  transition: border-color 0.15s ease;
}

.markdown-editor:focus {
  border-color: var(--color-accent);
}

.markdown-editor::placeholder {
  color: var(--color-text-tertiary);
}

.split-mode {
  display: flex;
  height: 500px;
}

.split-pane {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.split-pane:first-child {
  border-right: 1px solid var(--color-border);
}

.split-mode .markdown-editor {
  width: 100%;
  height: 100%;
  min-height: auto;
}

.markdown-content {
  line-height: 1.6;
  color: var(--color-text-primary);
  font-family: var(--font-text);
  font-size: 17px;
  letter-spacing: -0.374px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  font-family: var(--font-display);
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.markdown-content :deep(code) {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-micro);
  font-family: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-content :deep(pre) {
  background: #1e1e1e;
  padding: 15px;
  border-radius: var(--radius-standard);
  overflow-x: auto;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #d4d4d4;
}

/* 附件区 */
.upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #fafafc;
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  flex-wrap: wrap;
}

.upload-hint {
  color: var(--color-text-secondary);
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
}

.attachments-list {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #fafafc;
  border-radius: var(--radius-standard);
}

.attachment-name {
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
  color: var(--color-text-primary);
}

.remove-btn {
  font-size: 20px;
  color: var(--color-error);
  background: none;
  border: none;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--radius-standard);
  transition: background 0.15s ease;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* 响应式 */
@media (max-width: 834px) {
  .split-mode {
    flex-direction: column;
    height: auto;
  }

  .split-pane:first-child {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
}

@media (max-width: 640px) {
  .document-edit {
    padding: 24px 16px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .actions {
    flex-direction: column;
  }

  .actions .base-btn {
    width: 100%;
  }
}
</style>
