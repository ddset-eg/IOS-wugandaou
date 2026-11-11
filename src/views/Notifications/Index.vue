<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="table-toolbar">
        <div>
          <el-radio-group v-model="filters.unread_only" @change="loadData">
            <el-radio-button :value="false">全部</el-radio-button>
            <el-radio-button :value="true">未读</el-radio-button>
          </el-radio-group>
          <el-select v-model="filters.category" clearable placeholder="分类" style="width: 150px; margin-left: 10px" @change="loadData">
            <el-option label="系统" value="system" />
            <el-option label="设备" value="device" />
            <el-option label="安全" value="security" />
            <el-option label="命令" value="command" />
          </el-select>
        </div>
        <div>
          <el-button @click="markAllRead">全部已读</el-button>
          <el-button type="danger" @click="clearAll">清空通知</el-button>
        </div>
      </div>

      <div v-loading="loading" class="notif-container">
        <div v-for="n in tableData" :key="n.id" class="notif-card" :class="{ unread: !n.read }">
          <div class="notif-card-header">
            <el-tag :type="notifTagType(n.category)" size="small">{{ n.category || '系统' }}</el-tag>
            <span class="notif-title">{{ n.title }}</span>
            <span class="notif-time">{{ n.created_at }}</span>
          </div>
          <div class="notif-message">{{ n.message }}</div>
          <div class="notif-actions">
            <el-button v-if="!n.read" text size="small" @click="markRead(n)">标为已读</el-button>
            <el-button text size="small" type="danger" @click="deleteNotif(n)">删除</el-button>
          </div>
        </div>
        <div v-if="!loading && tableData.length === 0" class="empty-state">
          <el-empty description="暂无通知" />
        </div>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { notificationsApi } from '@/api/modules'
import { ElMessage, ElMessageBox } from 'element-plus'

const appStore = useAppStore()
const loading = ref(false)
const tableData = ref<any[]>([])

const filters = reactive({
  unread_only: false,
  category: '',
})

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
      unread_only: filters.unread_only || undefined,
      category: filters.category || undefined,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const res: any = await notificationsApi.list(params)
    tableData.value = res?.items || res || []
    pagination.total = res?.total ?? tableData.value.length
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function markRead(n: any) {
  try {
    await notificationsApi.markRead(n.id)
    n.read = true
    appStore.setUnreadCount(Math.max(0, appStore.unreadNotifications - 1))
  } catch {
    // handled
  }
}

async function markAllRead() {
  try {
    await notificationsApi.markAllRead()
    tableData.value.forEach((n) => { n.read = true })
    appStore.setUnreadCount(0)
    ElMessage.success('已全部标为已读')
  } catch {
    // handled
  }
}

async function deleteNotif(n: any) {
  try {
    await notificationsApi.delete(n.id)
    ElMessage.success('已删除')
    loadData()
  } catch {
    // handled
  }
}

async function clearAll() {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？', '确认', { type: 'warning' })
    await notificationsApi.clear(filters.category || undefined)
    ElMessage.success('已清空')
    loadData()
    appStore.setUnreadCount(0)
  } catch {
    // cancelled
  }
}

function notifTagType(category: string): any {
  const map: Record<string, any> = { system: 'primary', device: 'success', security: 'danger', command: 'warning' }
  return map[category] || 'info'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.notif-container {
  min-height: 300px;
}
.notif-card {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
}
.notif-card.unread {
  background: #ecf5ff;
  border-color: #b3d8ff;
}
.notif-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.notif-title {
  font-weight: 600;
  flex: 1;
}
.notif-time {
  color: #909399;
  font-size: 12px;
}
.notif-message {
  color: #606266;
  margin-bottom: 8px;
}
.notif-actions {
  display: flex;
  gap: 10px;
}
.empty-state {
  padding: 40px;
}
</style>
