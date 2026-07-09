import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export const authApi = {
  callback: (code) => axios.post(`${API_BASE}/auth/callback`, { code }),
  me: () => axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),
  logout: () => axios.post(`${API_BASE}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),
  verify: () => axios.get(`${API_BASE}/auth/verify`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })
};