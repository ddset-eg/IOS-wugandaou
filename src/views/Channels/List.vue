<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div>
          <el-input v-model="filters.search" placeholder="搜索渠道" clearable style="width: 200px; margin-right: 10px" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建渠道
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe @sort-change="onSortChange" style="width: 100%">
        <el-table-column label="ID" prop="id" width="60" sortable="custom" />
        <el-table-column label="名称" prop="name" min-width="150" />
        <el-table-column label="Slug" prop="slug" min-width="150" />
        <el-table-column label="颜色" prop="color" width="80">
          <template #default="{ row }">
            <div v-if="row.color" :style="{ background: row.color, width: '20px', height: '20px', borderRadius: '4px' }"></div>
          </template>
        </el-table-column>
        <el-table-column label="默认模板" prop="default_template_name" width="120" />
        <el-table-column label="启用" prop="enabled" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">{{ row.enabled ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备数" prop="device_count" width="80" />
        <el-table-column label="备注" prop="note" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="viewEmbed(row)">嵌入码</el-button>
            <el-button text size="small" @click="rotateKey(row)">轮换密钥</el-button>
            <el-button text size="small" type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="deleteChannel(row)">删除</el-button>
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
    <el-dialog v-model="formDialogVisible" :title="editMode ? '编辑渠道' : '新建渠道'" width="550px">
      <el-form :model="formData" label-width="120px" :rules="formRules" ref="formRef">
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="formData.slug" placeholder="唯一标识" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="渠道名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="formData.color" />
        </el-form-item>
        <el-form-item label="默认模板">
          <el-select v-model="formData.default_template_id" clearable filterable style="width: 100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="域名白名单">
          <el-input v-model="formData.domain_whitelist" type="textarea" :rows="2" placeholder="逗号分隔" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.note" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- Embed Code Dialog -->
    <el-dialog v-model="embedDialogVisible" title="嵌入代码" width="600px">
      <el-input v-model="embedCode" type="textarea" :rows="12" readonly />
      <div style="text-align: right; margin-top: 10px">
        <el-button @click="copyEmbed">复制</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { channelsApi, templatesApi } from '@/api/modules'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const templates = ref<any[]>([])
const filters = reactive({ search: '' })
const sortParams = reactive({ sort: '', order: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      search: filters.search || undefined,
      ...sortParams,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await channelsApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function loadTemplates() {
  try {
    const res: any = await templatesApi.list({ limit: 1000 })
    templates.value = res?.items || res || []
  } catch {
    // ignore
  }
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

// Form
const formDialogVisible = ref(false)
const editMode = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const formData = reactive({
  slug: '',
  name: '',
  color: '',
  default_template_id: null as number | null,
  domain_whitelist: '',
  enabled: true,
  note: '',
})

const formRules: FormRules = {
  slug: [{ required: true, message: '请输入 Slug', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function openCreate() {
  editMode.value = false
  editingId.value = null
  formData.slug = ''
  formData.name = ''
  formData.color = ''
  formData.default_template_id = null
  formData.domain_whitelist = ''
  formData.enabled = true
  formData.note = ''
  formDialogVisible.value = true
}

function openEdit(row: any) {
  editMode.value = true
  editingId.value = row.id
  formData.slug = row.slug || ''
  formData.name = row.name || ''
  formData.color = row.color || ''
  formData.default_template_id = row.default_template_id || null
  formData.domain_whitelist = Array.isArray(row.domain_whitelist) ? row.domain_whitelist.join(', ') : (row.domain_whitelist || '')
  formData.enabled = row.enabled ?? true
  formData.note = row.note || ''
  formDialogVisible.value = true
}

async function saveForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      const data: Record<string, any> = { ...formData }
      if (data.domain_whitelist && typeof data.domain_whitelist === 'string') {
        data.domain_whitelist = data.domain_whitelist.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (editMode.value && editingId.value) {
        await withOtpRetry((otp) => channelsApi.update(editingId.value!, data, otp))
      } else {
        await withOtpRetry((otp) => channelsApi.create(data, otp))
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

async function deleteChannel(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除渠道 "${row.name}" 吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => channelsApi.delete(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function rotateKey(row: any) {
  try {
    await ElMessageBox.confirm(`确定要轮换渠道 "${row.name}" 的密钥吗？`, '确认', { type: 'warning' })
    const res: any = await withOtpRetry((otp) => channelsApi.rotateKey(row.id, otp))
    ElMessage.success('密钥已轮换')
    if (res?.secret || res?.key) {
      ElMessageBox.alert(`新密钥: ${res.secret || res.key}`, '密钥信息')
    }
  } catch {
    // cancelled
  }
}

// Embed
const embedDialogVisible = ref(false)
const embedCode = ref('')

async function viewEmbed(row: any) {
  try {
    const res: any = await channelsApi.embed(row.id)
    embedCode.value = typeof res === 'string' ? res : res?.embed_code || res?.html || JSON.stringify(res, null, 2)
    embedDialogVisible.value = true
  } catch {
    // handled
  }
}

async function copyEmbed() {
  try {
    await navigator.clipboard.writeText(embedCode.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  loadTemplates()
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
