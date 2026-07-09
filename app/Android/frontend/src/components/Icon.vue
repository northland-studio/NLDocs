<template>
  <svg :width="size" :height="size" :fill="color" class="icon">
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
  color: { type: String, default: 'currentColor' }
});
</script>

<style scoped>
.icon {
  color: var(--text-primary, currentColor);
}
</style>