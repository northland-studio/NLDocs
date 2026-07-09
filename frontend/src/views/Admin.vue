<template>
  <div class="admin">
    <h1>系统管理</h1>
    <div class="admin-content">
      <div class="admin-section">
        <h2>用户管理</h2>
        <div class="user-list">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="users.length === 0" class="empty">暂无用户数据</div>
          <div v-else class="users">
            <div v-for="user in users" :key="user._id" class="user-item">
              <div class="user-info">
                <span class="username">{{ user.username }}</span>
                <span class="email">{{ user.email }}</span>
              </div>
              <div class="user-actions">
                <select v-model="user.level" @change="updateUserLevel(user)" class="level-select">
                  <option :value="0">普通用户</option>
                  <option :value="1">编辑</option>
                  <option :value="2">管理员</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h2>系统统计</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>文档总数</h3>
            <p class="stat-number">{{ stats.documents }}</p>
          </div>
          <div class="stat-card">
            <h3>用户总数</h3>
            <p class="stat-number">{{ stats.users }}</p>
          </div>
          <div class="stat-card">
            <h3>公告总数</h3>
            <p class="stat-number">{{ stats.announcements }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/auth'

const users = ref([])
const loading = ref(false)
const stats = ref({
  documents: 0,
  users: 0,
  announcements: 0
})

const fetchUsers = async () => {
  loading.value = true
  try {
    // TODO: 实现获取用户列表的API
    // const response = await api.getUsers()
    // users.value = response.data
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const updateUserLevel = async (user) => {
  try {
    // TODO: 实现更新用户等级的API
    // await api.updateUserLevel(user._id, user.level)
    console.log('更新用户等级:', user)
  } catch (error) {
    console.error('更新用户等级失败:', error)
  }
}

const fetchStats = async () => {
  try {
    // TODO: 实现获取统计数据的API
    // const response = await api.getStats()
    // stats.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

onMounted(() => {
  fetchUsers()
  fetchStats()
})
</script>

<style scoped>
.admin {
  padding: 20px;
}

.admin h1 {
  margin-bottom: 30px;
  color: var(--text-primary);
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.admin-section {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.admin-section h2 {
  margin-bottom: 20px;
  color: var(--text-primary);
  font-size: 18px;
}

.user-list {
  min-height: 200px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.users {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 500;
  color: var(--text-primary);
}

.email {
  font-size: 14px;
  color: var(--text-secondary);
}

.level-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0;
}
</style>