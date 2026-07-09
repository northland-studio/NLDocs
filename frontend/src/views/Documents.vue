<template>
  <div class="documents-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <SearchIcon class="search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索文档..."
            @keyup.enter="handleSearch"
            class="search-input"
          />
          <button v-if="searchKeyword" @click="clearSearch" class="clear-btn">×</button>
        </div>

        <select v-model="selectedCategoryId" @change="handleCategoryChange" class="category-select">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }} ({{ cat.document_count }})
          </option>
        </select>

        <select v-if="canCreate" v-model="selectedStatus" @change="handleStatusChange" class="status-select">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
      </div>

      <div class="toolbar-right">
        <button v-if="canCreate" @click="createNewDocument" class="create-btn">
          <PlusIcon />
          新建文档
        </button>
      </div>
    </div>

    <!-- 文档列表 -->
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="documents.length === 0" class="empty-state">
      <DocumentIcon class="empty-icon" />
      <p>暂无文档</p>
    </div>

    <div v-else class="document-grid">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="document-card"
        @click="viewDocument(doc.id)"
      >
        <div class="card-header">
          <h3 class="card-title">{{ doc.title }}</h3>
          <span v-if="canCreate && doc.status === 'draft'" class="status-badge draft">草稿</span>
          <span v-else-if="canCreate && doc.status === 'published'" class="status-badge published">已发布</span>
        </div>

        <p class="card-content">
          {{ getContentPreview(doc.content) }}
        </p>

        <div class="card-footer">
          <div class="card-meta">
            <span v-if="doc.category_name" class="meta-item">
              <FolderIcon />
              {{ doc.category_name }}
            </span>
            <span class="meta-item">
              <UserIcon />
              {{ doc.author_name }}
            </span>
          </div>
          <span class="meta-time">{{ formatDate(doc.updated_at || doc.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
        上一页
      </button>
      <div class="page-info">
        <span class="current-page">{{ currentPage }}</span>
        <span class="page-divider">/</span>
        <span class="total-pages">{{ totalPages }}</span>
      </div>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">
        下一页
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { documentsApi } from '@/api/documents';
import SearchIcon from '@/assets/icons/SearchIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import DocumentIcon from '@/assets/icons/DocumentIcon.vue';
import FolderIcon from '@/assets/icons/FolderIcon.vue';
import UserIcon from '@/assets/icons/UserIcon.vue';

const router = useRouter();

// 状态
const documents = ref([]);
const categories = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const selectedCategoryId = ref('');
const selectedStatus = ref('');
const searchKeyword = ref('');

// 用户权限
const user = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});

const canCreate = computed(() => {
  // Level >= 1 可以创建文档
  return (user.value.level || 0) >= 1;
});

// 获取内容预览
const getContentPreview = (content) => {
  if (!content) return '暂无内容';
  const stripped = content.replace(/<[^>]+>/g, '').replace(/[#*`_~\[\]]/g, '');
  return stripped.substring(0, 150) + (stripped.length > 150 ? '...' : '');
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
    }
    return `${hours}小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
};

// 获取文档列表
const fetchDocuments = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: 12,
    };

    if (selectedCategoryId.value) {
      params.category_id = selectedCategoryId.value;
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value;
    }
    if (selectedStatus.value) {
      params.status = selectedStatus.value;
    }

    const response = await documentsApi.getList(params);

    if (response.data.success) {
      documents.value = response.data.data.list;
      total.value = response.data.data.total;
      totalPages.value = response.data.data.totalPages;
    }
  } catch (error) {
    console.error('获取文档列表失败:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await documentsApi.getCategories();
    if (response.data.success) {
      categories.value = response.data.data;
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
  }
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  fetchDocuments();
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchDocuments();
};

// 分类变更
const handleCategoryChange = () => {
  currentPage.value = 1;
  fetchDocuments();
};

// 状态变更
const handleStatusChange = () => {
  currentPage.value = 1;
  fetchDocuments();
};

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchDocuments();
    window.scrollTo(0, 0);
  }
};

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchDocuments();
    window.scrollTo(0, 0);
  }
};

// 查看文档
const viewDocument = (id) => {
  router.push(`/documents/${id}`);
};

// 创建新文档
const createNewDocument = () => {
  router.push('/documents/new');
};

// 初始化
onMounted(() => {
  fetchDocuments();
  fetchCategories();
});
</script>

<style scoped>
.documents-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  padding: 10px 36px 10px 40px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
  width: 280px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--text-primary);
}

.category-select,
.status-select {
  padding: 10px 32px 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.category-select:focus,
.status-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 74, 173, 0.3);
}

.create-btn svg {
  width: 18px;
  height: 18px;
}

/* 加载和空状态 */
.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
}

/* 文档网格 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

/* 文档卡片 */
.document-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.draft {
  background: var(--warning);
  color: white;
}

.status-badge.published {
  background: var(--success);
  color: white;
}

.card-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

.meta-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.page-btn {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.current-page {
  font-weight: 600;
  color: var(--accent);
  font-size: 16px;
}

.page-divider {
  color: var(--text-tertiary);
}

.total-pages {
  color: var(--text-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .documents-page {
    padding: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .category-select,
  .status-select {
    width: 100%;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .document-grid {
    grid-template-columns: 1fr;
  }
}
</style>