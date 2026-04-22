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

void props.preview
void props.disabled
</script>

<template>
  <input
    type="hidden"
    :name="props.field.name"
    :value="props.modelValue[0] ?? props.field.value ?? ''"
    data-qa="control-hidden"
  >
</template>
