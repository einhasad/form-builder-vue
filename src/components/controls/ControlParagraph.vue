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

const TEXTLESS_TAGS = new Set(['canvas'])

function getTag(): string {
  const tag = props.field.subtype ?? 'p'
  return TEXTLESS_TAGS.has(tag) ? 'p' : tag
}

void props.modelValue
void props.preview
void props.disabled
</script>

<template>
  <component
    :is="getTag()"
    :class="props.field.className"
    :data-subtype="props.field.subtype"
    data-qa="control-paragraph"
  >
    {{ props.field.label }}
  </component>
</template>
