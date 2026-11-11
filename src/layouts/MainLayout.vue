<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#409EFF"><Monitor /></el-icon>
        <span v-show="!sidebarCollapsed" class="logo-text">iOS Panel</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        unique-opened
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="route.fullPath">
            <el-icon><component :is="route.icon" /></el-icon>
            <template #title>{{ route.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- Main content -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="appStore.toggleSidebar()">
            <Fold v-if="!sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <!-- Notification bell -->
          <el-dropdown trigger="click" @visible-change="onNotifDropdown" placement="bottom-end">
            <el-badge :value="appStore.unreadNotifications" :hidden="appStore.unreadNotifications === 0" :max="99">
              <el-icon :size="22" class="header-icon"><Bell /></el-icon>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu class="notif-dropdown">
                <div class="notif-header">
                  <span>通知</span>
                  <el-button text size="small" @click="markAllRead">全部已读</el-button>
                </div>
                <div class="notif-list">
                  <div v-for="n in notifList" :key="n.id" class="notif-item" :class="{ unread: !n.read }">
                    <div class="notif-item-title">{{ n.title }}</div>
                    <div class="notif-item-msg">{{ n.message }}</div>
                    <div class="notif-item-time">{{ n.created_at }}</div>
                  </div>
                  <div v-if="notifList.length === 0" class="notif-empty">暂无通知</div>
                </div>
                <div class="notif-footer">
                  <el-button text size="small" @click="router.push('/notifications')">查看全部</el-button>
                </div>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- User dropdown -->
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">
                {{ authStore.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="user-name">{{ authStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Content area -->
      <el-main class="content-area">
        <router-view />
      </el-main>
    </el-container>

    <!-- OTP Dialog -->
    <OtpDialog ref="otpDialogRef" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { notificationsApi, is2faError } from '@/api/modules'
import { ElMessageBox } from 'element-plus'
import OtpDialog from '@/components/OtpDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const otpDialogRef = ref()

// Provide OTP request function to all child components
provide('requestOtp', requestOtp)

function requestOtp(): Promise<string> {
  return otpDialogRef.value?.requestOtp() ?? Promise.reject(new Error('OTP dialog not ready'))
}

// "Try first, ask for OTP only if backend requires it" wrapper
// Usage: const result = await withOtpRetry((otp) => devicesApi.delete(uuid, otp))
provide('withOtpRetry', withOtpRetry)

async function withOtpRetry<T>(fn: (otp?: string) => Promise<T>): Promise<T> {
  // First try without OTP
  try {
    return await fn()
  } catch (error: any) {
    if (!is2faError(error)) {
      throw error
    }
    // Backend requires 2FA — prompt user for OTP code, then retry
    const otp = await requestOtp()
    return await fn(otp)
  }
}

// Build menu routes from router config
const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find((r) => r.path === '/')
  if (!rootRoute?.children) return []
  return rootRoute.children
    .filter((r) => !r.meta?.hidden)
    .map((r) => ({
      fullPath: '/' + r.path,
      title: r.meta?.title as string,
      icon: r.meta?.icon as string,
    }))
})

const activeMenu = computed(() => {
  const path = route.path
  // Match parent for sub-pages
  if (path.startsWith('/devices/') && path !== '/devices') return '/devices'
  return path
})

const currentTitle = computed(() => route.meta?.title as string)

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)

// Notifications
const notifList = ref<any[]>([])
let sseSource: EventSource | null = null

async function loadUnreadCount() {
  try {
    const res: any = await notificationsApi.unreadCount()
    const count = typeof res === 'number' ? res : res?.count ?? 0
    appStore.setUnreadCount(count)
  } catch {
    // ignore
  }
}

async function loadNotifList() {
  try {
    const res: any = await notificationsApi.list({ limit: 10 })
    notifList.value = res?.items || res || []
  } catch {
    // ignore
  }
}

async function onNotifDropdown(visible: boolean) {
  if (visible) {
    await loadNotifList()
  }
}

async function markAllRead() {
  try {
    await notificationsApi.markAllRead()
    notifList.value = notifList.value.map((n) => ({ ...n, read: true }))
    appStore.setUnreadCount(0)
  } catch {
    // ignore
  }
}

function startSSE() {
  try {
    const url = notificationsApi.streamUrl()
    sseSource = new EventSource(url, { withCredentials: true })
    sseSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type === 'notification' || data?.id) {
          appStore.setUnreadCount(appStore.unreadNotifications + 1)
          loadNotifList()
        }
      } catch {
        // ignore
      }
    }
    sseSource.onerror = () => {
      sseSource?.close()
      sseSource = null
    }
  } catch {
    // ignore
  }
}

async function handleUserCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      await authStore.logout()
      router.push('/login')
    } catch {
      // cancelled
    }
  } else if (command === 'profile') {
    router.push('/settings')
  }
}

onMounted(() => {
  loadUnreadCount()
  loadNotifList()
  startSSE()
  // Poll every 60 seconds
  notifPollTimer = setInterval(loadUnreadCount, 60000)
})

let notifPollTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  sseSource?.close()
  if (notifPollTimer) clearInterval(notifPollTimer)
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  background-color: #2b3a4d;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.el-menu {
  border-right: none;
}

.header {
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  cursor: pointer;
  color: #5a5e66;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  cursor: pointer;
  color: #5a5e66;
}

.header-icon:hover {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  background-color: #409eff;
  color: #fff;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.content-area {
  background-color: #f0f2f5;
  overflow-y: auto;
  padding: 0;
}

/* Notification dropdown */
.notif-dropdown {
  width: 350px;
  max-height: 400px;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}

.notif-list {
  max-height: 280px;
  overflow-y: auto;
}

.notif-item {
  padding: 10px 15px;
  border-bottom: 1px solid #f5f5f5;
}

.notif-item.unread {
  background-color: #ecf5ff;
}

.notif-item-title {
  font-weight: 600;
  font-size: 14px;
}

.notif-item-msg {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}

.notif-item-time {
  font-size: 12px;
  color: #999;
}

.notif-empty {
  padding: 30px;
  text-align: center;
  color: #999;
}

.notif-footer {
  text-align: center;
  padding: 8px;
  border-top: 1px solid #eee;
}
</style>
