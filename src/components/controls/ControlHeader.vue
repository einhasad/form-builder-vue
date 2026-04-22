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

function getTag(): string {
  return props.field.subtype ?? 'h1'
}

void props.modelValue
void props.preview
void props.disabled
</script>

<template>
  <component
    :is="getTag()"
    :class="props.field.className"
    data-qa="control-header"
  >
    {{ props.field.label }}
  </component>
</template>
