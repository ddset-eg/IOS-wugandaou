<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="filter-row">
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="搜索">
            <el-input v-model="filters.q" placeholder="搜索" clearable style="width: 180px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="filters.ip" clearable style="width: 140px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="路径">
            <el-input v-model="filters.path" clearable style="width: 140px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.log_type" clearable placeholder="全部" style="width: 120px" @change="loadData">
              <el-option v-for="t in logTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="方法">
            <el-select v-model="filters.method" clearable placeholder="全部" style="width: 100px" @change="loadData">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
              <el-option label="PATCH" value="PATCH" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态码">
            <el-input v-model="filters.status_code" clearable style="width: 80px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="设备UUID">
            <el-input v-model="filters.device_uuid" clearable style="width: 180px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadData">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe size="small" @sort-change="onSortChange" style="width: 100%">
        <el-table-column label="时间" prop="created_at" width="180" sortable="custom" />
        <el-table-column label="类型" prop="log_type" width="80" />
        <el-table-column label="方法" prop="method" width="70" />
        <el-table-column label="路径" prop="path" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态码" prop="status_code" width="80" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status_code)" size="small">{{ row.status_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IP" prop="ip" width="130" />
        <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
        <el-table-column label="渠道" prop="channel_name" width="100" />
        <el-table-column label="消息" prop="message" min-width="200" show-overflow-tooltip />
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100, 200]"
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
import { logsApi } from '@/api/modules'

const loading = ref(false)
const tableData = ref<any[]>([])
const logTypes = ref<string[]>([])

const filters = reactive({
  q: '',
  ip: '',
  path: '',
  log_type: '',
  method: '',
  status_code: '',
  device_uuid: '',
})

const sortParams = reactive({ sort: '', order: '' })
const pagination = reactive({ page: 1, pageSize: 50, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      ...filters,
      ...sortParams,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await logsApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadTypes() {
  try {
    const res: any = await logsApi.types()
    logTypes.value = Array.isArray(res) ? res : (res?.types || [])
  } catch {
    // ignore
  }
}

function resetFilters() {
  Object.keys(filters).forEach((k) => { (filters as any)[k] = '' })
  pagination.page = 1
  loadData()
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

function statusTagType(code: number): any {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'primary'
  if (code >= 400 && code < 500) return 'warning'
  return 'danger'
}

onMounted(() => {
  loadTypes()
  loadData()
})
</script>

<style scoped>
.filter-row .el-form-item {
  margin-bottom: 10px;
}
</style>
