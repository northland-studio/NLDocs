<template>
  <div class="base-input-wrap">
    <label v-if="label" class="base-input-label">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="base-input"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  disabled: { type: Boolean, default: false }
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.base-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.base-input-label {
  font-family: var(--font-text);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.224px;
}

.base-input {
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
}

.base-input::placeholder {
  color: var(--color-text-tertiary);
}

.base-input:focus {
  border-color: var(--color-accent);
}

.base-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

[data-theme="dark"] .base-input {
  background: #1d1d1f;
  border-color: rgba(255, 255, 255, 0.08);
}
</style>