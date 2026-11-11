import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('@/views/Devices/List.vue'),
        meta: { title: '设备管理', icon: 'Cellphone' },
      },
      {
        path: 'devices/:deviceUuid',
        name: 'DeviceDetail',
        component: () => import('@/views/Devices/Detail.vue'),
        meta: { title: '设备详情', hidden: true },
      },
      {
        path: 'channels',
        name: 'Channels',
        component: () => import('@/views/Channels/List.vue'),
        meta: { title: '渠道管理', icon: 'Connection' },
      },
      {
        path: 'commands',
        name: 'Commands',
        component: () => import('@/views/Commands/List.vue'),
        meta: { title: '命令管理', icon: 'Promotion' },
      },
      {
        path: 'commands/scripts',
        name: 'Scripts',
        component: () => import('@/views/Commands/Scripts.vue'),
        meta: { title: '脚本管理', icon: 'Document' },
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('@/views/Templates/List.vue'),
        meta: { title: '模板管理', icon: 'Files' },
      },
      {
        path: 'exfil',
        name: 'Exfil',
        component: () => import('@/views/Exfil/Index.vue'),
        meta: { title: '数据窃取', icon: 'Download' },
      },
      {
        path: 'wallets',
        name: 'Wallets',
        component: () => import('@/views/Wallets/List.vue'),
        meta: { title: '钱包管理', icon: 'Wallet' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/Logs/List.vue'),
        meta: { title: '系统日志', icon: 'Tickets' },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/Audit/List.vue'),
        meta: { title: '审计日志', icon: 'Lock' },
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications/Index.vue'),
        meta: { title: '通知中心', icon: 'Bell' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings/Index.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users/List.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    if (authStore.isAuthenticated && to.name === 'Login') {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  if (!authStore.initialized) {
    await authStore.fetchUser()
  }

  if (!authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
