import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import OAuthCallback from '../views/OAuthCallback.vue'
import Documents from '../views/Documents.vue'
import Layout from '../components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/callback',
    name: 'OAuthCallback',
    component: OAuthCallback
  },
  {
    path: '/',
    component: Layout,
    redirect: '/documents',
    children: [
      {
        path: 'documents',
        name: 'Documents',
        component: Documents
      },
      {
        path: 'documents/new',
        name: 'NewDocument',
        component: () => import('../views/DocumentEdit.vue')
      },
      {
        path: 'documents/:id',
        name: 'DocumentDetail',
        component: () => import('../views/DocumentDetail.vue')
      },
      {
        path: 'documents/:id/edit',
        name: 'DocumentEdit',
        component: () => import('../views/DocumentEdit.vue')
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('../views/Announcements.vue')
      },
      {
        path: 'announcements/new',
        name: 'NewAnnouncement',
        component: () => import('../views/AnnouncementEdit.vue')
      },
      {
        path: 'announcements/:id',
        name: 'AnnouncementDetail',
        component: () => import('../views/AnnouncementDetail.vue')
      },
      {
        path: 'announcements/:id/edit',
        name: 'AnnouncementEdit',
        component: () => import('../views/AnnouncementEdit.vue')
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查是否登录
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 如果没有token且不是去登录页或callback页，则跳转到登录页
  if (!token && to.path !== '/login' && to.path !== '/callback') {
    next('/login')
  } else {
    next()
  }
})

export default router