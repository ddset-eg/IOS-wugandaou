<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon :size="48" color="#409EFF"><Monitor /></el-icon>
        <h1>iOS Admin Panel</h1>
        <p>iOS 设备管理后台</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item v-if="show2fa" prop="otpCode" label="OTP 验证码">
          <el-input
            v-model="form.otpCode"
            placeholder="请输入 6 位动态密码"
            size="large"
            :prefix-icon="Key"
            maxlength="6"
            @keyup.enter="handleVerify2fa"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            v-if="!show2fa"
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登 录
          </el-button>
          <el-button
            v-else
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleVerify2fa"
          >
            验 证
          </el-button>
        </el-form-item>
        <el-form-item v-if="show2fa">
          <el-button text @click="show2fa = false">返回登录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>iOS Device Management Console</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const show2fa = ref(false)
const tempToken = ref('')

const form = reactive({
  username: '',
  password: '',
  otpCode: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const result = await authStore.login(form.username, form.password)
      if (result.requires2fa) {
        tempToken.value = result.tempToken
        show2fa.value = true
        ElMessage.info('请输入 OTP 验证码')
      } else {
        ElMessage.success('登录成功')
        router.push('/dashboard')
      }
    } catch {
      // Error handled by interceptor
    } finally {
      loading.value = false
    }
  })
}

async function handleVerify2fa() {
  if (!form.otpCode) {
    ElMessage.warning('请输入 OTP 验证码')
    return
  }
  loading.value = true
  try {
    await authStore.verify2fa(tempToken.value, form.otpCode)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2a6c, #2a4858, #667eea);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 26px;
  color: #303133;
  margin: 10px 0 5px;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  margin-top: 10px;
}
</style>
