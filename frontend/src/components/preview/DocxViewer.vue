<template>
  <div class="docx-viewer">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="document-content" v-html="htmlContent"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import mammoth from 'mammoth';

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const loading = ref(true);
const error = ref('');
const htmlContent = ref('');

const loadDocx = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await fetch(props.url);
    const arrayBuffer = await response.arrayBuffer();

    const result = await mammoth.convertToHtml({ arrayBuffer });
    htmlContent.value = result.value;

    loading.value = false;
  } catch (err) {
    error.value = `加载Word文档失败: ${err.message}`;
    loading.value = false;
  }
};

onMounted(() => {
  loadDocx();
});

watch(() => props.url, () => {
  loadDocx();
});
</script>

<style scoped>
.docx-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: auto;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: var(--color-error);
}

.document-content {
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.6;
}

.document-content :deep(h1),
.document-content :deep(h2),
.document-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.document-content :deep(p) {
  margin-bottom: 12px;
}

.document-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.document-content :deep(table td),
.document-content :deep(table th) {
  border: 1px solid var(--border-color);
  padding: 8px 12px;
}

.document-content :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>