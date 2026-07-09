<template>
  <div class="document-edit">
    <div class="header">
      <h1>{{ isNewDocument ? '新建文档' : '编辑文档' }}</h1>
      <div class="actions">
        <button @click="goBack" class="btn-secondary">取消</button>
        <button @click="saveAsDraft" class="btn-secondary" :disabled="saving">
          {{ saving ? '保存中...' : '保存为草稿' }}
        </button>
        <button @click="publishDocument" class="btn-primary" :disabled="saving">
          {{ saving ? '发布中...' : '发布' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="edit-container">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="form-group">
          <label>标题</label>
          <input
            v-model="document.title"
            type="text"
            placeholder="请输入文档标题"
            class="input-field"
          />
        </div>

        <div class="form-group">
          <label>分类</label>
          <select v-model="document.categoryId" class="select-field">
            <option value="">请选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Markdown编辑器 -->
      <div class="editor-section">
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
      </div>

      <!-- 文件上传区域 -->
      <div class="upload-section">
        <h2>附件文件</h2>
        <div class="upload-area">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.swift,.kt,.sql,.sh,.json,.xml,.html,.css,.yaml,.yml,.md"
            style="display: none"
          />
          <button @click="triggerFileUpload" class="upload-btn">
            选择文件
          </button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { documentApi } from '../api/document';

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
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
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
  padding: 10px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-primary);
  opacity: 0.8;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.edit-container {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 15px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.input-field,
.select-field {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.input-field:focus,
.select-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.editor-section {
  background: var(--bg-primary);
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
}

.editor-tabs {
  display: flex;
  gap: 5px;
  padding: 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.editor-tab {
  padding: 8px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
}

.editor-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.editor-container {
  min-height: 500px;
}

.editor-mode,
.preview-mode {
  padding: 20px;
}

.markdown-editor {
  width: 100%;
  min-height: 450px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
}

.markdown-editor:focus {
  outline: none;
  border-color: var(--color-primary);
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
  border-right: 1px solid var(--border-color);
}

.split-mode .markdown-editor {
  width: 100%;
  height: 100%;
  min-height: auto;
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

.upload-section {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.upload-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: 6px;
}

.upload-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.upload-btn:hover {
  opacity: 0.9;
}

.upload-hint {
  color: var(--text-secondary);
  font-size: 14px;
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
  padding: 10px 15px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.attachment-name {
  font-size: 14px;
  color: var(--text-primary);
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
  border-radius: 4px;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.1);
}
</style>