<script setup lang="ts">
import type { FormDataField, FormValueOption } from '../../types/form-data'

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

function getOptions(): FormValueOption[] {
  return props.field.values ?? []
}

function onChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  if (props.field.multiple) {
    const selected = Array.from(select.selectedOptions).map((o) => o.value)
    emit('update:modelValue', selected)
  } else {
    emit('update:modelValue', [select.value])
  }
}
</script>

<template>
  <select
    :class="props.field.className"
    :name="props.field.name"
    :multiple="props.field.multiple"
    :required="props.field.required"
    :disabled="props.disabled"
    data-qa="control-select"
    @change="onChange"
  >
    <option
      v-if="props.field.placeholder"
      value=""
      :selected="props.modelValue.length === 0"
    >
      {{ props.field.placeholder }}
    </option>
    <option
      v-for="option in getOptions()"
      :key="option.value"
      :value="option.value"
      :selected="props.modelValue.includes(option.value)"
      data-qa="select-option"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
select {
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

select:focus {
  outline: none;
  border-color: var(--ink, #111);
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

select:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}
</style>
