<script setup lang="ts">
import type { FormDataField, FormValueOption } from '../../types/form-data'
import { useOtherOption } from '../../composables/useOtherOption'

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

const { otherSelected, otherValue, withOther } = useOtherOption(props, true)

function getOptions(): FormValueOption[] {
  return props.field.values ?? []
}

function isChecked(optionValue: string): boolean {
  return !otherSelected.value && props.modelValue.includes(optionValue)
}

function onRadioChange(optionValue: string): void {
  otherSelected.value = false
  otherValue.value = ''
  emit('update:modelValue', [optionValue])
}

function onOtherRadioChange(): void {
  otherSelected.value = true
  emit('update:modelValue', withOther([]))
}

function onOtherInput(event: Event): void {
  otherValue.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', withOther([]))
}
</script>

<!-- eslint-disable vue/no-bare-strings-in-template -->
<template>
  <div
    :class="[props.field.className, { 'inline-group': props.field.inline }]"
    data-qa="control-radio-group"
  >
    <div
      v-for="option in getOptions()"
      :key="option.value"
      class="radio-option"
      :class="{ 'inline-option': props.field.inline }"
      data-qa="radio-option"
    >
      <label>
        <input
          type="radio"
          :name="props.field.name"
          :value="option.value"
          :checked="isChecked(option.value)"
          :required="props.field.required"
          :disabled="props.disabled"
          data-qa="radio-input"
          @change="onRadioChange(option.value)"
        >
        {{ option.label }}
      </label>
    </div>
    <div
      v-if="props.field.other"
      class="other-option radio-option"
      data-qa="radio-other"
    >
      <label>
        <input
          type="radio"
          :name="props.field.name"
          :checked="otherSelected"
          :disabled="props.disabled"
          data-qa="radio-other-input"
          @change="onOtherRadioChange"
        >
        <!-- eslint-disable-next-line vue/no-bare-strings-in-template -->
        Other
      </label>
      <input
        v-if="otherSelected"
        type="text"
        :value="otherValue"
        :disabled="props.disabled"
        aria-label="Other"
        data-qa="radio-other-text"
        @input="onOtherInput"
      >
    </div>
  </div>
</template>

<style scoped>
.inline-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.inline-option {
  display: inline-block;
}

.radio-option {
  margin: 2px 0;
}

.radio-option label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink, #111);
  cursor: pointer;
}

.radio-option input[type="radio"] {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--fb-control-accent, var(--accent, #ffc833));
}

.other-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.other-option input[type="text"] {
  margin-top: 4px;
  padding: 5px 8px;
  font: inherit;
  font-size: 13px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 4px;
}
</style>
