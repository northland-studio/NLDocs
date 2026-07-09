<template>
  <button
    :class="['base-btn', `base-btn--${variant}`, { 'base-btn--block': block }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'dark', 'pill', 'pill-dark', 'filter'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
});
defineEmits(['click']);
</script>

<style scoped>
.base-btn {
  font-family: var(--font-text);
  font-size: 17px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.374px;
  padding: 8px 15px;
  border-radius: var(--radius-standard);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.base-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.base-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.base-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.base-btn--primary {
  background: var(--color-accent);
  color: #ffffff;
}
.base-btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.base-btn--dark {
  background: #1d1d1f;
  color: #ffffff;
}
.base-btn--dark:hover:not(:disabled) {
  background: #424245;
}

.base-btn--pill {
  background: transparent;
  color: var(--color-link);
  border: 1px solid var(--color-link);
  border-radius: var(--radius-pill);
  font-size: 14px;
  letter-spacing: -0.224px;
  padding: 8px 16px;
}
.base-btn--pill:hover:not(:disabled) {
  text-decoration: underline;
}

.base-btn--pill-dark {
  background: transparent;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: var(--radius-pill);
  font-size: 14px;
  letter-spacing: -0.224px;
  padding: 8px 16px;
}
.base-btn--pill-dark:hover:not(:disabled) {
  text-decoration: underline;
}

.base-btn--filter {
  background: #fafafc;
  color: var(--color-text-secondary);
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  padding: 0 14px;
  font-size: 14px;
}
.base-btn--filter:hover:not(:disabled) {
  background: #ededf2;
}

.base-btn--block {
  display: flex;
  width: 100%;
}
</style>