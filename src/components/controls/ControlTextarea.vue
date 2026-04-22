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
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', [target.value])
}

function getRows(): number {
  const rows = props.field.rows
  return rows ? parseInt(rows, 10) : 3
}
</script>

<template>
  <textarea
    :class="props.field.className"
    :name="props.field.name"
    :value="props.modelValue[0] ?? props.field.value ?? ''"
    :placeholder="props.field.placeholder"
    :required="props.field.required"
    :disabled="props.disabled"
    :maxlength="props.field.maxlength"
    :rows="getRows()"
    data-qa="control-textarea"
    @input="onInput"
  />
</template>

<style scoped>
textarea {
  width: 100%;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 4px;
  resize: vertical;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

textarea:focus {
  outline: none;
  border-color: var(--ink, #111);
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

textarea:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}
</style>
