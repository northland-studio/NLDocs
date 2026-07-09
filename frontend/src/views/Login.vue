<template>
  <div class="login-page">
    <div class="login-card">
      <img src="@/assets/icon.png" alt="北域文档" class="logo">
      <h1 class="t-display-hero">北域文档</h1>
      <p class="subtitle-en">Northland Docs</p>
      <p class="subtitle">使用玄剑公会账号登录</p>
      <BaseButton variant="primary" block @click="handleLogin" class="login-btn">
        <UserIcon />
        玄剑公会账号登录
      </BaseButton>
      <div class="footer">
        <p>由 <a href="https://beiyu.xuanjian.top" target="_blank">北域工作室</a> 维护</p>
        <p class="footer-en">Northland Studio</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import UserIcon from '@/assets/icons/UserIcon.vue';
import BaseButton from '@/components/BaseButton.vue';

const handleLogin = () => {
  const clientId = 'NLDocs';
  const redirectUri = encodeURIComponent(window.location.origin + '/callback');
  const state = Math.random().toString(36).substring(7);
  localStorage.setItem('oauth_state', state);

  window.location.href = `https://xuanjian.top/api/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  padding: 20px;
}

.login-card {
  background: var(--color-bg-secondary);
  padding: 48px 40px;
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logo {
  width: 72px;
  height: 72px;
  margin-bottom: 24px;
  border-radius: var(--radius-standard);
}

.subtitle-en {
  color: var(--color-text-secondary);
  margin: 4px 0 32px 0;
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 400;
  line-height: 1.19;
  letter-spacing: 0.231px;
}

.subtitle {
  color: var(--color-text-secondary);
  margin: 0 0 32px 0;
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.29;
  letter-spacing: -0.224px;
}

.login-btn {
  margin-bottom: 8px;
}

.footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  font-family: var(--font-text);
  font-size: 12px;
  line-height: 1.33;
  letter-spacing: -0.12px;
}

.footer p {
  margin: 0;
}

.footer a {
  color: var(--color-link);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

.footer-en {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
  line-height: 1.47;
  letter-spacing: -0.08px;
}
</style>