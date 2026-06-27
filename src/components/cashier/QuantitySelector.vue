<template>
  <div class="qty-selector">
    <v-btn
      icon
      variant="outlined"
      color="primary"
      size="default"
      :disabled="disabled || modelValue <= (min ?? 1)"
      class="qty-btn"
      aria-label="Diminuir quantidade"
      @click="decrement"
    >
      <v-icon size="22">mdi-minus</v-icon>
    </v-btn>

    <div class="qty-display">
      <span class="qty-number">{{ modelValue }}</span>
    </div>

    <v-btn
      icon
      variant="outlined"
      color="primary"
      size="default"
      :disabled="disabled || (max !== undefined && modelValue >= max)"
      class="qty-btn"
      aria-label="Aumentar quantidade"
      @click="increment"
    >
      <v-icon size="22">mdi-plus</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function decrement() {
  const next = props.modelValue - 1
  if (next >= (props.min ?? 1)) emit('update:modelValue', next)
}

function increment() {
  const next = props.modelValue + 1
  if (props.max === undefined || next <= props.max) emit('update:modelValue', next)
}
</script>

<style scoped>
.qty-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 48px !important;
  height: 48px !important;
}

.qty-display {
  min-width: 48px;
  text-align: center;
}

.qty-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.87);
}
</style>
