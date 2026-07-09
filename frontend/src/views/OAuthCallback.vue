<template>
  <div class="callback-page">
    <div v-if="loading">正在处理登录...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else>登录成功，正在跳转...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  const code = new URLSearchParams(window.location.search).get('code');
  const state = new URLSearchParams(window.location.search).get('state');
  const savedState = localStorage.getItem('oauth_state');
  
  // 严格验证state防止CSRF
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
  
  // 调用后端接口换取token
  try {
    const response = await axios.post('/api/auth/callback', { code });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      localStorage.removeItem('oauth_state');
      router.push('/');
    } else {
      error.value = '登录失败：' + (response.data.message || '未知错误');
      loading.value = false;
    }
  } catch (e) {
    const errData = e.response?.data;
    let errMsg = '登录失败';
    if (errData?.message) {
      errMsg += '：' + errData.message;
    } else if (errData?.error) {
      errMsg += '：' + errData.error;
    } else if (e.message) {
      errMsg += '：' + e.message;
    }
    if (errData?.details) {
      console.error('OAuth error details:', errData.details);
    }
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
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1.1rem;
}
</style>