<script setup lang="ts">
import { computed } from 'vue'
import type { FormDataField } from '../../types/form-data'

/** The form field definition. */
const props = defineProps<{
  /** The form field definition. */
  field: FormDataField
  /** Current answer value(s). */
  modelValue: string[]
  /** Whether the control is in builder preview mode. */
  preview?: boolean
  /** Whether the control is disabled. */
  disabled?: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

void props.preview

const optionValue = computed(() => props.field.value ?? 'on')
const checkedValue = computed(() => props.modelValue.includes(optionValue.value))

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  emit('update:modelValue', input.checked ? [optionValue.value] : [])
}
</script>

<template>
  <div
    class="checkbox-single"
    :class="[props.field.className]"
    data-qa="control-checkbox"
  >
    <label>
      <input
        type="checkbox"
        :name="props.field.name"
        :value="optionValue"
        :checked="checkedValue"
        :required="props.field.required"
        :disabled="props.disabled"
        :class="{ toggle: props.field.toggle }"
        data-qa="checkbox-single-input"
        @change="onChange"
      >
      <span
        v-if="props.field.value"
        class="checkbox-single-caption"
      >{{ props.field.value }}</span>
    </label>
  </div>
</template>

<style scoped>
.checkbox-single {
  margin: 2px 0;
}

.checkbox-single label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink, #111);
  cursor: pointer;
}

.checkbox-single input[type="checkbox"] {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--ink, #111);
}

.checkbox-single input[type="checkbox"].toggle {
  appearance: none;
  -webkit-appearance: none;
  width: 34px;
  height: 20px;
  padding: 0;
  background: var(--line-2, #d3cec1);
  border: none;
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background 150ms ease;
}

.checkbox-single input[type="checkbox"].toggle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 150ms ease;
}

.checkbox-single input[type="checkbox"].toggle:checked {
  background: var(--ink, #111);
}

.checkbox-single input[type="checkbox"].toggle:checked::before {
  transform: translateX(14px);
}

.checkbox-single input[type="checkbox"].toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

.checkbox-single input[type="checkbox"].toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
