<template>
  <div class="document-list">
    <div class="header">
      <h1>文档列表</h1>
      <button @click="createNewDocument" class="btn-primary">
        新建文档
      </button>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索文档..."
        class="search-input"
        @input="handleSearch"
      />
      <select v-model="selectedCategory" @change="loadDocuments" class="category-select">
        <option value="">所有分类</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="documents">
      <div v-if="documents.length === 0" class="empty">
        暂无文档
      </div>
      <div
        v-else
        v-for="doc in documents"
        :key="doc.id"
        class="document-card"
        @click="viewDocument(doc.id)"
      >
        <div class="doc-header">
          <h3>{{ doc.title }}</h3>
          <span :class="['status', doc.status]">{{ doc.status }}</span>
        </div>
        <p class="doc-content">{{ truncateContent(doc.content) }}</p>
        <div class="doc-footer">
          <span class="author">{{ doc.author }}</span>
          <span class="date">{{ formatDate(doc.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="btn-page"
      >
        上一页
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn-page"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { documentApi } from '../api/document';

const router = useRouter();
const documents = ref([]);
const categories = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const selectedCategory = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const pageSize = 10;

const loadDocuments = async () => {
  try {
    loading.value = true;
    error.value = '';

    const params = {
      page: currentPage.value,
      pageSize,
      search: searchQuery.value,
      category: selectedCategory.value
    };

    const response = await documentApi.getList(params);
    documents.value = response.data.documents;
    totalPages.value = response.data.totalPages;
    loading.value = false;
  } catch (err) {
    error.value = `加载文档列表失败: ${err.response?.data?.message || err.message}`;
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

const handleSearch = () => {
  currentPage.value = 1;
  loadDocuments();
};

const changePage = (page) => {
  currentPage.value = page;
  loadDocuments();
};

const viewDocument = (id) => {
  router.push(`/documents/${id}`);
};

const createNewDocument = () => {
  router.push('/documents/new');
};

const truncateContent = (content) => {
  if (!content) return '';
  return content.length > 100 ? content.substring(0, 100) + '...' : content;
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

onMounted(() => {
  loadDocuments();
  loadCategories();
});
</script>

<style scoped>
.document-list {
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

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.category-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-width: 150px;
}

.loading, .error, .empty {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.error {
  color: var(--color-error);
}

.documents {
  display: grid;
  gap: 15px;
}

.document-card {
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.document-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.doc-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
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

.doc-content {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
}

.doc-footer {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.btn-page {
  padding: 8px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
}

.btn-page:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>