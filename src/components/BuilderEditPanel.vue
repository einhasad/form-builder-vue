<script setup lang="ts">
import { inject, computed } from 'vue'
import type { FormDataField, FormValueOption } from '../types/form-data'
import { FIELD_REGISTRY_KEY, I18N_KEY } from '../types/injection-keys'
import { SUBTYPE_MAP } from '../types/field-types'

/** The field to edit. */
const props = defineProps<{
  /** The field to edit. */
  field: FormDataField
  /** Attributes that should not be editable. */
  disabledAttrs: string[]
}>()

const emit = defineEmits<(e: 'update:field', payload: { fieldId: string; updates: Partial<FormDataField> }) => void>()

const registry = inject(FIELD_REGISTRY_KEY)
const i18n = inject(I18N_KEY)

const attrs = computed<string[]>(() => {
  if (!registry) {
    return ['label']
  }
  return registry.getDefaultAttrs(props.field.type)
})

const filteredAttrs = computed<string[]>(() => {
  return attrs.value.filter((attr) => !props.disabledAttrs.includes(attr))
})

function getLabel(key: string): string {
  if (i18n) {
    return i18n.t(key)
  }
  return key
}

function updateAttr(attr: string, value: unknown): void {
  emit('update:field', { fieldId: props.field.name ?? '', updates: { [attr]: value } })
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
  const updated = getOptions().map((opt, i) =>
    i === index ? { label: opt.label, value: opt.value, selected } : opt,
  )
  updateAttr('values', updated)
}

function addOption(): void {
  const options = [...(props.field.values ?? [])]
  const count = String(options.length + 1)
  options.push({ label: `Option ${count}`, value: `option-${count}`, selected: false })
  updateAttr('values', options)
}

function removeOption(index: number): void {
  const options = [...getOptions()]
  options.splice(index, 1)
  updateAttr('values', options)
}

function getSubtypes(): string[] {
  return SUBTYPE_MAP[props.field.type]
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
          :for="`attr-${attr}`"
          class="attr-label"
          data-qa="attr-label"
        >
          {{ getLabel(attr) }}
        </label>

        <!-- Boolean attributes -->
        <template v-if="attr === 'required' || attr === 'multiple' || attr === 'toggle' || attr === 'inline' || attr === 'other' || attr === 'access' || attr === 'requireValidOption'">
          <input
            :id="`attr-${attr}`"
            type="checkbox"
            :checked="Boolean(props.field[attr as keyof FormDataField])"
            data-qa="attr-checkbox"
            @change="updateAttr(attr, ($event.target as HTMLInputElement).checked)"
          >
        </template>

        <!-- Subtype select -->
        <template v-else-if="attr === 'subtype'">
          <select
            :id="`attr-${attr}`"
            :value="props.field.subtype ?? ''"
            data-qa="attr-select"
            @change="updateAttr('subtype', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              Default
            </option>
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
              v-for="style in ['default', 'danger', 'info', 'primary', 'success', 'warning']"
              :key="style"
              type="button"
              class="style-btn"
              :class="[`btn-${style as string}`, { active: props.field.style === style || (!props.field.style && style === 'default') }]"
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
                class="remove-option-btn"
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
              + Add Option
            </button>
          </div>
        </template>

        <!-- Text attributes -->
        <template v-else>
          <input
            :id="`attr-${attr}`"
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
  color: #555;
}

.edit-attr input[type="text"],
.edit-attr select {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.edit-attr input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.style-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.style-btn {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.style-btn.active {
  outline: 2px solid #1890ff;
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
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}

.remove-option-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
}

.add-option-btn {
  padding: 4px 8px;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}
</style>
