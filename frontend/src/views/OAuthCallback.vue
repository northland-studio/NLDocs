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
  
  // 验证state防止CSRF
  if (state !== savedState) {
    error.value = '授权验证失败';
    loading.value = false;
    return;
  }
  
  // 调用后端接口换取token
  try {
    const response = await axios.post('/api/auth/callback', { code });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    router.push('/');
  } catch (e) {
    error.value = '登录失败：' + (e.response?.data?.message || '未知错误');
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