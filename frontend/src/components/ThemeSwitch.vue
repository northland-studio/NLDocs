<template>
  <button @click="toggleTheme" class="theme-switch" :title="isDark ? '切换到白天模式' : '切换到暗色模式'">
    <SunIcon v-if="isDark" />
    <MoonIcon v-else />
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SunIcon from '@/assets/icons/SunIcon.vue';
import MoonIcon from '@/assets/icons/MoonIcon.vue';

const isDark = ref(false);

onMounted(() => {
  // 读取本地存储的主题设置
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    isDark.value = true;
  }
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : '');
  localStorage.setItem('theme', theme);
};
</script>

<style scoped>
.theme-switch {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--text-primary);
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switch:hover {
  background-color: var(--bg-hover);
  transform: scale(1.1);
}

.theme-switch:active {
  transform: scale(0.95);
}

.theme-switch svg {
  width: 24px;
  height: 24px;
}
</style>