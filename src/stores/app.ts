import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const unreadNotifications = ref(0)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setUnreadCount(count: number) {
    unreadNotifications.value = count
  }

  return {
    sidebarCollapsed,
    unreadNotifications,
    toggleSidebar,
    setUnreadCount,
  }
})
