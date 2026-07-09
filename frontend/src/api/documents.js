import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const documentsApi = {
  /**
   * 获取文档列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   * @param {number} params.category_id - 分类ID
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.status - 状态筛选 (draft/published)
   */
  getList: (params = {}) => axios.get(`${API_BASE}/documents`, {
    params,
    headers: getAuthHeaders()
  }),

  /**
   * 获取文档详情
   * @param {number} id - 文档ID
   */
  getDetail: (id) => axios.get(`${API_BASE}/documents/${id}`, {
    headers: getAuthHeaders()
  }),

  /**
   * 创建文档
   * @param {Object} data - 文档数据
   * @param {string} data.title - 标题
   * @param {string} data.content - 内容
   * @param {string} data.file_path - 文件路径
   * @param {string} data.file_type - 文件类型
   * @param {number} data.category_id - 分类ID
   */
  create: (data) => axios.post(`${API_BASE}/documents`, data, {
    headers: getAuthHeaders()
  }),

  /**
   * 更新文档
   * @param {number} id - 文档ID
   * @param {Object} data - 更新数据
   */
  update: (id, data) => axios.put(`${API_BASE}/documents/${id}`, data, {
    headers: getAuthHeaders()
  }),

  /**
   * 删除文档
   * @param {number} id - 文档ID
   */
  delete: (id) => axios.delete(`${API_BASE}/documents/${id}`, {
    headers: getAuthHeaders()
  }),

  /**
   * 获取文档版本历史
   * @param {number} id - 文档ID
   */
  getVersions: (id) => axios.get(`${API_BASE}/documents/${id}/versions`, {
    headers: getAuthHeaders()
  }),

  /**
   * 恢复历史版本
   * @param {number} id - 文档ID
   * @param {number} version - 版本号
   */
  restoreVersion: (id, version) => axios.post(
    `${API_BASE}/documents/${id}/restore/${version}`,
    {},
    { headers: getAuthHeaders() }
  ),

  /**
   * 获取分类列表
   * @param {number} parent_id - 父分类ID（可选）
   */
  getCategories: (parent_id) => axios.get(`${API_BASE}/documents/categories`, {
    params: parent_id ? { parent_id } : {},
    headers: getAuthHeaders()
  }),

  /**
   * 创建分类
   * @param {Object} data - 分类数据
   * @param {string} data.name - 分类名称
   * @param {number} data.parent_id - 父分类ID（可选）
   * @param {string} data.description - 描述（可选）
   */
  createCategory: (data) => axios.post(`${API_BASE}/documents/categories`, data, {
    headers: getAuthHeaders()
  })
};