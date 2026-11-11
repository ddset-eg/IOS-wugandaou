import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/modules'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const token = ref<string>('')
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value || !!token.value)
  const username = computed(() => user.value?.username || '')
  const role = computed(() => user.value?.role || '')

  async function login(usernameVal: string, passwordVal: string) {
    const res: any = await authApi.login(usernameVal, passwordVal)
    // Check if 2FA is required
    if (res?.requires_2fa) {
      return { requires2fa: true, tempToken: res.temp_token }
    }
    // Login successful - fetch user info
    await fetchUser()
    return { requires2fa: false }
  }

  async function verify2fa(tempToken: string, otpCode: string) {
    const res: any = await authApi.verify2fa(tempToken, otpCode)
    await fetchUser()
    return res
  }

  async function fetchUser() {
    try {
      const res: any = await authApi.me()
      user.value = res
      initialized.value = true
    } catch {
      user.value = null
      initialized.value = true
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    user.value = null
    token.value = ''
  }

  return {
    user,
    token,
    initialized,
    isAuthenticated,
    username,
    role,
    login,
    verify2fa,
    fetchUser,
    logout,
  }
})
