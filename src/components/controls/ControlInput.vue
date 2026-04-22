<script setup lang="ts">
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

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', [target.value])
}
</script>

<template>
  <input
    :type="props.field.subtype ?? props.field.type"
    :class="props.field.className"
    :name="props.field.name"
    :value="props.modelValue[0] ?? props.field.value ?? ''"
    :placeholder="props.field.placeholder"
    :min="props.field.min"
    :max="props.field.max"
    :step="props.field.step"
    :maxlength="props.field.maxlength"
    :required="props.field.required"
    :disabled="props.disabled"
    data-qa="control-input"
    @input="onInput"
  >
</template>

<style scoped>
input {
  width: 100%;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 4px;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

input:focus {
  outline: none;
  border-color: var(--ink, #111);
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

input:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}
</style>
