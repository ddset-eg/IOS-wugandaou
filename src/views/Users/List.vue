<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div style="display: flex; gap: 10px; align-items: center">
          <el-input v-model="filters.search" placeholder="搜索用户" clearable style="width: 200px" @keyup.enter="loadData" />
          <el-select v-model="filters.role" placeholder="角色" clearable style="width: 120px" @change="loadData">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="查看者" value="viewer" />
          </el-select>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
        <el-button type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon> 新建用户
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="用户名" prop="username" min-width="120" />
        <el-table-column label="角色" prop="role" width="100">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="2FA启用" prop="twofa_enabled" width="90">
          <template #default="{ row }">
            <el-tag :type="row.twofa_enabled ? 'success' : 'info'" size="small">
              {{ row.twofa_enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" prop="last_login" width="180" />
        <el-table-column label="创建时间" prop="created_at" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" @click="changePassword(row)">改密码</el-button>
            <el-button text size="small" @click="forceLogout(row)">强制登出</el-button>
            <el-button text size="small" @click="reset2fa(row)">重置2FA</el-button>
            <el-button text size="small" type="danger" @click="deleteUser(row)" v-if="row.username !== 'admin'">删除</el-button>
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
    <el-dialog v-model="formDialogVisible" :title="editMode ? '编辑用户' : '新建用户'" width="500px">
      <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="用户名" :disabled="editMode" />
        </el-form-item>
        <el-form-item v-if="!editMode" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- Change Password Dialog -->
    <el-dialog v-model="pwdDialogVisible" title="修改密码" width="400px">
      <el-form label-position="top">
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.password" type="password" show-password placeholder="新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="confirmChangePassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue'
import { usersApi } from '@/api/modules'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const withOtpRetry = inject('withOtpRetry') as <T>(fn: (otp?: string) => Promise<T>) => Promise<T>

const loading = ref(false)
const tableData = ref<any[]>([])
const filters = reactive({ search: '', role: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      search: filters.search || undefined,
      role: filters.role || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await usersApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function roleTagType(role: string): any {
  const map: Record<string, string> = { admin: 'danger', operator: 'warning', viewer: 'info' }
  return map[role] || 'info'
}

// Form
const formDialogVisible = ref(false)
const editMode = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const formData = reactive({
  username: '',
  password: '',
  role: 'viewer',
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function openCreate() {
  editMode.value = false
  editingId.value = null
  formData.username = ''
  formData.password = ''
  formData.role = 'viewer'
  formDialogVisible.value = true
}

function openEdit(row: any) {
  editMode.value = true
  editingId.value = row.id
  formData.username = row.username || ''
  formData.password = ''
  formData.role = row.role || 'viewer'
  formDialogVisible.value = true
}

async function saveForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    formLoading.value = true
    try {
      if (editMode.value && editingId.value) {
        const data: Record<string, any> = { role: formData.role }
        if (formData.password) data.password = formData.password
        await withOtpRetry((otp) => usersApi.update(editingId.value!, data, otp))
      } else {
        await withOtpRetry((otp) => usersApi.create({ username: formData.username, password: formData.password, role: formData.role }, otp))
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

async function deleteUser(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => usersApi.delete(row.id, otp))
    ElMessage.success('删除成功')
    loadData()
  } catch {
    // cancelled
  }
}

// Change password
const pwdDialogVisible = ref(false)
const pwdLoading = ref(false)
const pwdTarget = ref<any>(null)
const pwdForm = reactive({ password: '' })

function changePassword(row: any) {
  pwdTarget.value = row
  pwdForm.password = ''
  pwdDialogVisible.value = true
}

async function confirmChangePassword() {
  if (!pwdForm.password) {
    ElMessage.warning('请输入新密码')
    return
  }
  pwdLoading.value = true
  try {
    await withOtpRetry((otp) => usersApi.changePassword(pwdTarget.value.id, { password: pwdForm.password, new_password: pwdForm.password }, otp))
    ElMessage.success('密码已修改')
    pwdDialogVisible.value = false
  } catch {
    // handled
  } finally {
    pwdLoading.value = false
  }
}

async function forceLogout(row: any) {
  try {
    await ElMessageBox.confirm(`确定要强制登出用户 "${row.username}" 吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => usersApi.forceLogout(row.id, otp))
    ElMessage.success('已强制登出')
  } catch {
    // cancelled
  }
}

async function reset2fa(row: any) {
  try {
    await ElMessageBox.confirm(`确定要重置用户 "${row.username}" 的2FA吗？`, '确认', { type: 'warning' })
    await withOtpRetry((otp) => usersApi.reset2fa(row.id, otp))
    ElMessage.success('2FA已重置')
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
