<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.q" placeholder="搜索脚本" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-input v-model="filters.category" placeholder="分类" clearable style="width: 150px" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建脚本
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="名称" prop="name" min-width="150" />
        <el-table-column label="Slug" prop="slug" min-width="120" />
        <el-table-column label="分类" prop="category" width="120" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="命令" prop="command" min-width="200" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="created_at" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="success" @click="runScript(row)">运行</el-button>
            <el-button text size="small" type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="deleteScript(row)">删除</el-button>
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

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="formDialogVisible" :title="editMode ? '编辑脚本' : '新建脚本'" width="650px">
      <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="脚本名称" />
        </el-form-item>
        <el-form-item label="Slug">
          <el-input v-model="formData.slug" placeholder="唯一标识（可选）" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="formData.category" placeholder="分类" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="命令">
          <el-input v-model="formData.command" type="textarea" :rows="6" placeholder="脚本命令内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { commandsApi } from '@/api/modules'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const filters = reactive({ q: '', category: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      page_size: pagination.pageSize,
      q: filters.q || undefined,
      category: filters.category || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await commandsApi.listScripts(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

// Form
const formDialogVisible = ref(false)
const editMode = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const formData = reactive({
  name: '',
  slug: '',
  category: '',
  description: '',
  content: '',
  command: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function openCreate() {
  editMode.value = false
  editingId.value = null
  formData.name = ''
  formData.slug = ''
  formData.category = ''
  formData.description = ''
  formData.content = ''
  formData.command = ''
  formDialogVisible.value = true
}

function openEdit(row: any) {
  editMode.value = true
  editingId.value = row.id
  formData.name = row.name || ''
  formData.slug = row.slug || ''
  formData.category = row.category || ''
  formData.description = row.description || ''
  formData.content = row.content || ''
  formData.command = row.command || ''
  formDialogVisible.value = true
}

async function saveForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      const data: Record<string, any> = { ...formData }
      if (editMode.value && editingId.value) {
        await withOtpRetry((otp) => commandsApi.updateScript(editingId.value!, data, otp))
      } else {
        await withOtpRetry((otp) => commandsApi.createScript(data, otp))
      }
      ElMessage.success('保存成功')
      formDialogVisible.value = false
      loadData()
    } catch {
      // handled
    } finally {
      formLoading.value = false
    }
  })
}

async function deleteScript(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除脚本 "${row.name}" 吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => commandsApi.deleteScript(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function runScript(row: any) {
  try {
    await ElMessageBox.confirm(`确定要运行脚本 "${row.name}" 吗？`, '确认', { type: 'info' })
    const res: any = await withOtpRetry((otp) => commandsApi.runScript(row.id, {}, otp))
    ElMessage.success('脚本已触发')
    if (res?.command_id) {
      ElMessageBox.alert(`命令ID: ${res.command_id}`, '运行结果')
    }
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
