import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const adminApi = {
  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {string} params.keyword - 搜索关键词
   */
  getUsers: (params = {}) => axios.get(`${API_BASE}/admin/users`, {
    params,
    headers: getAuthHeaders()
  }),

  /**
   * 修改用户权限等级
   * @param {number} userId - 用户ID
   * @param {number} level - 权限等级 (0-3)
   */
  updateUserLevel: (userId, level) => axios.put(
    `${API_BASE}/admin/users/${userId}/level`,
    { level },
    { headers: getAuthHeaders() }
  ),

  /**
   * 获取分类列表（管理后台）
   */
  getCategories: () => axios.get(`${API_BASE}/admin/categories`, {
    headers: getAuthHeaders()
  }),

  /**
   * 创建分类
   * @param {Object} data - 分类数据
   * @param {string} data.name - 分类名称
   * @param {number} data.parent_id - 父分类ID（可选）
   * @param {string} data.description - 描述（可选）
   */
  createCategory: (data) => axios.post(`${API_BASE}/admin/categories`, data, {
    headers: getAuthHeaders()
  }),

  /**
   * 更新分类
   * @param {number} categoryId - 分类ID
   * @param {Object} data - 更新数据
   * @param {string} data.name - 分类名称
   * @param {string} data.description - 描述
   */
  updateCategory: (categoryId, data) => axios.put(
    `${API_BASE}/admin/categories/${categoryId}`,
    data,
    { headers: getAuthHeaders() }
  ),

  /**
   * 删除分类
   * @param {number} categoryId - 分类ID
   */
  deleteCategory: (categoryId) => axios.delete(
    `${API_BASE}/admin/categories/${categoryId}`,
    { headers: getAuthHeaders() }
  ),

  /**
   * 获取系统设置
   */
  getSettings: () => axios.get(`${API_BASE}/admin/settings`, {
    headers: getAuthHeaders()
  }),

  /**
   * 获取系统统计信息
   */
  getStats: () => axios.get(`${API_BASE}/admin/stats`, {
    headers: getAuthHeaders()
  })
};