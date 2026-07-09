import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://doc.xuanjian.top/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const approvalsApi = {
  /**
   * 提交文档发布审批申请
   * @param {number} document_id - 文档ID
   * @param {string} comment - 申请说明
   */
  submit: (document_id, comment) => axios.post(
    `${API_BASE}/approvals`,
    { document_id, comment },
    { headers: getAuthHeaders() }
  ),

  /**
   * 获取审批列表
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选 (pending/approved/rejected)
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   */
  getList: (params = {}) => axios.get(`${API_BASE}/approvals`, {
    params,
    headers: getAuthHeaders()
  }),

  /**
   * 获取我的审批申请
   * @param {Object} params - 查询参数
   * @param {string} params.status - 状态筛选
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   */
  getMyApprovals: (params = {}) => axios.get(`${API_BASE}/approvals/my`, {
    params,
    headers: getAuthHeaders()
  }),

  /**
   * 获取待审核列表（管理员专用）
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.limit - 每页数量
   */
  getPending: (params = {}) => axios.get(`${API_BASE}/approvals/pending`, {
    params,
    headers: getAuthHeaders()
  }),

  /**
   * 获取审批详情
   * @param {number} id - 审批ID
   */
  getDetail: (id) => axios.get(`${API_BASE}/approvals/${id}`, {
    headers: getAuthHeaders()
  }),

  /**
   * 审批通过
   * @param {number} id - 审批ID
   * @param {string} comment - 审核意见
   */
  approve: (id, comment) => axios.put(
    `${API_BASE}/approvals/${id}/approve`,
    { comment },
    { headers: getAuthHeaders() }
  ),

  /**
   * 审批拒绝
   * @param {number} id - 审批ID
   * @param {string} comment - 拒绝原因（必填）
   */
  reject: (id, comment) => axios.put(
    `${API_BASE}/approvals/${id}/reject`,
    { comment },
    { headers: getAuthHeaders() }
  )
};