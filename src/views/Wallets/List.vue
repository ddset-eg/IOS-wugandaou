<template>
  <div class="page-container">
    <!-- Stats cards -->
    <el-row :gutter="20" style="margin-bottom: 16px">
      <el-col :xs="12" :md="6" v-for="(stat, key) in stats" :key="key">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-value">{{ stat }}</div>
              <div class="stat-label">{{ key }}</div>
            </div>
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="28"><Wallet /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.device_uuid" placeholder="设备UUID" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-select v-model="filters.wallet_type" placeholder="钱包类型" clearable filterable style="width: 180px" @change="loadData">
            <el-option v-for="t in walletTypes" :key="t" :label="t" :value="t" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <el-radio-group v-model="viewMode" @change="loadData">
          <el-radio-button value="raw">原始数据</el-radio-button>
          <el-radio-button value="parsed">解析数据</el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" prop="wallet_type" width="120" />
        <el-table-column label="数据" prop="data" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <pre style="margin: 0; font-size: 12px; white-space: pre-wrap">{{ formatData(row.data) }}</pre>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" width="180" />
      </el-table>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { walletsApi } from '@/api/modules'

const loading = ref(false)
const tableData = ref<any[]>([])
const stats = ref<Record<string, any>>({})
const walletTypes = ref<string[]>([])
const viewMode = ref('raw')
const filters = reactive({ device_uuid: '', wallet_type: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      device_uuid: filters.device_uuid || undefined,
      wallet_type: filters.wallet_type || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = viewMode.value === 'parsed'
      ? await walletsApi.parsed(params)
      : await walletsApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res: any = await walletsApi.stats()
    stats.value = res || {}
  } catch {
    // ignore
  }
}

async function loadTypes() {
  try {
    const res: any = await walletsApi.types()
    walletTypes.value = Array.isArray(res) ? res : (res?.types || [])
  } catch {
    // ignore
  }
}

function formatData(data: any): string {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

onMounted(() => {
  loadStats()
  loadTypes()
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
