<template>
  <div class="base-select-wrap">
    <label v-if="label" class="base-select-label">{{ label }}</label>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="base-select"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.base-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.base-select-label {
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.224px;
}

.base-select {
  width: 100%;
  padding: 10px 15px;
  background: #fafafc;
  border: 3px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-comfortable);
  font-family: var(--font-text);
  font-size: 17px;
  color: var(--color-text-primary);
  letter-spacing: -0.374px;
  transition: border-color 0.15s ease;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%231d1d1f' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
  padding-right: 40px;
}

.base-select:focus {
  border-color: var(--color-accent);
}

.base-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

[data-theme="dark"] .base-select {
  background-color: #1d1d1f;
  border-color: rgba(255, 255, 255, 0.08);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23ffffff' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
}
</style>