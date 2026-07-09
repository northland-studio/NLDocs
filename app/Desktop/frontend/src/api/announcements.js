import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://doc.xuanjian.top/api';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const announcementApi = {
  // 获取公告列表
  getList: (params) => axios.get(`${API_BASE}/announcements`, {
    params,
    ...getAuthHeaders()
  }),

  // 获取单个公告详情
  getDetail: (id) => axios.get(`${API_BASE}/announcements/${id}`, getAuthHeaders()),

  // 创建公告
  create: (data) => axios.post(`${API_BASE}/announcements`, data, getAuthHeaders()),

  // 更新公告
  update: (id, data) => axios.put(`${API_BASE}/announcements/${id}`, data, getAuthHeaders()),

  // 删除公告
  delete: (id) => axios.delete(`${API_BASE}/announcements/${id}`, getAuthHeaders()),

  // 标记公告为已读
  markAsRead: (id) => axios.post(`${API_BASE}/announcements/${id}/read`, {}, getAuthHeaders()),

  // 获取未读公告数量
  getUnreadCount: () => axios.get(`${API_BASE}/announcements/unread-count`, getAuthHeaders()),

  // 发布公告（从草稿）
  publish: (id) => axios.post(`${API_BASE}/announcements/${id}/publish`, {}, getAuthHeaders()),

  // 切换置顶状态
  togglePin: (id) => axios.post(`${API_BASE}/announcements/${id}/toggle-pin`, {}, getAuthHeaders())
};