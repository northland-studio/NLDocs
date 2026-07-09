import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import Layout from '../components/Layout.vue'

const routes = [
  // 公开路由（不需要登录）
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/callback',
    name: 'OAuthCallback',
    component: OAuthCallback,
    meta: { public: true }
  },
  // 需要登录的路由（使用Layout）
  {
    path: '/',
    component: Layout,
    redirect: '/documents',
    children: [
      {
        path: 'documents',
        name: 'Documents',
        component: () => import('../views/Documents.vue')
      },
      {
        path: 'documents/new',
        name: 'NewDocument',
        component: () => import('../views/DocumentEdit.vue'),
        meta: { requiresAuth: true, minLevel: 1 }
      },
      {
        path: 'documents/:id',
        name: 'DocumentDetail',
        component: () => import('../views/DocumentDetail.vue')
      },
      {
        path: 'documents/:id/edit',
        name: 'DocumentEdit',
        component: () => import('../views/DocumentEdit.vue'),
        meta: { requiresAuth: true, minLevel: 1 }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('../views/Announcements.vue')
      },
      {
        path: 'announcements/new',
        name: 'NewAnnouncement',
        component: () => import('../views/AnnouncementEdit.vue'),
        meta: { requiresAuth: true, minLevel: 1 }
      },
      {
        path: 'announcements/:id',
        name: 'AnnouncementDetail',
        component: () => import('../views/AnnouncementDetail.vue')
      },
      {
        path: 'announcements/:id/edit',
        name: 'AnnouncementEdit',
        component: () => import('../views/AnnouncementEdit.vue'),
        meta: { requiresAuth: true, minLevel: 1 }
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('../views/Approvals.vue')
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresAuth: true, minLevel: 2 }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 如果是公开路由，直接放行
  if (to.meta.public) {
    next()
    return
  }

  // 如果未登录，跳转到登录页面
  if (!token) {
    next('/login')
    return
  }

  // 检查权限级别
  if (to.meta.minLevel && (user.level || 0) < to.meta.minLevel) {
    // 权限不足，跳转到首页
    next('/documents')
    return
  }

  next()
})

export default router