<script setup lang="ts">
import { computed, useId } from 'vue'
import type { FormDataField, FormValueOption } from '../types/form-data'
import { useBuilderOptions } from '../state/builderOptions'
import { useBuilderRegistry } from '../state/builderRegistry'
import { useBuilderI18n } from '../state/builderI18n'
import { FieldType, SUBTYPE_MAP } from '../types/field-types'

const DEFAULT_BUTTON_STYLES = ['default', 'danger', 'info', 'primary', 'success', 'warning']
const BOOLEAN_ATTRS = new Set(['required', 'multiple', 'toggle', 'inline', 'other', 'access', 'requireValidOption'])
const GROUP_ATTRS = new Set(['style', 'values'])

/** The field to edit. */
const props = defineProps<{
  /** The field to edit. */
  field: FormDataField
  /** Stable builder identity of the field (its `internalId`), used as the `fieldId` of emitted updates. */
  fieldId: string
  /** Attributes that should not be editable. */
  disabledAttrs: string[]
}>()

const emit = defineEmits<(e: 'update:field', payload: { fieldId: string; updates: Partial<FormDataField> }) => void>()

const registry = useBuilderRegistry()
const i18n = useBuilderI18n()
const builderOptions = useBuilderOptions()
const idPrefix = useId()

const buttonStyles = computed<string[]>(() =>
  builderOptions?.buttonStyles ?? DEFAULT_BUTTON_STYLES,
)

const attrs = computed<string[]>(() => {
  if (!registry) {
    return ['label']
  }
  return registry.getDefaultAttrs(props.field.type)
})

const filteredAttrs = computed<string[]>(() => {
  return attrs.value.filter((attr) => !props.disabledAttrs.includes(attr))
})

const isSingleChoice = computed<boolean>(() => {
  const { type } = props.field
  return type === FieldType.RadioGroup
    || type === FieldType.Autocomplete
    || (type === FieldType.Select && props.field.multiple !== true)
})

function getLabel(key: string): string {
  if (i18n) {
    return i18n.t(key)
  }
  return key
}

function inputId(attr: string): string {
  return `${idPrefix}-attr-${attr}`
}

function labelFor(attr: string): string | undefined {
  return GROUP_ATTRS.has(attr) ? undefined : inputId(attr)
}

function updateAttr(attr: string, value: unknown): void {
  emit('update:field', { fieldId: props.fieldId, updates: { [attr]: value } })
}

function updateOptionLabel(index: number, label: string): void {
  const updated = getOptions().map((opt, i) =>
    i === index ? { label, value: opt.value, selected: opt.selected } : opt,
  )
  updateAttr('values', updated)
}

function updateOptionValue(index: number, value: string): void {
  const updated = getOptions().map((opt, i) =>
    i === index ? { label: opt.label, value, selected: opt.selected } : opt,
  )
  updateAttr('values', updated)
}

function updateOptionSelected(index: number, selected: boolean): void {
  const exclusive = selected && isSingleChoice.value
  const updated = getOptions().map((opt, i) => {
    if (i === index) {
      return { label: opt.label, value: opt.value, selected }
    }
    return exclusive ? { label: opt.label, value: opt.value, selected: false } : opt
  })
  updateAttr('values', updated)
}

function nextOptionNumber(options: FormValueOption[]): number {
  const taken = new Set(options.map((opt) => opt.value))
  let next = options.length + 1
  while (taken.has(`option-${String(next)}`)) {
    next += 1
  }
  return next
}

function addOption(): void {
  const options = [...getOptions()]
  const count = String(nextOptionNumber(options))
  options.push({ label: `Option ${count}`, value: `option-${count}`, selected: false })
  updateAttr('values', options)
}

function removeOption(index: number): void {
  const options = [...getOptions()]
  options.splice(index, 1)
  updateAttr('values', options)
}

function moveOption(index: number, offset: number): void {
  const options = [...getOptions()]
  options.splice(index + offset, 0, ...options.splice(index, 1))
  updateAttr('values', options)
}

function getSubtypes(): string[] {
  return SUBTYPE_MAP[props.field.type]
}

function getSubtypeValue(): string {
  return props.field.subtype ?? getSubtypes()[0] ?? ''
}

