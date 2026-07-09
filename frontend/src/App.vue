<script setup>
import { provide, ref } from 'vue'
import Layout from './components/Layout.vue'

// 提供主题切换功能
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

// 初始化主题
document.documentElement.setAttribute('data-theme', theme.value)

provide('theme', theme)
provide('toggleTheme', toggleTheme)
</script>

<template>
  <Layout>
    <router-view />
  </Layout>
</template>

<style scoped>
</style>