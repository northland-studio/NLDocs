<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="t-sub-heading">正在处理登录</p>
        <p class="t-caption">请稍候...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <p class="t-sub-heading">登录失败</p>
        <p class="t-caption">{{ error }}</p>
        <BaseButton variant="primary" @click="$router.push('/login')">返回登录</BaseButton>
      </div>
      <div v-else class="success-state">
        <div class="spinner"></div>
        <p class="t-sub-heading">登录成功</p>
        <p class="t-caption">正在跳转...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  const code = new URLSearchParams(window.location.search).get('code');
  const state = new URLSearchParams(window.location.search).get('state');
  const savedState = localStorage.getItem('oauth_state');

  if (!savedState) {
    error.value = '请从登录页面发起授权请求';
    loading.value = false;
    return;
  }

  if (state !== savedState) {
    error.value = '授权验证失败，请重新登录';
    localStorage.removeItem('oauth_state');
    loading.value = false;
    return;
  }

  try {
    const response = await axios.post('/api/auth/callback', { code });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      localStorage.removeItem('oauth_state');
      router.push('/');
    } else {
      error.value = response.data.message || '未知错误';
      loading.value = false;
    }
  } catch (e) {
    const errData = e.response?.data;
    let errMsg = '登录失败';
    if (errData?.message) errMsg = errData.message;
    else if (errData?.error) errMsg = errData.error;
    else if (e.message) errMsg = e.message;
    if (errData?.details) console.error('OAuth error details:', errData.details);
    error.value = errMsg;
    loading.value = false;
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  padding: 20px;
}

.callback-card {
  background: var(--color-bg-secondary);
  padding: 48px 40px;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 113, 227, 0.2);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-circle);
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-circle);
  background: var(--color-error);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.loading-state .t-sub-heading,
.success-state .t-sub-heading {
  color: var(--color-text-primary);
  margin: 0;
}

.error-state .t-sub-heading {
  color: var(--color-error);
  margin: 0;
}

.t-caption {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
}
</style>