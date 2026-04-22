<script setup lang="ts">
import { provide, reactive, watch, onMounted } from 'vue'
import type { FormDataField } from '../types/form-data'
import { FieldType } from '../types/field-types'
import type { BuilderOptions } from '../types/builder-options'
import type { BuilderState } from '../types/builder-state'
import type { CustomFieldPreset } from '../types/common'
import { BUILDER_OPTIONS_KEY, FIELD_REGISTRY_KEY, I18N_KEY, BUILDER_STATE_KEY } from '../types/injection-keys'
import { useFormBuilder } from '../composables/useFormBuilder'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { useI18n } from '../composables/useI18n'
import { useDragDrop } from '../composables/useDragDrop'
import { registerBuiltinControls } from './controls/register'
import BuilderStage from './BuilderStage.vue'
import BuilderControlPanel from './BuilderControlPanel.vue'

/** Field array for v-model support. */
const props = withDefaults(defineProps<{
  /** Field array for v-model support. */
  modelValue?: FormDataField[]
  /** Configuration overrides. */
  options?: Partial<BuilderOptions>
}>(), {
  modelValue: () => [],
  options: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: FormDataField[]): void
  (e: 'field-added' | 'field-removed' | 'field-updated', payload: { fieldId: string; field: FormDataField }): void
  (e: 'field-moved', payload: { fieldId: string; fromIndex: number; toIndex: number }): void
  (e: 'field-selected', payload: { fieldId: string | null }): void
  (e: 'save', payload: { formData: FormDataField[] }): void
  (e: 'clear' | 'loaded'): void
}>()

// Composables
const builder = useFormBuilder()
const registry = useFieldRegistry()
const i18n = useI18n()
const dragDrop = useDragDrop()

// Register all built-in controls
registerBuiltinControls(registry.register)

// Builder state for provide/inject
const builderState: BuilderState = {
  fields: builder.fields,
  selectedFieldId: builder.selectedFieldId,
  fieldIdCounter: builder.fieldIdCounter,
}

function buildOptions(raw: Partial<BuilderOptions>): BuilderOptions {
  return {
    controlOrder: raw.controlOrder ?? Object.values(FieldType),
    controlPosition: raw.controlPosition ?? 'right',
    defaultFields: raw.defaultFields ?? [],
    disabledAttrs: raw.disabledAttrs ?? [],
    disabledFieldButtons: raw.disabledFieldButtons ?? {},
    disabledSubtypes: raw.disabledSubtypes ?? {},
    disableFields: raw.disableFields ?? [],
    disableHTMLLabels: raw.disableHTMLLabels ?? false,
    editOnAdd: raw.editOnAdd ?? false,
    fields: raw.fields ?? [],
    fieldRemoveWarn: raw.fieldRemoveWarn ?? false,
    inputSets: raw.inputSets ?? [],
    roles: raw.roles ?? {},
    scrollToFieldOnAdd: raw.scrollToFieldOnAdd ?? false,
    sortableControls: raw.sortableControls ?? false,
    showActionButtons: raw.showActionButtons ?? true,
    actionButtons: raw.actionButtons ?? [],
    disabledActionButtons: raw.disabledActionButtons ?? [],
    notify: raw.notify,
    typeUserAttrs: raw.typeUserAttrs ?? {},
    typeUserDisabledAttrs: raw.typeUserDisabledAttrs ?? {},
    typeUserEvents: raw.typeUserEvents ?? {},
  }
}

// Reactive resolved options — templates and injected consumers stay in sync
// as props.options changes at runtime.
const resolvedOptions = reactive<BuilderOptions>(buildOptions(props.options))

watch(
  () => props.options,
  (newOpts) => {
    Object.assign(resolvedOptions, buildOptions(newOpts))
  },
  { deep: true },
)

// Provide to children
provide(BUILDER_OPTIONS_KEY, resolvedOptions)
provide(FIELD_REGISTRY_KEY, {
  getDefinition: registry.getDefinition,
  getAllTypes: registry.getAllTypes,
  getSubtypes: registry.getSubtypes,
  isActive: registry.isActive,
  getDefaultAttrs: registry.getDefaultAttrs,
  resolveComponent: registry.resolveComponent,
})
provide(I18N_KEY, { t: i18n.t })
provide(BUILDER_STATE_KEY, builderState)

