<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 24 }
});
</script>

<style scoped>
.icon {
  color: var(--text-primary, currentColor);
}
</style>