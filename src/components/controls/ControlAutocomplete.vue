<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

defineOptions({ inheritAttrs: false })

const emit = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

void props.preview

const searchText = ref<string | null>(null)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)

function getOptions(): FormValueOption[] {
  return props.field.values ?? []
}

function answerFor(text: string): string[] {
  if (text === '') {
    return []
  }
  const match = getOptions().find((opt) => opt.label.toLowerCase() === text.toLowerCase())
  if (match) {
    return [match.value]
  }
  return props.field.requireValidOption ? [] : [text]
}

function labelFor(value: string): string {
  return getOptions().find((opt) => opt.value === value)?.label ?? value
}

const displayText = computed(() => searchText.value ?? labelFor(props.modelValue[0] ?? ''))

const invalid = computed(() => {
  const text = searchText.value ?? ''
  return text !== '' && answerFor(text).length === 0
})

const filteredOptions = computed<FormValueOption[]>(() => {
  const query = (searchText.value ?? '').toLowerCase()
  if (!query) {
    return getOptions()
  }
  return getOptions().filter(
    (opt) => opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query),
  )
})

watch(
  () => props.modelValue,
  (answers) => {
    if (searchText.value !== null && answerFor(searchText.value)[0] !== answers[0]) {
      searchText.value = null
    }
  },
)

function onInput(event: Event): void {
  searchText.value = (event.target as HTMLInputElement).value
  showDropdown.value = true
  highlightedIndex.value = -1
  emit('update:modelValue', answerFor(searchText.value))
}

function selectOption(option: FormValueOption): void {
  searchText.value = null
  showDropdown.value = false
  emit('update:modelValue', [option.value])
}

function onFocus(): void {
  showDropdown.value = true
}

function onBlur(): void {
  searchText.value = null
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function onKeydown(event: KeyboardEvent): void {
  if (!showDropdown.value) {
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = Math.min(
      highlightedIndex.value + 1,
      filteredOptions.value.length - 1,
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
      const option = filteredOptions.value[highlightedIndex.value]
      if (option) {
        selectOption(option)
      }
    }
  } else if (event.key === 'Escape') {
    showDropdown.value = false
  }
}
</script>

<template>
  <div
    class="autocomplete-control"
    data-qa="control-autocomplete"
  >
    <input
      type="text"
      :class="props.field.className"
      :name="props.field.name"
      :value="displayText"
      :aria-invalid="invalid || undefined"
      :placeholder="props.field.placeholder"
      :required="props.field.required"
      :disabled="props.disabled"
      data-qa="autocomplete-input"
      v-bind="$attrs"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    >
    <ul
      v-if="showDropdown && filteredOptions.length > 0"
      class="autocomplete-dropdown"
      data-qa="autocomplete-dropdown"
    >
      <li
        v-for="(option, idx) in filteredOptions"
        :key="option.value"
        class="autocomplete-option"
        :class="{ highlighted: idx === highlightedIndex }"
        data-qa="autocomplete-option"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.autocomplete-control {
  position: relative;
}

input {
  box-sizing: border-box;
  width: 100%;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 4px;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

input:focus {
  outline: 2px solid var(--fb-focus-ring, var(--ink, #111));
  outline-offset: 1px;
  border-color: var(--ink, #111);
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

input:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface, #fff);
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 6px;
  max-height: 220px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 4px;
  z-index: 1000;
  box-shadow: 0 8px 20px rgba(17, 17, 17, 0.08), 0 2px 4px rgba(17, 17, 17, 0.04);
}

.autocomplete-option {
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: var(--ink, #111);
  transition: background 100ms ease, color 100ms ease;
}

.autocomplete-option:hover,
.autocomplete-option.highlighted {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink, #111);
}

.autocomplete-option.highlighted {
  background: var(--accent-soft, rgba(255, 200, 51, 0.2));
}
</style>
