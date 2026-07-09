<template>
  <div class="ios-install-page">
    <div class="ios-install-container">
      <header class="hero">
        <img src="@/assets/icon.png" alt="北域文档" class="logo" />
        <h1 class="title">添加到主屏幕</h1>
        <p class="subtitle">
          在 iOS 设备上将北域文档安装为应用，获得更接近原生的使用体验
        </p>
      </header>

      <BaseCard elevated class="steps-card">
        <h2 class="section-title">安装步骤</h2>
        <ol class="steps-list">
          <li class="step-item">
            <span class="step-number">1</span>
            <div class="step-content">
              <h3 class="step-title">在 Safari 中打开</h3>
              <p class="step-desc">
                请使用 Safari 浏览器访问本页面。其他浏览器不支持添加到主屏幕。
              </p>
            </div>
          </li>
          <li class="step-item">
            <span class="step-number">2</span>
            <div class="step-content">
              <h3 class="step-title">点击分享按钮</h3>
              <p class="step-desc">
                点击 Safari 底部工具栏中间的分享图标。
              </p>
            </div>
          </li>
          <li class="step-item">
            <span class="step-number">3</span>
            <div class="step-content">
              <h3 class="step-title">选择“添加到主屏幕”</h3>
              <p class="step-desc">
                在分享菜单中向下滚动，找到并轻点“添加到主屏幕”。
              </p>
            </div>
          </li>
          <li class="step-item">
            <span class="step-number">4</span>
            <div class="step-content">
              <h3 class="step-title">轻点“添加”</h3>
              <p class="step-desc">
                确认名称后轻点右上角的“添加”，即可在主屏幕看到 NLDocs 图标。
              </p>
            </div>
          </li>
        </ol>
      </BaseCard>

      <BaseCard elevated class="alt-card">
        <h2 class="section-title">配置描述文件</h2>
        <p class="alt-desc">
          也可以下载配置描述文件，通过系统设置安装 Web Clip，效果与添加到主屏幕相同。
        </p>
        <BaseButton variant="primary" block @click="downloadProfile">
          下载配置描述文件
        </BaseButton>
      </BaseCard>

      <div class="actions">
        <BaseButton variant="pill" @click="goHome">返回首页</BaseButton>
      </div>

      <footer class="footer">
        <p>由 <a href="https://beiyu.xuanjian.top" target="_blank" rel="noopener">北域工作室</a> 维护</p>
        <p class="footer-en">Northland Studio</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import BaseCard from '@/components/BaseCard.vue';
import BaseButton from '@/components/BaseButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const downloadProfile = () => {
  window.location.href = '/NLDocs.mobileconfig';
};

const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.ios-install-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}

.ios-install-container {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
}

.hero {
  text-align: center;
  padding: 16px 0 8px;
}

.logo {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-standard);
  margin-bottom: 20px;
}

.title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.32px;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.subtitle {
  font-family: var(--font-text);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.33;
  letter-spacing: -0.24px;
  color: var(--color-text-secondary);
  margin: 0 auto;
  max-width: 420px;
}

.steps-card,
.alt-card {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.21;
  letter-spacing: -0.228px;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
}

.steps-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-circle);
  background: var(--color-accent);
  color: #ffffff;
  font-family: var(--font-text);
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-family: var(--font-text);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.192px;
  color: var(--color-text-primary);
  margin: 4px 0 4px 0;
}

.step-desc {
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.36;
  letter-spacing: -0.182px;
  color: var(--color-text-secondary);
  margin: 0;
}

.alt-desc {
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.36;
  letter-spacing: -0.182px;
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.footer {
  text-align: center;
  padding-top: 16px;
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

@media (max-width: 480px) {
  .title {
    font-size: 28px;
  }
}
</style>
