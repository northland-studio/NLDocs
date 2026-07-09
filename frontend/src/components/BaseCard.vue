<template>
  <div :class="['base-card', { 'base-card--elevated': elevated }]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  elevated: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.base-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-standard);
  padding: 20px;
  border: none;
  transition: box-shadow 0.2s ease;
}

.base-card--elevated {
  box-shadow: var(--shadow-card);
}
</style>