function getOptions(): FormValueOption[] {
  return props.field.values ?? []
}
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -->
  <div
    class="edit-panel"
    data-qa="edit-panel"
  >
    <div class="edit-panel-body">
      <div
        v-for="attr in filteredAttrs"
        :key="attr"
        class="edit-attr"
        data-qa="edit-attr"
      >
        <label
          :for="labelFor(attr)"
          class="attr-label"
          data-qa="attr-label"
        >
          {{ getLabel(attr) }}
        </label>

        <!-- Boolean attributes -->
        <template v-if="BOOLEAN_ATTRS.has(attr)">
          <input
            :id="inputId(attr)"
            type="checkbox"
            :checked="Boolean(props.field[attr as keyof FormDataField])"
            data-qa="attr-checkbox"
            @change="updateAttr(attr, ($event.target as HTMLInputElement).checked)"
          >
        </template>

        <!-- Subtype select -->
        <template v-else-if="attr === 'subtype'">
          <select
            :id="inputId(attr)"
            :value="getSubtypeValue()"
            data-qa="attr-select"
            @change="updateAttr('subtype', ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="subtype in getSubtypes()"
              :key="subtype"
              :value="subtype"
            >
              {{ subtype }}
            </option>
          </select>
        </template>

        <!-- Style (button styles) -->
        <template v-else-if="attr === 'style'">
          <div
            class="style-buttons"
            data-qa="attr-style-buttons"
          >
            <button
              v-for="style in buttonStyles"
              :key="style"
              type="button"
              class="style-btn"
              :class="[`btn-${style}`, { active: props.field.style === style || (!props.field.style && style === buttonStyles[0]) }]"
              :data-qa="`style-btn-${style}`"
              @click="updateAttr('style', style)"
            >
              {{ getLabel(style) }}
            </button>
          </div>
        </template>

        <!-- Options/values editor -->
        <template v-else-if="attr === 'values'">
          <div
            class="options-editor"
            data-qa="options-editor"
          >
            <div
              v-for="(option, idx) in getOptions()"
              :key="idx"
              class="option-row"
              data-qa="option-row"
            >
              <input
                type="checkbox"
                :checked="option.selected"
                :aria-label="getLabel('selected')"
                data-qa="option-selected"
                @change="updateOptionSelected(idx, ($event.target as HTMLInputElement).checked)"
              >
              <input
                type="text"
                :value="option.label"
                class="option-label-input"
                data-qa="option-label"
                @input="updateOptionLabel(idx, ($event.target as HTMLInputElement).value)"
              >
              <input
                type="text"
                :value="option.value"
                class="option-value-input"
                data-qa="option-value"
                @input="updateOptionValue(idx, ($event.target as HTMLInputElement).value)"
              >
              <button
                type="button"
                class="option-icon-btn"
                :aria-label="getLabel('moveUp')"
                :title="getLabel('moveUp')"
                :disabled="idx === 0"
                data-qa="move-option-up"
                @click="moveOption(idx, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                class="option-icon-btn"
                :aria-label="getLabel('moveDown')"
                :title="getLabel('moveDown')"
                :disabled="idx === getOptions().length - 1"
                data-qa="move-option-down"
                @click="moveOption(idx, 1)"
              >
                ↓
              </button>
              <button
                type="button"
                class="option-icon-btn"
                :aria-label="getLabel('removeOption')"
                :title="getLabel('removeOption')"
                data-qa="remove-option"
                @click="removeOption(idx)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="add-option-btn"
              data-qa="add-option"
              @click="addOption"
            >
              + {{ getLabel('addOption') }}
            </button>
          </div>
        </template>

        <!-- Text attributes -->
        <template v-else>
          <input
            :id="inputId(attr)"
            type="text"
            :value="String(props.field[attr as keyof FormDataField] ?? '')"
            data-qa="attr-text"
            @input="updateAttr(attr, ($event.target as HTMLInputElement).value)"
          >
        </template>
      </div>
    </div>
  </div>
  <!-- eslint-enable vue/no-bare-strings-in-template -->
</template>

<style scoped>
.edit-panel {
  margin-top: 8px;
}

.edit-panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-attr {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attr-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2, #555);
}

.edit-attr input[type="text"],
.edit-attr select {
  padding: 6px 8px;
  border: 1px solid var(--line, #ccc);
  border-radius: 4px;
  font-size: 14px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
}

.edit-attr input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--fb-control-accent, var(--accent, #ffc833));
}

.options-editor input[type="checkbox"] {
  accent-color: var(--fb-control-accent, var(--accent, #ffc833));
}

.style-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.style-btn {
  padding: 4px 8px;
  border: 1px solid var(--line, #ccc);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
}

.style-btn.active {
  outline: 2px solid var(--accent, #1890ff);
  outline-offset: 1px;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-label-input,
.option-value-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid var(--line, #ccc);
  border-radius: 4px;
  font-size: 13px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
}

.option-icon-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ink-3, #6e6a63);
  font-size: 14px;
}

.option-icon-btn:disabled {
  cursor: default;
  opacity: 0.35;
}

.add-option-btn {
  padding: 4px 8px;
  border: 1px dashed var(--line, #ccc);
  border-radius: 4px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  cursor: pointer;
  font-size: 13px;
}
</style>
