import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const notificationsApi = {
  // 获取通知列表
  getNotifications: (params) => axios.get(`${API_BASE}/notifications`, {
    params,
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // 获取未读通知数量
  getUnreadCount: () => axios.get(`${API_BASE}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // 标记单个通知为已读
  markAsRead: (id) => axios.put(`${API_BASE}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // 标记所有通知为已读
  markAllAsRead: () => axios.put(`${API_BASE}/notifications/read-all`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // 删除单个通知
  deleteNotification: (id) => axios.delete(`${API_BASE}/notifications/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // 清除所有已读通知
  clearReadNotifications: () => axios.delete(`${API_BASE}/notifications/clear-read`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
};