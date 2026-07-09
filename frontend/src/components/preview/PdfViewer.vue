<template>
  <div class="pdf-viewer">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="pdf-container">
      <div class="toolbar">
        <button @click="previousPage" :disabled="currentPage <= 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage >= totalPages">下一页</button>
        <button @click="zoomIn">放大</button>
        <button @click="zoomOut">缩小</button>
        <span>缩放: {{ Math.round(scale * 100) }}%</span>
      </div>
      <div class="canvas-container">
        <canvas ref="pdfCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const props = defineProps({
  url: {
    type: String,
    required: true
  }
});

const pdfCanvas = ref(null);
const loading = ref(true);
const error = ref('');
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1.5);
const pdfDoc = ref(null);

const renderPage = async (pageNum) => {
  if (!pdfDoc.value || !pdfCanvas.value) return;

  const page = await pdfDoc.value.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale.value });
  const canvas = pdfCanvas.value;
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };

  await page.render(renderContext).promise;
};

const loadPdf = async () => {
  try {
    loading.value = true;
    error.value = '';

    const loadingTask = pdfjsLib.getDocument(props.url);
    pdfDoc.value = await loadingTask.promise;
    totalPages.value = pdfDoc.value.numPages;

    await renderPage(currentPage.value);
    loading.value = false;
  } catch (err) {
    error.value = `加载PDF失败: ${err.message}`;
    loading.value = false;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPage(currentPage.value);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    renderPage(currentPage.value);
  }
};

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 3);
  renderPage(currentPage.value);
};

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5);
  renderPage(currentPage.value);
};

onMounted(() => {
  loadPdf();
});

watch(() => props.url, () => {
  currentPage.value = 1;
  loadPdf();
});
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
}

.loading, .error {
  padding: 20px;
  text-align: center;
}

.error {
  color: var(--color-error);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar button {
  padding: 5px 15px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar button:hover:not(:disabled) {
  opacity: 0.9;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

canvas {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>