// Sync external modelValue -> internal state
watch(
  () => props.modelValue,
  (newValue) => {
    if (JSON.stringify(newValue) !== JSON.stringify(builder.getData())) {
      builder.setData(newValue)
    }
  },
  { deep: true },
)

// Sync internal state -> external modelValue
watch(
  () => builder.fields.value,
  (newValue) => {
    emit('update:modelValue', [...newValue])
  },
  { deep: true },
)

// Initialize fields from modelValue
builder.setData(props.modelValue)

function addNewField(type: string, index?: number, rowId?: string, preset?: CustomFieldPreset): void {
  const fieldType = type as FieldType
  const newField: FormDataField = {
    type: fieldType,
    label: i18n.t(type),
    name: `${type}-${String(Date.now())}-0`,
    access: false,
  }
  if (rowId !== undefined) {
    newField.rowId = rowId
  }

  // Apply default values for option-based fields
  if (fieldType === FieldType.Select || fieldType === FieldType.Autocomplete) {
    newField.values = [
      { label: 'Option 1', value: 'option-1', selected: false },
      { label: 'Option 2', value: 'option-2', selected: false },
      { label: 'Option 3', value: 'option-3', selected: false },
    ]
  }
  if (fieldType === FieldType.CheckboxGroup || fieldType === FieldType.RadioGroup) {
    newField.values = [
      { label: 'Option 1', value: 'option-1', selected: false },
      { label: 'Option 2', value: 'option-2', selected: false },
    ]
  }
  if (fieldType === FieldType.Button) {
    newField.style = 'default'
    newField.subtype = 'button'
  }
  if (fieldType === FieldType.Header) {
    newField.subtype = 'h1'
  }
  if (fieldType === FieldType.Paragraph) {
    newField.subtype = 'p'
  }
  if (fieldType === FieldType.Text || fieldType === FieldType.Number || fieldType === FieldType.Date) {
    newField.subtype = fieldType
  }

  if (preset) {
    for (const key of Object.keys(preset)) {
      if (key === 'type') {
        continue
      }
      newField[key] = preset[key]
    }
    if (preset.values) {
      newField.values = preset.values.map((v) => ({
        label: v.label,
        value: v.value,
        selected: v.selected,
      }))
    }
  }

  const fieldId = builder.addField(newField, index)
  emit('field-added', { fieldId, field: newField })
}

function handleControlClick(payload: { type: string; preset?: CustomFieldPreset }): void {
  addNewField(payload.type, undefined, undefined, payload.preset)
}

function handleControlDragStart(payload: { type: string }): void {
  dragDrop.onControlDragStart(payload.type as FieldType, {} as DragEvent)
}

function handleFieldRemoved(payload: { fieldId: string; field: FormDataField }): void {
  const internalId = builder.findFieldIdByName(payload.fieldId)
  if (internalId) {
    builder.removeField(internalId)
  }
  emit('field-removed', payload)
}

function handleFieldCopied(payload: { fieldId: string }): void {
  const internalId = builder.findFieldIdByName(payload.fieldId)
  if (internalId) {
    builder.duplicateField(internalId)
  }
}

function handleFieldUpdated(payload: { fieldId: string; updates: Partial<FormDataField> }): void {
  const internalId = builder.findFieldIdByName(payload.fieldId)
  if (internalId) {
    builder.updateField(internalId, payload.updates)
    const updatedField = builder.getField(internalId)
    if (updatedField) {
      emit('field-updated', { fieldId: payload.fieldId, field: updatedField })
    }
  }
}

function handleFieldSelected(payload: { fieldId: string | null }): void {
  emit('field-selected', payload)
}

function handleFieldReorder(payload: { fromIndex: number; toIndex: number; rowId?: string }): void {
  builder.moveField(payload.fromIndex, payload.toIndex)
  const field = builder.fields.value[payload.toIndex]
  const fieldId = builder.getFieldIdByIndex(payload.toIndex)
  if (fieldId && field) {
    if (payload.rowId !== undefined) {
      builder.updateField(fieldId, { rowId: payload.rowId })
    }
    emit('field-moved', {
      fieldId,
      fromIndex: payload.fromIndex,
      toIndex: payload.toIndex,
    })
  }
}

