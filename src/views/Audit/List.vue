<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="filter-row">
        <el-form :inline="true" @submit.prevent>
          <el-form-item label="搜索">
            <el-input v-model="filters.q" placeholder="搜索" clearable style="width: 180px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="用户">
            <el-input v-model="filters.username" clearable style="width: 120px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="操作">
            <el-select v-model="filters.action" clearable filterable placeholder="全部" style="width: 160px" @change="loadData">
              <el-option v-for="a in actions" :key="a" :label="a" :value="a" />
            </el-select>
          </el-form-item>
          <el-form-item label="资源类型">
            <el-input v-model="filters.resource_type" clearable style="width: 120px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="filters.ip" clearable style="width: 120px" @keyup.enter="loadData" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadData">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe size="small" @sort-change="onSortChange" style="width: 100%">
        <el-table-column label="时间" prop="created_at" width="180" sortable="custom" />
        <el-table-column label="用户" prop="username" width="100" />
        <el-table-column label="操作" prop="action" width="160" />
        <el-table-column label="资源类型" prop="resource_type" width="120" />
        <el-table-column label="资源" prop="resource" width="120" />
        <el-table-column label="资源ID" prop="resource_id" width="100" />
        <el-table-column label="IP" prop="ip_address" width="130" />
        <el-table-column label="详情" prop="details" min-width="250" show-overflow-tooltip />
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
import { auditApi } from '@/api/modules'

const loading = ref(false)
const tableData = ref<any[]>([])
const actions = ref<string[]>([])

const filters = reactive({
  q: '',
  username: '',
  action: '',
  resource_type: '',
  ip: '',
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
    const res: any = await auditApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadActions() {
  try {
    const res: any = await auditApi.actions()
    actions.value = Array.isArray(res) ? res : (res?.actions || [])
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

onMounted(() => {
  loadActions()
  loadData()
})
</script>

<style scoped>
.filter-row .el-form-item {
  margin-bottom: 10px;
}
</style>
