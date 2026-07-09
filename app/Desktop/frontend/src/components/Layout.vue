<template>
  <div class="layout">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <div class="main-content">
      <Header @toggle-sidebar="toggleSidebar" />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';

const sidebarCollapsed = ref(false);
const toggleSidebar = () => sidebarCollapsed.value = !sidebarCollapsed.value;
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
}
.content {
  flex: 1;
  padding: 20px;
  background: var(--bg-secondary);
}
</style>