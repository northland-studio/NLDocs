<template>
  <div class="announcement-edit-page">
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        ← 返回
      </button>
      <h1>{{ isNew ? '新建公告' : '编辑公告' }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      加载中...
    </div>

    <form v-else @submit.prevent class="edit-form">
      <!-- 标题 -->
      <div class="form-group">
        <label for="title">标题</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="请输入公告标题"
          required
          class="input-field"
        />
      </div>

      <!-- 内容编辑器 -->
      <div class="form-group">
        <label>内容 (Markdown格式)</label>
        <div class="editor-container">
          <div class="editor-tabs">
            <button
              :class="['tab-btn', { active: editorMode === 'edit' }]"
              @click="editorMode = 'edit'"
            >
              编辑
            </button>
            <button
              :class="['tab-btn', { active: editorMode === 'preview' }]"
              @click="editorMode = 'preview'"
            >
              预览
            </button>
          </div>
          <div class="editor-content">
            <textarea
              v-show="editorMode === 'edit'"
              v-model="form.content"
              placeholder="请输入公告内容，支持 Markdown 格式..."
              class="content-editor"
              rows="20"
            ></textarea>
            <div
              v-show="editorMode === 'preview'"
              class="content-preview"
              v-html="renderedContent"
            ></div>
          </div>
        </div>
      </div>

      <!-- 设置选项 -->
      <div class="settings-section">
        <!-- 置顶开关 -->
        <div class="setting-item">
          <label class="checkbox-label">
            <input
              v-model="form.isPinned"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">置顶公告</span>
          </label>
          <p class="setting-desc">置顶的公告将在列表顶部优先显示</p>
        </div>

        <!-- 定时发布 -->
        <div class="setting-item">
          <label class="checkbox-label">
            <input
              v-model="enableScheduledPublish"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">定时发布</span>
          </label>
          <div v-if="enableScheduledPublish" class="scheduled-input">
            <input
              v-model="scheduledDate"
              type="datetime-local"
              class="input-field"
              :min="minScheduledDate"
            />
            <p class="setting-desc">公告将在指定时间自动发布</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="saveDraft" class="btn-secondary" :disabled="saving">
          <span v-if="savingDraft">保存中...</span>
          <span v-else>保存草稿</span>
        </button>
        <button @click="publish" class="btn-primary" :disabled="saving">
          <span v-if="savingPublish">发布中...</span>
          <span v-else>{{ form.status === 'draft' ? '发布公告' : '保存更改' }}</span>
        </button>
      </div>

      <!-- 删除按钮 (仅编辑模式) -->
      <div v-if="!isNew && form.status !== 'published'" class="delete-section">
        <button @click="deleteAnnouncement" class="btn-delete">
          删除公告
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { announcementApi } from '@/api/announcements';

const router = useRouter();
const route = useRoute();

const isNew = computed(() => route.params.id === 'new' || !route.params.id);
const announcementId = computed(() => route.params.id);

const loading = ref(false);
const saving = ref(false);
const savingDraft = ref(false);
const savingPublish = ref(false);
const editorMode = ref('edit');

const form = ref({
  title: '',
  content: '',
  isPinned: false,
  status: 'draft',
  scheduledPublishAt: null
});

const enableScheduledPublish = ref(false);
const scheduledDate = ref('');

const minScheduledDate = computed(() => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
});

const renderedContent = computed(() => {
  if (!form.value.content) return '<p class="empty-preview">暂无内容</p>';
  return marked(form.value.content);
});

