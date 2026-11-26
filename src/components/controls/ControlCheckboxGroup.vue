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

const { otherSelected, otherValue, optionAnswers, withOther } = useOtherOption(props, false)

function getOptions(): FormValueOption[] {
  return props.field.values ?? []
}

function isChecked(optionValue: string): boolean {
  return props.modelValue.includes(optionValue)
}

function onCheck(optionValue: string): void {
  const current = optionAnswers()
  const idx = current.indexOf(optionValue)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(optionValue)
  }
  emit('update:modelValue', withOther(current))
}

function onOtherCheck(): void {
  otherSelected.value = !otherSelected.value
  if (!otherSelected.value) {
    otherValue.value = ''
  }
  emit('update:modelValue', withOther(optionAnswers()))
}

function onOtherInput(event: Event): void {
  otherValue.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', withOther(optionAnswers()))
}
</script>

<!-- eslint-disable vue/no-bare-strings-in-template -->
<template>
  <div
    :class="[props.field.className, { 'inline-group': props.field.inline }]"
    data-qa="control-checkbox-group"
  >
    <div
      v-for="option in getOptions()"
      :key="option.value"
      class="checkbox-option"
      :class="{ 'inline-option': props.field.inline }"
      data-qa="checkbox-option"
    >
      <label>
        <input
          type="checkbox"
          :name="props.field.name"
          :value="option.value"
          :checked="isChecked(option.value)"
          :required="props.field.required && !props.modelValue.length"
          :disabled="props.disabled"
          :class="{ toggle: props.field.toggle }"
          data-qa="checkbox-input"
          @change="onCheck(option.value)"
        >
        {{ option.label }}
      </label>
    </div>
    <div
      v-if="props.field.other"
      class="checkbox-option other-option"
      data-qa="checkbox-other"
    >
      <label>
        <input
          type="checkbox"
          :name="props.field.name"
          :checked="otherSelected"
          :disabled="props.disabled"
          data-qa="checkbox-other-input"
          @change="onOtherCheck"
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
        data-qa="checkbox-other-text"
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

.checkbox-option {
  margin: 2px 0;
}

.checkbox-option label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink, #111);
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--fb-control-accent, var(--accent, #ffc833));
}

.checkbox-option input[type="checkbox"].toggle {
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

.checkbox-option input[type="checkbox"].toggle::before {
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

.checkbox-option input[type="checkbox"].toggle:checked {
  background: var(--fb-control-accent, var(--accent, #ffc833));
}

.checkbox-option input[type="checkbox"].toggle:checked::before {
  transform: translateX(14px);
}

.checkbox-option input[type="checkbox"].toggle:focus-visible {
  outline: 2px solid var(--fb-focus-ring, var(--ink, #111));
  outline-offset: 1px;
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

.checkbox-option input[type="checkbox"].toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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
