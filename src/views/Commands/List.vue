<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.search" placeholder="搜索命令" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px">
            <el-option label="待执行" value="pending" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-input v-model="filters.device_uuid" placeholder="设备UUID" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <div>
          <el-button type="primary" @click="cmdDialogVisible = true">
            <el-icon><Plus /></el-icon> 创建命令
          </el-button>
          <el-button @click="router.push('/commands/scripts')">
            <el-icon><Document /></el-icon> 脚本管理
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @selection-change="onSelectionChange" style="width: 100%">
        <el-table-column type="selection" width="50" />
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="命令" prop="command" min-width="200" show-overflow-tooltip />
        <el-table-column label="设备UUID" prop="device_uuid" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="输出" prop="output" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="created_at" width="180" />
        <el-table-column label="完成时间" prop="completed_at" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="retryCommand(row)" v-if="row.status === 'failed'">重试</el-button>
            <el-button text size="small" @click="cancelCommand(row)" v-if="row.status === 'pending'">取消</el-button>
            <el-button text size="small" type="danger" @click="deleteCommand(row)">删除</el-button>
          </template>
        </el-table-column>
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

    <!-- Create Command Dialog -->
    <el-dialog v-model="cmdDialogVisible" title="创建命令" width="500px">
      <el-form label-position="top">
        <el-form-item label="设备UUID">
          <el-input v-model="cmdForm.device_uuid" placeholder="目标设备UUID" />
        </el-form-item>
        <el-form-item label="命令">
          <el-input v-model="cmdForm.command" placeholder="命令内容" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cmdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cmdLoading" @click="confirmCreate">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { commandsApi } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])

const filters = reactive({
  search: '',
  status: '',
  device_uuid: '',
})

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      search: filters.search || undefined,
      status: filters.status || undefined,
      device_uuid: filters.device_uuid || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await commandsApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function statusType(status: string): any {
  const map: Record<string, string> = { pending: 'warning', success: 'success', failed: 'danger', cancelled: 'info' }
  return map[status] || 'info'
}

function statusText(status: string) {
  const map: Record<string, string> = { pending: '待执行', success: '成功', failed: '失败', cancelled: '已取消' }
  return map[status] || status
}

const cmdDialogVisible = ref(false)
const cmdLoading = ref(false)
const cmdForm = reactive({ device_uuid: '', command: '' })

async function confirmCreate() {
  if (!cmdForm.command) {
    ElMessage.warning('请输入命令')
    return
  }
  cmdLoading.value = true
  try {
    await withOtpRetry((otp) => commandsApi.create({ command: cmdForm.command, device_uuid: cmdForm.device_uuid || undefined }, otp))
    ElMessage.success('命令已创建')
    cmdDialogVisible.value = false
    cmdForm.command = ''
    cmdForm.device_uuid = ''
    loadData()
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
    loadData()
  } catch {
    // handled
  }
}

async function cancelCommand(row: any) {
  try {
    await withOtpRetry((otp) => commandsApi.cancel(row.id, otp))
    ElMessage.success('已取消')
    loadData()
  } catch {
    // handled
  }
}

async function deleteCommand(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除此命令吗？', '确认', { type: 'warning' })
    await withOtpRetry((otp) => commandsApi.delete(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
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
