<template>
  <div class="admin-page">
    <div v-if="!isAdmin" class="access-denied">
      <h2>访问受限</h2>
      <p>您需要超级管理员权限（Level >= 2）才能访问此页面</p>
      <router-link to="/" class="back-link">返回首页</router-link>
    </div>

    <div v-else>
      <!-- 系统统计 -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon users">
              <UserIcon />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.users }}</span>
              <span class="stat-label">注册用户</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon documents">
              <DocumentIcon />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.documents }}</span>
              <span class="stat-label">文档总数</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon published">
              <CheckIcon />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.publishedDocuments }}</span>
              <span class="stat-label">已发布</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon pending">
              <ApprovalIcon />
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats.pendingApprovals }}</span>
              <span class="stat-label">待审核</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab导航 -->
      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="admin-section">
        <div class="section-header">
          <h3>用户管理</h3>
          <div class="search-box">
            <input
              v-model="userSearchKeyword"
              type="text"
              placeholder="搜索用户..."
              @keyup.enter="fetchUsers"
              class="search-input"
            />
          </div>
        </div>

        <div v-if="loadingUsers" class="loading">加载中...</div>

        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>权限等级</th>
                <th>称号</th>
                <th>贡献点</th>
                <th>注册时间</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.username }}</td>
                <td>
                  <span class="level-badge" :class="`level-${user.level}`">
                    {{ getLevelText(user.level) }}
                  </span>
                </td>
                <td>{{ user.title || '-' }}</td>
                <td>{{ user.contribution || 0 }}</td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>{{ formatDate(user.last_login) }}</td>
                <td>
                  <button
                    v-if="user.id !== currentUser.id"
                    @click="openLevelDialog(user)"
                    class="action-btn"
                  >
                    修改权限
                  </button>
                  <span v-else class="disabled-text">当前用户</span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="usersPagination.totalPages > 1" class="pagination">
            <button @click="prevUserPage" :disabled="usersPagination.page === 1" class="page-btn">
              上一页
            </button>
            <span class="page-info">
              {{ usersPagination.page }} / {{ usersPagination.totalPages }}
            </span>
            <button
              @click="nextUserPage"
              :disabled="usersPagination.page >= usersPagination.totalPages"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- 分类管理 -->
      <div v-if="activeTab === 'categories'" class="admin-section">
        <div class="section-header">
          <h3>分类管理</h3>
          <button @click="openCategoryDialog()" class="create-btn">
            <PlusIcon />
            新建分类
          </button>
        </div>

        <div v-if="loadingCategories" class="loading">加载中...</div>

        <div v-else class="categories-list">
          <div
            v-for="category in categories"
            :key="category.id"
            class="category-item"
          >
            <div class="category-info">
              <h4 class="category-name">{{ category.name }}</h4>
              <p v-if="category.description" class="category-desc">{{ category.description }}</p>
              <div class="category-stats">
                <span class="stat-text">文档总数: {{ category.document_count }}</span>
                <span class="stat-text">已发布: {{ category.published_count }}</span>
              </div>
            </div>
            <div class="category-actions">
              <button @click="openCategoryDialog(category)" class="edit-btn">
                <EditIcon />
                编辑
              </button>
              <button
                @click="deleteCategory(category)"
                :disabled="category.document_count > 0"
                class="delete-btn"
              >
                <DeleteIcon />
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统设置 -->
      <div v-if="activeTab === 'settings'" class="admin-section">
        <div class="section-header">
          <h3>系统设置</h3>
        </div>

        <div class="settings-grid">
          <div class="settings-card">
            <h4>OAuth配置</h4>
            <div class="settings-info">
              <div class="info-item">
                <span class="info-label">认证提供商</span>
                <span class="info-value">{{ settings.oauth?.provider || '未配置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Token URL</span>
                <span class="info-value">{{ settings.oauth?.token_url || '未配置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Verify URL</span>
                <span class="info-value">{{ settings.oauth?.verify_url || '未配置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Client ID</span>
                <span class="info-value">{{ settings.oauth?.client_id || '未配置' }}</span>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <h4>SMTP配置（预留）</h4>
            <div class="settings-info">
              <div class="info-item">
                <span class="info-label">SMTP服务器</span>
                <span class="info-value">{{ settings.smtp?.host || '未配置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">SMTP端口</span>
                <span class="info-value">{{ settings.smtp?.port || '未配置' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">SMTP用户</span>
                <span class="info-value">{{ settings.smtp?.user || '未配置' }}</span>
              </div>
            </div>
            <p class="settings-note">SMTP邮件服务配置功能将在后续版本中提供</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改权限等级对话框 -->
    <div v-if="showLevelDialog" class="dialog-overlay" @click="closeLevelDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>修改用户权限等级</h3>
          <button @click="closeLevelDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <p class="dialog-info">
            用户：<strong>{{ selectedUser?.username }}</strong>
          </p>
          <div class="form-group">
            <label>权限等级</label>
            <select v-model="newLevel" class="form-select">
              <option value="0">0 - 普通成员</option>
              <option value="1">1 - 管理员</option>
              <option value="2">2 - 超级管理员</option>
              <option value="3">3 - 文档管理员</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeLevelDialog" class="cancel-btn">取消</button>
          <button @click="updateUserLevel" class="submit-btn">确认修改</button>
        </div>
      </div>
    </div>

    <!-- 分类编辑对话框 -->
    <div v-if="showCategoryDialog" class="dialog-overlay" @click="closeCategoryDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingCategory ? '编辑分类' : '新建分类' }}</h3>
          <button @click="closeCategoryDialog" class="close-btn">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>分类名称 *</label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="请输入分类名称"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="categoryForm.description"
              placeholder="请输入分类描述（可选）"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button @click="closeCategoryDialog" class="cancel-btn">取消</button>
          <button @click="submitCategory" class="submit-btn">
            {{ editingCategory ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '@/api/admin';
import UserIcon from '@/assets/icons/UserIcon.vue';
import DocumentIcon from '@/assets/icons/DocumentIcon.vue';
import CheckIcon from '@/assets/icons/CheckIcon.vue';
import ApprovalIcon from '@/assets/icons/ApprovalIcon.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import EditIcon from '@/assets/icons/EditIcon.vue';
import DeleteIcon from '@/assets/icons/DeleteIcon.vue';

const router = useRouter();

// 当前用户
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
});

// 检查是否为管理员
const isAdmin = computed(() => (currentUser.value.level || 0) >= 2);

// Tab导航
const tabs = [
  { id: 'users', name: '用户管理' },
  { id: 'categories', name: '分类管理' },
  { id: 'settings', name: '系统设置' }
];
const activeTab = ref('users');

// 统计数据
const stats = ref({
  users: 0,
  documents: 0,
  publishedDocuments: 0,
  pendingApprovals: 0
});

// 用户管理
const users = ref([]);
const loadingUsers = ref(false);
const userSearchKeyword = ref('');
const usersPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1
});

// 分类管理
const categories = ref([]);
const loadingCategories = ref(false);

// 系统设置
const settings = ref({
  oauth: {},
  smtp: {}
});

// 权限等级对话框
const showLevelDialog = ref(false);
const selectedUser = ref(null);
const newLevel = ref(0);

// 分类对话框
const showCategoryDialog = ref(false);
const editingCategory = ref(null);
const categoryForm = ref({
  name: '',
  description: ''
});

// 获取权限等级文本
const getLevelText = (level) => {
  const levels = {
    0: '普通成员',
    1: '管理员',
    2: '超级管理员',
    3: '文档管理员'
  };
  return levels[level || 0] || '普通成员';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await adminApi.getStats();
    if (response.data.success) {
      stats.value = response.data.data;
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

// 获取用户列表
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const response = await adminApi.getUsers({
      page: usersPagination.value.page,
      limit: usersPagination.value.limit,
      keyword: userSearchKeyword.value
    });

    if (response.data.success) {
      users.value = response.data.data.users;
      usersPagination.value = response.data.data.pagination;
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    if (error.response?.status === 403) {
      router.push('/');
    }
  } finally {
    loadingUsers.value = false;
  }
};

// 用户分页
const prevUserPage = () => {
  if (usersPagination.value.page > 1) {
    usersPagination.value.page--;
    fetchUsers();
  }
};

const nextUserPage = () => {
  if (usersPagination.value.page < usersPagination.value.totalPages) {
    usersPagination.value.page++;
    fetchUsers();
  }
};

// 打开权限等级对话框
const openLevelDialog = (user) => {
  selectedUser.value = user;
  newLevel.value = user.level || 0;
  showLevelDialog.value = true;
};

// 关闭权限等级对话框
const closeLevelDialog = () => {
  showLevelDialog.value = false;
  selectedUser.value = null;
};

// 更新用户权限等级
const updateUserLevel = async () => {
  try {
    const response = await adminApi.updateUserLevel(
      selectedUser.value.id,
      parseInt(newLevel.value)
    );

    if (response.data.success) {
      // 更新本地数据
      const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
      if (userIndex !== -1) {
        users.value[userIndex].level = parseInt(newLevel.value);
      }
      closeLevelDialog();
      alert('权限等级已更新');
    }
  } catch (error) {
    console.error('更新权限等级失败:', error);
    alert(error.response?.data?.message || '更新失败');
  }
};

// 获取分类列表
const fetchCategories = async () => {
  loadingCategories.value = true;
  try {
    const response = await adminApi.getCategories();
    if (response.data.success) {
      categories.value = response.data.data;
    }
  } catch (error) {
    console.error('获取分类列表失败:', error);
    if (error.response?.status === 403) {
      router.push('/');
    }
  } finally {
    loadingCategories.value = false;
  }
};

// 打开分类对话框
const openCategoryDialog = (category = null) => {
  editingCategory.value = category;
  categoryForm.value = {
    name: category?.name || '',
    description: category?.description || ''
  };
  showCategoryDialog.value = true;
};

// 关闭分类对话框
const closeCategoryDialog = () => {
  showCategoryDialog.value = false;
  editingCategory.value = null;
  categoryForm.value = { name: '', description: '' };
};

// 提交分类
const submitCategory = async () => {
  if (!categoryForm.value.name) {
    alert('分类名称不能为空');
    return;
  }

  try {
    if (editingCategory.value) {
      // 更新分类
      const response = await adminApi.updateCategory(
        editingCategory.value.id,
        categoryForm.value
      );

      if (response.data.success) {
        // 更新本地数据
        const categoryIndex = categories.value.findIndex(c => c.id === editingCategory.value.id);
        if (categoryIndex !== -1) {
          categories.value[categoryIndex] = response.data.data;
        }
        closeCategoryDialog();
        alert('分类已更新');
      }
    } else {
      // 创建分类
      const response = await adminApi.createCategory(categoryForm.value);

      if (response.data.success) {
        categories.value.push(response.data.data);
        closeCategoryDialog();
        alert('分类已创建');
      }
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert(error.response?.data?.message || '操作失败');
  }
};

// 删除分类
const deleteCategory = async (category) => {
  if (category.document_count > 0) {
    alert('该分类下还有文档，无法删除');
    return;
  }

  if (!confirm(`确定要删除分类"${category.name}"吗？`)) {
    return;
  }

  try {
    const response = await adminApi.deleteCategory(category.id);

    if (response.data.success) {
      categories.value = categories.value.filter(c => c.id !== category.id);
      alert('分类已删除');
    }
  } catch (error) {
    console.error('删除分类失败:', error);
    alert(error.response?.data?.message || '删除失败');
  }
};

// 获取系统设置
const fetchSettings = async () => {
  try {
    const response = await adminApi.getSettings();
    if (response.data.success) {
      settings.value = response.data.data;
    }
  } catch (error) {
    console.error('获取系统设置失败:', error);
  }
};

// 初始化
onMounted(() => {
  if (isAdmin.value) {
    fetchStats();
    fetchUsers();
    fetchCategories();
    fetchSettings();
  }
});
</script>

<style scoped>
.admin-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 访问受限提示 */
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  text-align: center;
}

.access-denied h2 {
  color: var(--error);
  margin: 0 0 16px 0;
}

.access-denied p {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.back-link {
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  text-decoration: none;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.users {
  background: var(--info);
}

.stat-icon.documents {
  background: var(--accent);
}

.stat-icon.published {
  background: var(--success);
}

.stat-icon.pending {
  background: var(--warning);
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
}

/* Tab导航 */
.admin-tabs {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
}

.tab-btn {
  padding: 16px 32px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: var(--bg-hover);
}

.tab-btn.active {
  background: var(--card-bg);
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
}

/* 管理区块 */
.admin-section {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 0 0 12px 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.search-box {
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
  width: 240px;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: var(--accent-hover);
}

.create-btn svg {
  width: 16px;
  height: 16px;
}

/* 加载状态 */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-secondary);
}

/* 用户表格 */
.users-table {
  overflow-x: auto;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.users-table th {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.users-table td {
  color: var(--text-secondary);
  font-size: 14px;
}

.users-table tr:hover {
  background: var(--bg-hover);
}

.level-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.level-badge.level-0 {
  background: var(--text-tertiary);
  color: white;
}

.level-badge.level-1 {
  background: var(--success);
  color: white;
}

.level-badge.level-2 {
  background: var(--warning);
  color: white;
}

.level-badge.level-3 {
  background: var(--info);
  color: white;
}

.action-btn {
  padding: 6px 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--accent-hover);
}

.disabled-text {
  color: var(--text-tertiary);
  font-size: 13px;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
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
  color: var(--text-secondary);
  font-size: 13px;
}

/* 分类列表 */
.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.category-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.category-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.category-stats {
  display: flex;
  gap: 12px;
}

.stat-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

.category-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn,
.delete-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.delete-btn:hover:not(:disabled) {
  background: var(--error);
  color: white;
  border-color: var(--error);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn svg,
.delete-btn svg {
  width: 14px;
  height: 14px;
}

/* 系统设置 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.settings-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
}

.settings-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.settings-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.settings-note {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--error);
  color: white;
}

.dialog-body {
  padding: 24px;
}

.dialog-info {
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.dialog-info strong {
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 14px;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.form-textarea {
  resize: vertical;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border);
}

.cancel-btn,
.submit-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: var(--bg-hover);
}

.submit-btn {
  background: var(--accent);
  border: none;
  color: white;
}

.submit-btn:hover {
  background: var(--accent-hover);
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-tabs {
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1;
    min-width: 100px;
    text-align: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-input {
    width: 100%;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .users-table table {
    font-size: 12px;
  }

  .categories-list,
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .category-item {
    flex-direction: column;
    gap: 12px;
  }

  .category-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>