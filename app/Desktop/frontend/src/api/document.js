import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://doc.xuanjian.top/api';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const documentApi = {
  // 获取文档列表
  getList: (params) => axios.get(`${API_BASE}/documents`, {
    params,
    headers: getHeaders()
  }),

  // 获取单个文档详情
  getDetail: (id) => axios.get(`${API_BASE}/documents/${id}`, {
    headers: getHeaders()
  }),

  // 创建文档
  create: (data) => axios.post(`${API_BASE}/documents`, data, {
    headers: getHeaders()
  }),

  // 更新文档
  update: (id, data) => axios.put(`${API_BASE}/documents/${id}`, data, {
    headers: getHeaders()
  }),

  // 删除文档
  delete: (id) => axios.delete(`${API_BASE}/documents/${id}`, {
    headers: getHeaders()
  }),

  // 获取文档版本历史
  getVersionHistory: (id) => axios.get(`${API_BASE}/documents/${id}/versions`, {
    headers: getHeaders()
  }),

  // 恢复到指定版本
  restoreVersion: (id, versionId) => axios.post(
    `${API_BASE}/documents/${id}/versions/${versionId}/restore`,
    {},
    { headers: getHeaders() }
  ),

  // 上传附件
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE}/documents/${id}/attachments`, formData, {
      headers: {
        ...getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 下载文档
  download: (id) => axios.get(`${API_BASE}/documents/${id}/download`, {
    headers: getHeaders(),
    responseType: 'blob'
  }),

  // 获取分类列表
  getCategories: () => axios.get(`${API_BASE}/categories`, {
    headers: getHeaders()
  })
};