<template>
  <el-dialog
    v-model="visible"
    title="OTP 验证"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="onClose"
  >
    <div class="otp-dialog-body">
      <p class="otp-hint">此操作需要 OTP 验证码，请输入您的动态密码：</p>
      <el-input
        v-model="otpCode"
        placeholder="请输入 OTP 验证码"
        size="large"
        maxlength="6"
        @keyup.enter="confirm"
        ref="otpInputRef"
      >
        <template #prefix>
          <el-icon><Key /></el-icon>
        </template>
      </el-input>
    </div>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" :loading="loading" @click="confirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const visible = ref(false)
const otpCode = ref('')
const loading = ref(false)
const otpInputRef = ref<any>(null)

let resolveFn: ((value: string) => void) | null = null
let rejectFn: ((reason: any) => void) | null = null

function requestOtp(): Promise<string> {
  otpCode.value = ''
  visible.value = true
  nextTick(() => {
    otpInputRef.value?.focus()
  })
  return new Promise<string>((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
}

function confirm() {
  if (!otpCode.value) {
    return
  }
  loading.value = true
  if (resolveFn) {
    resolveFn(otpCode.value)
  }
  loading.value = false
  visible.value = false
  resolveFn = null
  rejectFn = null
}

function cancel() {
  if (rejectFn) {
    rejectFn(new Error('用户取消'))
  }
  visible.value = false
  resolveFn = null
  rejectFn = null
}

function onClose() {
  if (rejectFn) {
    rejectFn(new Error('对话框关闭'))
  }
  resolveFn = null
  rejectFn = null
}

defineExpose({ requestOtp })
</script>

<style scoped>
.otp-dialog-body {
  padding: 10px 0;
}

.otp-hint {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}
</style>
