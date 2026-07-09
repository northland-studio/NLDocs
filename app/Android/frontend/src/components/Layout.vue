<template>
  <div class="layout" :class="{ 'is-mobile': isMobile, 'sidebar-open': sidebarOpen }">
    <!-- Mobile overlay backdrop -->
    <transition name="fade">
      <div
        v-if="isMobile && sidebarOpen"
        class="sidebar-overlay"
        @click="closeSidebar"
      ></div>
    </transition>

    <!-- Sidebar (drawer on mobile, static on desktop) -->
    <div class="sidebar-wrapper" :class="{ 'drawer-open': isMobile && sidebarOpen }">
      <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    </div>

    <div class="main-content">
      <Header @toggle-sidebar="toggleSidebar" />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';

const sidebarCollapsed = ref(false);
const sidebarOpen = ref(false);
const isMobile = ref(false);

// Breakpoint for mobile drawer behavior
const MOBILE_BREAKPOINT = 768;

const checkViewport = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  // Auto-close drawer when switching to desktop
  if (!isMobile.value) {
    sidebarOpen.value = false;
  }
};

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

onMounted(() => {
  checkViewport();
  window.addEventListener('resize', checkViewport);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkViewport);
});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Sidebar wrapper */
.sidebar-wrapper {
  position: relative;
  z-index: 100;
}

/* Main content area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
  min-width: 0;
}

.content {
  flex: 1;
  padding: 20px;
  background: var(--bg-secondary);
  /* Respect bottom safe-area on notched devices */
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

/* ===========================================================
   Mobile-specific styles (drawer pattern + safe area + touch)
   =========================================================== */
@media (max-width: 767px) {
  .layout {
    /* Account for status bar / notch on native */
    padding-top: env(safe-area-inset-top);
  }

  .sidebar-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 200;
    /* Pull sidebar above the status bar safe area */
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
  }

  .sidebar-wrapper.drawer-open {
    transform: translateX(0);
  }

  .content {
    padding: 16px;
    /* Bottom safe area handled above; tighten side padding on phones */
    padding-left: calc(16px + env(safe-area-inset-left));
    padding-right: calc(16px + env(safe-area-inset-right));
  }

  /* Overlay backdrop when drawer is open */
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 150;
  }
}

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* ===========================================================
   Global mobile touch-target & tap-highlight improvements.
   These are unscoped so they cascade into child components.
   =========================================================== */
@media (max-width: 767px) {
  /* Larger touch targets for buttons / nav items */
  .nav-item,
  .toggle-btn,
  .action-btn,
  button {
    min-height: 44px;
    min-width: 44px;
  }

  /* Remove the 300ms tap delay gray flash */
  button,
  a {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
  }

  /* Prevent text selection on tap for UI chrome */
  .header,
  .sidebar {
    -webkit-user-select: none;
    user-select: none;
  }
}
</style>