const fetchAnnouncement = async () => {
  if (isNew.value) return;

  loading.value = true;
  try {
    const response = await announcementApi.getDetail(announcementId.value);
    const data = response.data;
    form.value = {
      title: data.title || '',
      content: data.content || '',
      isPinned: data.isPinned || false,
      status: data.status || 'draft',
      scheduledPublishAt: data.scheduledPublishAt || null
    };

    if (data.scheduledPublishAt) {
      enableScheduledPublish.value = true;
      const date = new Date(data.scheduledPublishAt);
      scheduledDate.value = date.toISOString().slice(0, 16);
    }
  } catch (error) {
    console.error('获取公告失败:', error);
    alert('获取公告失败');
    router.push('/announcements');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (hasUnsavedChanges()) {
    const confirmed = confirm('有未保存的更改，确定要离开吗？');
    if (!confirmed) return;
  }
  router.push('/announcements');
};

const hasUnsavedChanges = () => {
  // 简单的检查是否有更改
  return form.value.title || form.value.content;
};

const saveDraft = async () => {
  if (!validateForm()) return;

  saving.value = true;
  savingDraft.value = true;
  try {
    const data = {
      title: form.value.title,
      content: form.value.content,
      isPinned: form.value.isPinned,
      status: 'draft'
    };

    if (isNew.value) {
      await announcementApi.create(data);
    } else {
      await announcementApi.update(announcementId.value, data);
    }

    alert('草稿保存成功');
    router.push('/announcements');
  } catch (error) {
    console.error('保存草稿失败:', error);
    alert(error.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
    savingDraft.value = false;
  }
};

const publish = async () => {
  if (!validateForm()) return;

  saving.value = true;
  savingPublish.value = true;
  try {
    const data = {
      title: form.value.title,
      content: form.value.content,
      isPinned: form.value.isPinned,
      status: 'published'
    };

    if (enableScheduledPublish.value && scheduledDate.value) {
      data.scheduledPublishAt = new Date(scheduledDate.value).toISOString();
      data.status = 'scheduled';
    }

    if (isNew.value) {
      const response = await announcementApi.create(data);
      if (data.status === 'published') {
        alert('公告发布成功');
      } else {
        alert('公告已设置定时发布');
      }
    } else {
      await announcementApi.update(announcementId.value, data);
      if (data.status === 'published') {
        alert('公告更新成功');
      } else {
        alert('公告已设置定时发布');
      }
    }

    router.push('/announcements');
  } catch (error) {
    console.error('发布公告失败:', error);
    alert(error.response?.data?.message || '发布失败');
  } finally {
    saving.value = false;
    savingPublish.value = false;
  }
};

const deleteAnnouncement = async () => {
  const confirmed = confirm('确定要删除此公告吗？此操作不可恢复。');
  if (!confirmed) return;

  try {
    await announcementApi.delete(announcementId.value);
    alert('公告已删除');
    router.push('/announcements');
  } catch (error) {
    console.error('删除公告失败:', error);
    alert(error.response?.data?.message || '删除失败');
  }
};

const validateForm = () => {
  if (!form.value.title.trim()) {
    alert('请输入公告标题');
    return false;
  }
  if (!form.value.content.trim()) {
    alert('请输入公告内容');
    return false;
  }
  if (enableScheduledPublish.value && !scheduledDate.value) {
    alert('请选择定时发布时间');
    return false;
  }
  if (enableScheduledPublish.value && scheduledDate.value) {
    const scheduled = new Date(scheduledDate.value);
    const now = new Date();
    if (scheduled <= now) {
      alert('定时发布时间必须大于当前时间');
      return false;
    }
  }
  return true;
};

onMounted(() => {
  fetchAnnouncement();
});
</script>

<style scoped>
.announcement-edit-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--accent-hover);
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.edit-form {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.editor-container {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-primary);
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
}

.editor-content {
  min-height: 400px;
}

.content-editor {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  background: var(--input-bg);
  border: none;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  resize: vertical;
  outline: none;
}

.content-editor::placeholder {
  color: var(--text-tertiary);
}

.content-preview {
  padding: 16px;
  min-height: 400px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
}

.empty-preview {
  color: var(--text-tertiary);
}

.content-preview :deep(h1),
.content-preview :deep(h2),
.content-preview :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
}

.content-preview :deep(p) {
  margin: 0 0 16px 0;
}

.content-preview :deep(ul),
.content-preview :deep(ol) {
  margin: 0 0 16px 0;
  padding-left: 24px;
}

.content-preview :deep(code) {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 14px;
}

.settings-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.setting-item {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 4px;
  background: var(--input-bg);
  transition: all 0.2s;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-desc {
  margin-top: 6px;
  margin-left: 32px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.scheduled-input {
  margin-top: 12px;
  margin-left: 32px;
}

.scheduled-input .input-field {
  width: auto;
  min-width: 250px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.btn-primary {
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.btn-delete {
  padding: 12px 24px;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: var(--error);
  color: white;
}
</style>