<template>
  <div class="pptx-viewer">
    <div v-if="loading" class="state-msg">加载中...</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else class="pptx-placeholder">
      <div class="placeholder-card">
        <div class="icon-wrapper" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
          </svg>
        </div>
        <h3 class="t-card-title">PowerPoint 演示文稿</h3>
        <p class="t-body hint">该文件类型暂不支持在浏览器中直接预览，请下载后使用 PowerPoint 或相关应用查看。</p>
        <div v-if="fileSize" class="meta t-caption">
          <span>文件大小: {{ fileSize }}</span>
        </div>
        <BaseButton variant="primary" @click="downloadFile">下载文件</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import BaseButton from '@/components/BaseButton.vue';

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const loading = ref(true);
const error = ref('');
const fileSize = ref('');

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const fetchFileInfo = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await fetch(props.url, { method: 'HEAD' });
    if (response.ok) {
      const length = response.headers.get('Content-Length');
      if (length) {
        fileSize.value = formatSize(parseInt(length, 10));
      }
    }
    loading.value = false;
  } catch (err) {
    // HEAD 请求失败不阻断下载功能，仅不显示文件大小
    loading.value = false;
  }
};

const downloadFile = () => {
  const link = document.createElement('a');
  link.href = props.url;
  link.download = '';
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
};

onMounted(() => {
  fetchFileInfo();
});

watch(() => props.url, () => {
  fileSize.value = '';
  fetchFileInfo();
});
</script>

<style scoped>
.pptx-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-standard);
  overflow: hidden;
}

.state-msg {
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-secondary);
}

.state-msg.error {
  color: var(--color-error);
}

.pptx-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 40px 48px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  max-width: 420px;
  text-align: center;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-circle);
  background: rgba(0, 113, 227, 0.1);
  color: var(--color-accent);
  margin-bottom: 4px;
}

.placeholder-card .t-card-title {
  color: var(--color-text-primary);
  margin: 0;
}

.hint {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.meta {
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
