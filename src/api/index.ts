import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const http: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
  withCredentials: true,
})

// Request interceptor - include credentials
http.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 and errors
http.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        // Redirect to login
        const hash = window.location.hash
        if (!hash.includes('/login')) {
          ElMessage.error('登录已过期，请重新登录')
          window.location.hash = '#/login'
        }
      } else if (status === 403) {
        // Don't show generic message for 2FA-related 403s — let caller handle retry
        const detail = data?.detail || ''
        if (!detail.includes('2FA') && !detail.includes('2fa')) {
          ElMessage.error('没有权限执行此操作')
        }
      } else if (status >= 500) {
        ElMessage.error(data?.detail || data?.message || '服务器错误')
      } else if (status === 422) {
        const detail = data?.detail
        if (Array.isArray(detail)) {
          ElMessage.error(detail.map((e: any) => e.msg || JSON.stringify(e)).join('; '))
        } else {
          ElMessage.error(detail || '参数校验失败')
        }
      } else if (status === 400) {
        // Don't show generic message for 2FA-related 400s — let caller handle retry
        const detail = data?.detail || ''
        if (!detail.includes('2FA') && !detail.includes('2fa') && !detail.includes('Invalid or missing')) {
          ElMessage.error(detail || '请求错误')
        }
      } else {
        const msg = data?.detail || data?.message || error.message
        if (msg) ElMessage.error(msg)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请重试')
    } else {
      ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default http

// Helper to build query params, omitting undefined/null/empty values
export function buildParams(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  }
  return result
}

// Helper to add otp_code to query params
export function withOtp(otpCode?: string): Record<string, any> {
  return otpCode ? { otp_code: otpCode } : {}
}

// Check if an error is a 2FA requirement error
export function is2faError(error: any): boolean {
  if (!error?.response) return false
  const { status, data } = error.response
  const detail = (data?.detail || '').toString().toLowerCase()
  return (
    (status === 400 || status === 403) &&
    (detail.includes('2fa') || detail.includes('invalid or missing'))
  )
}

// Generic request wrapper
export async function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config)
  return response.data
}
