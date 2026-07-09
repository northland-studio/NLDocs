<template>
  <div class="documents-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <h1 class="t-section-heading">文档</h1>
    </header>

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

        <BaseSelect
          v-model="selectedCategoryId"
          placeholder="全部分类"
          :options="categoryOptions"
          class="filter-select"
          @update:modelValue="handleCategoryChange"
        />

        <BaseSelect
          v-if="canCreate"
          v-model="selectedStatus"
          placeholder="全部状态"
          :options="statusOptions"
          class="filter-select"
          @update:modelValue="handleStatusChange"
        />
      </div>

      <div class="toolbar-right">
        <BaseButton v-if="canCreate" variant="primary" @click="createNewDocument">
          <PlusIcon class="btn-icon" />
          新建文档
        </BaseButton>
      </div>
    </div>

    <!-- 文档列表 -->
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="documents.length === 0" class="empty-state">
      <DocumentIcon class="empty-icon" />
      <p>暂无文档</p>
    </div>

    <div v-else class="document-grid">
      <BaseCard
        v-for="doc in documents"
        :key="doc.id"
        class="document-card"
        elevated
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
              <FolderIcon class="meta-icon" />
              {{ doc.category_name }}
            </span>
            <span class="meta-item">
              <UserIcon class="meta-icon" />
              {{ doc.author_name }}
            </span>
          </div>
          <span class="meta-time">{{ formatDate(doc.updated_at || doc.created_at) }}</span>
        </div>
      </BaseCard>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <BaseButton variant="filter" :disabled="currentPage === 1" @click="prevPage">
        上一页
      </BaseButton>
      <div class="page-info">
        <span class="current-page">{{ currentPage }}</span>
        <span class="page-divider">/</span>
        <span class="total-pages">{{ totalPages }}</span>
      </div>
      <BaseButton variant="filter" :disabled="currentPage >= totalPages" @click="nextPage">
        下一页
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { documentsApi } from '@/api/documents';
import BaseButton from '@/components/BaseButton.vue';
import BaseCard from '@/components/BaseCard.vue';
import BaseSelect from '@/components/BaseSelect.vue';
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

// BaseSelect 选项格式化
const categoryOptions = computed(() =>
  categories.value.map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.document_count})`
  }))
);

const statusOptions = computed(() => [
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' }
]);

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
  max-width: 980px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-header .t-section-heading {
  color: var(--color-text-primary);
  margin: 0;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

/* 搜索框 - Apple filter 风格 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-input {
  padding: 10px 36px 10px 40px;
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  background: #fafafc;
  color: var(--color-text-primary);
  font-family: var(--font-text);
  font-size: 17px;
  letter-spacing: -0.374px;
  width: 280px;
  transition: border-color 0.15s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--color-text-primary);
}

.filter-select {
  min-width: 160px;
}

/* 加载和空状态 */
.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--color-text-secondary);
  font-family: var(--font-text);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 17px;
  letter-spacing: -0.374px;
}

/* 文档网格 - 每行3列 */
.document-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

/* 文档卡片 */
.document-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.document-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: 0.231px;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.33;
  letter-spacing: -0.12px;
  white-space: nowrap;
}

.status-badge.draft {
  background: var(--color-warning);
  color: #ffffff;
}

.status-badge.published {
  background: var(--color-success);
  color: #ffffff;
}

.card-content {
  flex: 1;
  font-family: var(--font-text);
  font-size: 14px;
  line-height: 1.43;
  letter-spacing: -0.224px;
  color: var(--color-text-secondary);
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
  border-top: 1px solid var(--color-border);
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
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-secondary);
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.meta-time {
  font-family: var(--font-text);
  font-size: 12px;
  letter-spacing: -0.12px;
  color: var(--color-text-tertiary);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-text);
  font-size: 14px;
  letter-spacing: -0.224px;
  color: var(--color-text-secondary);
}

.current-page {
  font-weight: 600;
  color: var(--color-accent);
  font-size: 16px;
}

.page-divider {
  color: var(--color-text-tertiary);
}

.total-pages {
  color: var(--color-text-secondary);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* 响应式 */
@media (max-width: 834px) {
  .document-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .documents-page {
    padding: 24px 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .document-grid {
    grid-template-columns: 1fr;
  }
}
</style>
