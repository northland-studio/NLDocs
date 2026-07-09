<template>
  <div class="download-page">
    <!-- 英雄区 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="t-display-hero">下载客户端</h1>
        <p class="hero-subtitle t-sub-heading">选择适合你的平台</p>
      </div>
    </section>

    <!-- 平台卡片 -->
    <section class="platforms-section">
      <div class="platforms-grid">
        <!-- PWA -->
        <BaseCard elevated class="platform-card">
          <div class="card-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              :width="40"
              :height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <h2 class="card-title t-card-title">网页版 PWA</h2>
          <p class="card-desc t-body">无需安装，浏览器直接使用</p>
          <BaseButton variant="primary" block @click="handlePwaInstall">
            安装 PWA
          </BaseButton>
        </BaseCard>

        <!-- Android -->
        <BaseCard elevated class="platform-card">
          <div class="card-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              :width="40"
              :height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="5" y1="2" x2="7.5" y2="6"></line>
              <line x1="19" y1="2" x2="16.5" y2="6"></line>
              <path d="M6 8h12v6a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8z"></path>
              <line x1="9" y1="11" x2="9" y2="14"></line>
              <line x1="15" y1="11" x2="15" y2="14"></line>
              <line x1="5" y1="11" x2="2" y2="16"></line>
              <line x1="19" y1="11" x2="22" y2="16"></line>
            </svg>
          </div>
          <h2 class="card-title t-card-title">Android 应用</h2>
          <p class="card-desc t-body">原生 Android 应用，离线可用</p>
          <BaseButton variant="primary" block @click="downloadAndroid">
            下载 APK
          </BaseButton>
        </BaseCard>

        <!-- Desktop -->
        <BaseCard elevated class="platform-card">
          <div class="card-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              :width="40"
              :height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <h2 class="card-title t-card-title">桌面应用</h2>
          <p class="card-desc t-body">Windows / macOS / Linux</p>
          <div class="desktop-buttons">
            <BaseButton variant="pill" @click="downloadDesktop('windows')">
              Windows
            </BaseButton>
            <BaseButton variant="pill" @click="downloadDesktop('macos')">
              macOS
            </BaseButton>
            <BaseButton variant="pill" @click="downloadDesktop('linux')">
              Linux
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="footer-section">
      <div class="footer-content">
        <p class="footer-name">北域工作室</p>
        <p class="footer-en">Northland Studio</p>
        <a
          class="footer-link"
          href="https://beiyu.xuanjian.top"
          target="_blank"
          rel="noopener noreferrer"
        >
          beiyu.xuanjian.top
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '@/components/BaseCard.vue';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const GITHUB_RELEASES = 'https://github.com/northland-studio/NLDocs/releases';

// PWA 安装提示事件
let deferredPrompt = null;
const pwaInstallable = ref(false);

const handleBeforeInstallPrompt = (e) => {
  // 阻止浏览器默认的安装提示，由按钮触发
  e.preventDefault();
  deferredPrompt = e;
  pwaInstallable.value = true;
};

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
});

// 判断是否为 iOS（不含 iPadOS 桌面 UA）
const isIOS = () => {
  const ua = window.navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  return isIOSDevice;
};

// PWA 安装处理
const handlePwaInstall = async () => {
  // iOS 不支持 beforeinstallprompt，跳转到 iOS 安装引导页
  if (isIOS()) {
    router.push('/ios-install');
    return;
  }

  // Chrome/Edge 等支持 PWA 安装的浏览器
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (error) {
      console.error('PWA 安装选择失败:', error);
    }
    deferredPrompt = null;
    pwaInstallable.value = false;
    return;
  }

  // 不支持自动安装提示的桌面/其他浏览器：跳转到 iOS 安装引导页作为兜底说明
  router.push('/ios-install');
};

// Android APK 下载
const downloadAndroid = () => {
  window.open(GITHUB_RELEASES, '_blank', 'noopener,noreferrer');
};

// 桌面端下载
const downloadDesktop = (platform) => {
  window.open(`${GITHUB_RELEASES}`, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
.download-page {
  min-height: 100%;
}

/* 英雄区 */
.hero-section {
  background: #000000;
  padding: 120px 24px;
  text-align: center;
}

.hero-content {
  max-width: 980px;
  margin: 0 auto;
}

.hero-content .t-display-hero {
  color: #ffffff;
  margin: 0 0 8px 0;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* 平台卡片区 */
.platforms-section {
  background: var(--color-bg-primary);
  padding: 60px 24px 80px 24px;
}

.platforms-grid {
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 24px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.platform-card:hover {
  transform: translateY(-2px);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-comfortable);
  background: var(--color-bg-tertiary);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.card-title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.card-desc {
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
  min-height: 50px;
}

.desktop-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  width: 100%;
}

/* 页脚 */
.footer-section {
  background: var(--color-bg-primary);
  padding: 40px 24px 60px 24px;
  border-top: 1px solid var(--color-border);
}

.footer-content {
  max-width: 980px;
  margin: 0 auto;
  text-align: center;
}

.footer-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.374px;
}

.footer-en {
  font-family: var(--font-text);
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 4px 0 12px 0;
  letter-spacing: -0.12px;
}

.footer-link {
  font-family: var(--font-text);
  font-size: 14px;
  color: var(--color-link);
  text-decoration: none;
  letter-spacing: -0.224px;
}

.footer-link:hover {
  text-decoration: underline;
}

/* 响应式：平板与移动端 */
@media (max-width: 834px) {
  .platforms-grid {
    grid-template-columns: 1fr;
    max-width: 480px;
  }

  .card-desc {
    min-height: auto;
  }
}
</style>
