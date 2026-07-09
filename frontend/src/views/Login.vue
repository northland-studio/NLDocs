<template>
  <div class="login-page">
    <div class="login-card">
      <img src="/icon.png" alt="北域文档" class="logo">
      <h1>北域文档</h1>
      <p class="subtitle-en">Northland Docs</p>
      <p class="subtitle">使用玄剑公会账号登录</p>
      <button @click="handleLogin" class="login-btn">
        <UserIcon />
        玄剑公会账号登录
      </button>
      <div class="footer">
        <p>由 <a href="https://beiyu.xuanjian.top" target="_blank">北域工作室</a> 维护</p>
        <p class="footer-en">Northland Studio</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import UserIcon from '@/assets/icons/UserIcon.vue';

const handleLogin = () => {
  const clientId = 'NLDocs';  // 或从环境变量读取
  const redirectUri = encodeURIComponent(window.location.origin + '/callback');
  const state = Math.random().toString(36).substring(7);  // 防CSRF
  localStorage.setItem('oauth_state', state);
  
  // 跳转到玄剑官网授权页面
  window.location.href = `https://xuanjian.top/api/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.login-card {
  background: var(--bg-secondary);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  border-radius: 12px;
}

h1 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  font-size: 1.8rem;
}

.subtitle-en {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--accent-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  background: var(--accent-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.login-btn:active {
  transform: translateY(0);
}

.login-btn svg {
  width: 20px;
  height: 20px;
}

.footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.footer p {
  margin: 0;
}

.footer a {
  color: var(--accent-primary, #3b82f6);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

.footer-en {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}
</style>