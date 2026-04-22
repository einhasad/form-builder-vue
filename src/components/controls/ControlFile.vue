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

void props.modelValue
void props.preview

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files) {
    const names = Array.from(files).map((f) => f.name)
    emit('update:modelValue', names)
  }
}
</script>

<template>
  <input
    type="file"
    :class="props.field.className"
    :name="props.field.name"
    :multiple="props.field.multiple"
    :required="props.field.required"
    :disabled="props.disabled"
    data-qa="control-file"
    @change="onChange"
  >
</template>

<style scoped>
input[type="file"] {
  display: block;
  width: 100%;
  padding: 6px;
  font: inherit;
  font-size: 13px;
  background: var(--surface, #fff);
  color: var(--ink-2, #3a3a3a);
  border: 1px dashed var(--line-2, #d3cec1);
  border-radius: 4px;
  cursor: pointer;
}

input[type="file"]::file-selector-button {
  margin-right: 10px;
  padding: 5px 10px;
  font: inherit;
  font-size: 12px;
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 3px;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}

input[type="file"]::file-selector-button:hover {
  border-color: var(--ink, #111);
  background: var(--surface, #fff);
}

input[type="file"]:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}
</style>
