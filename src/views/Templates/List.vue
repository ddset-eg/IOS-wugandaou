<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.search" placeholder="搜索模板" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-input v-model="filters.category" placeholder="分类" clearable style="width: 150px" @keyup.enter="loadData" />
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <div>
          <el-button @click="seedTemplates">
            <el-icon><MagicStick /></el-icon> 初始化模板
          </el-button>
          <el-button type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon> 新建模板
          </el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="名称" prop="name" min-width="150" />
        <el-table-column label="Slug" prop="slug" min-width="120" />
        <el-table-column label="分类" prop="category" width="120" />
        <el-table-column label="标题" prop="title" min-width="150" show-overflow-tooltip />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="启用" prop="enabled" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">{{ row.enabled ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="previewTemplate(row)">预览</el-button>
            <el-button text size="small" type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="deleteTemplate(row)">删除</el-button>
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
    <el-dialog v-model="formDialogVisible" :title="editMode ? '编辑模板' : '新建模板'" width="750px">
      <el-form :model="formData" label-width="120px" :rules="formRules" ref="formRef">
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="formData.slug" placeholder="唯一标识" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="formData.category" placeholder="分类" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="页面标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="HTML Index">
          <el-input v-model="formData.html_index" type="textarea" :rows="5" placeholder="HTML内容" />
        </el-form-item>
        <el-form-item label="HTML Frame">
          <el-input v-model="formData.html_frame" type="textarea" :rows="5" placeholder="框架HTML" />
        </el-form-item>
        <el-form-item label="JS Assets">
          <el-input v-model="formData.js_assets" type="textarea" :rows="2" placeholder="JS资源，逗号分隔" />
        </el-form-item>
        <el-form-item label="CSS Assets">
          <el-input v-model="formData.css_assets" type="textarea" :rows="2" placeholder="CSS资源，逗号分隔" />
        </el-form-item>
        <el-form-item label="预览URL">
          <el-input v-model="formData.preview_url" placeholder="预览URL" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="模板预览" width="800px">
      <div v-html="previewHtml" style="min-height: 400px"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { templatesApi } from '@/api/modules'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const filters = reactive({ search: '', category: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      search: filters.search || undefined,
      category: filters.category || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await templatesApi.list(params)
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
  slug: '',
  name: '',
  category: '',
  title: '',
  description: '',
  html_index: '',
  html_frame: '',
  js_assets: '',
  css_assets: '',
  preview_url: '',
  enabled: true,
})

const formRules: FormRules = {
  slug: [{ required: true, message: '请输入 Slug', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function openCreate() {
  editMode.value = false
  editingId.value = null
  Object.assign(formData, {
    slug: '', name: '', category: '', title: '', description: '',
    html_index: '', html_frame: '', js_assets: '', css_assets: '',
    preview_url: '', enabled: true,
  })
  formDialogVisible.value = true
}

function openEdit(row: any) {
  editMode.value = true
  editingId.value = row.id
  Object.assign(formData, {
    slug: row.slug || '',
    name: row.name || '',
    category: row.category || '',
    title: row.title || '',
    description: row.description || '',
    html_index: row.html_index || '',
    html_frame: row.html_frame || '',
    js_assets: Array.isArray(row.js_assets) ? row.js_assets.join(', ') : (row.js_assets || ''),
    css_assets: Array.isArray(row.css_assets) ? row.css_assets.join(', ') : (row.css_assets || ''),
    preview_url: row.preview_url || '',
    enabled: row.enabled ?? true,
  })
  formDialogVisible.value = true
}

async function saveForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      const data: Record<string, any> = { ...formData }
      if (data.js_assets && typeof data.js_assets === 'string') {
        data.js_assets = data.js_assets.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (data.css_assets && typeof data.css_assets === 'string') {
        data.css_assets = data.css_assets.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      if (editMode.value && editingId.value) {
        await withOtpRetry((otp) => templatesApi.update(editingId.value!, data, otp))
      } else {
        await withOtpRetry((otp) => templatesApi.create(data, otp))
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

async function deleteTemplate(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除模板 "${row.name}" 吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => templatesApi.delete(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}

async function seedTemplates() {
  try {
    await ElMessageBox.confirm('确定要初始化默认模板吗？', '确认', { type: 'info' })
    await withOtpRetry((otp) => templatesApi.seed(false, otp))
    ElMessage.success('初始化成功')
    loadData()
  } catch {
    // cancelled
  }
}

// Preview
const previewVisible = ref(false)
const previewHtml = ref('')

async function previewTemplate(row: any) {
  try {
    const res: any = await templatesApi.preview(row.id)
    previewHtml.value = typeof res === 'string' ? res : res?.html || res?.html_index || '<pre>' + JSON.stringify(res, null, 2) + '</pre>'
    previewVisible.value = true
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