function handleControlDropped(payload: { type: string; index: number; rowId?: string; preset?: CustomFieldPreset }): void {
  addNewField(payload.type, payload.index, payload.rowId, payload.preset)
}

function handleSave(): void {
  emit('save', { formData: builder.getData() })
}

function handleClear(): void {
  builder.clearFields()
  emit('clear')
}

onMounted(() => {
  emit('loaded')
})

defineSlots<{
  'control-panel'(props: { controls: unknown[] }): void
  stage(props: { fields: FormDataField[] }): void
  actions(props: { save: () => void; clear: () => void; getData: () => FormDataField[] }): void
}>()

defineExpose({
  getFieldTypes: (activeOnly?: boolean) => {
    if (activeOnly) {
      return registry.getAllTypes().filter((type) => !resolvedOptions.disableFields.includes(type as FieldType))
    }
    return registry.getAllTypes()
  },
  addField: builder.addField,
  removeField: builder.removeField,
  getData: builder.getData,
  setData: builder.setData,
  clearFields: builder.clearFields,
  save: () => builder.getData(),
  toggleFieldEdit: builder.selectField,
  closeAllFieldEdit: () => {
    builder.selectField(null)
  },
  getCurrentFieldId: () => builder.selectedFieldId.value,
  setLocale: i18n.setLocale,
})
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -->
  <div
    class="form-builder"
    data-qa="form-builder"
  >
    <div
      class="builder-layout"
      :class="{ 'control-right': resolvedOptions.controlPosition === 'right' }"
    >
      <slot
        name="stage"
        :fields="builder.fields.value"
      >
        <BuilderStage
          :fields="builder.fields.value"
          :selected-field-id="builder.selectedFieldId.value"
          :disabled-attrs="resolvedOptions.disabledAttrs"
          @field-removed="handleFieldRemoved"
          @field-copied="handleFieldCopied"
          @field-updated="handleFieldUpdated"
          @field-selected="handleFieldSelected"
          @field-reorder="handleFieldReorder"
          @control-dropped="handleControlDropped"
        />
      </slot>

      <slot
        name="control-panel"
        :controls="[]"
      >
        <BuilderControlPanel
          :disabled-types="resolvedOptions.disableFields"
          @control-click="handleControlClick"
          @control-drag-start="handleControlDragStart"
        />
      </slot>
    </div>

    <div
      v-if="resolvedOptions.showActionButtons"
      class="builder-actions"
      data-qa="builder-actions"
    >
      <slot
        name="actions"
        :save="handleSave"
        :clear="handleClear"
        :get-data="builder.getData"
      >
        <button
          type="button"
          class="action-btn action-save"
          data-qa="action-save"
          @click="handleSave"
        >
          Save
        </button>
        <button
          type="button"
          class="action-btn action-clear"
          data-qa="action-clear"
          @click="handleClear"
        >
          Clear
        </button>
      </slot>
    </div>
  </div>
  <!-- eslint-enable vue/no-bare-strings-in-template -->
</template>

<style scoped>
.form-builder {
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  color: var(--ink, #111);
}

.builder-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.builder-layout.control-right { flex-direction: row-reverse; }

.builder-layout > :deep(.builder-stage) {
  flex: 1;
  min-width: 0;
}

.builder-layout > :deep(.builder-control-panel) {
  flex-shrink: 0;
  width: 200px;
}

.builder-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line, #e8e4db);
}

.action-btn {
  padding: 7px 14px;
  font-family: inherit;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}

.action-save {
  background: var(--accent, #ffc833);
  color: var(--accent-ink, #1a1505);
  border: 1px solid var(--accent, #ffc833);
  font-weight: 500;
}

.action-save:hover {
  background: var(--accent-hover, #f0b920);
  border-color: var(--accent-hover, #f0b920);
}

.action-clear {
  background: var(--surface, #fff);
  color: var(--ink, #111);
  border: 1px solid var(--line-2, #d3cec1);
}

.action-clear:hover { border-color: var(--ink, #111); }
</style>
