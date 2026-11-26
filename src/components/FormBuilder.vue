<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue'
import type { FormDataField, FormValueOption } from '../types/form-data'
import { FieldType } from '../types/field-types'
import type { BuilderOptions } from '../types/builder-options'
import type { BuilderState } from '../types/builder-state'
import type { CustomFieldPreset } from '../types/common'
import { provideBuilderOptions } from '../state/builderOptions'
import { provideBuilderState } from '../state/builderState'
import { provideBuilderRegistry } from '../state/builderRegistry'
import { provideBuilderI18n } from '../state/builderI18n'
import { useFormBuilder } from '../composables/useFormBuilder'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { useI18n } from '../composables/useI18n'
import { useDragDrop } from '../composables/useDragDrop'
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

// Builder state for provide/inject. Exposing `internalFields` lets descendants
// (notably `BuilderStage`) identify fields by their stable `internalId` even
// when `name` is missing — preloaded schemas often lack names and would
// otherwise be unable to dispatch remove/copy/edit/select events.
const builderState: BuilderState = {
  fields: builder.fields,
  selectedFieldId: builder.selectedFieldId,
  fieldIdCounter: builder.fieldIdCounter,
  internalFields: builder.internalFields,
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
    buttonStyles: raw.buttonStyles ?? ['default', 'danger', 'info', 'primary', 'success', 'warning'],
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
provideBuilderOptions(resolvedOptions)
provideBuilderRegistry({
  getDefinition: registry.getDefinition,
  getAllTypes: registry.getAllTypes,
  getSubtypes: registry.getSubtypes,
  isActive: registry.isActive,
  getDefaultAttrs: registry.getDefaultAttrs,
  resolveComponent: registry.resolveComponent,
})
provideBuilderI18n({ t: i18n.t })
provideBuilderState(builderState)

builder.setData(props.modelValue)

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

function defaultOptions(count: number): FormValueOption[] {
  const options: FormValueOption[] = []
  for (let n = 1; n <= count; n += 1) {
    options.push({ label: `Option ${String(n)}`, value: `option-${String(n)}`, selected: false })
  }
  return options
}

function createContractField(type: FieldType, label: string): FormDataField {
  const name = builder.generateName(type)
  switch (type) {
    case FieldType.Header:
      return { type, subtype: 'h1', label, access: false }
    case FieldType.Paragraph:
      return { type, subtype: 'p', label, access: false }
    case FieldType.Hidden:
      return { type, label, name, access: false }
    case FieldType.Button:
      return { type, label, subtype: 'button', className: 'btn-default btn', name, access: false, style: 'default' }
    case FieldType.Checkbox:
      return { type, required: false, label, name, access: false, toggle: false }
    case FieldType.CheckboxGroup:
      return { type, required: false, label, toggle: false, inline: false, name, access: false, other: false, values: defaultOptions(2) }
    case FieldType.RadioGroup:
      return { type, required: false, label, inline: false, name, access: false, other: false, values: defaultOptions(2) }
    case FieldType.Autocomplete:
      return { type, required: false, label, className: 'form-control', name, access: false, requireValidOption: false, values: defaultOptions(3) }
    case FieldType.Select:
      return { type, required: false, label, className: 'form-control', name, access: false, multiple: false, values: defaultOptions(3) }
    case FieldType.File:
      return { type, required: false, label, className: 'form-control', name, access: false, multiple: false }
    case FieldType.Date:
    case FieldType.Number:
    case FieldType.Text:
    case FieldType.Textarea:
      return { type, required: false, label, className: 'form-control', name, access: false, subtype: type }
    default:
      return { type, label, name, access: false }
  }
}

function defaultLabel(type: string): string {
  const message = i18n.t(type)
  if (message !== type) {
    return message
  }
  return registry.getDefinition(type)?.label ?? type
}

function addNewField(type: string, index?: number, rowId?: string, preset?: CustomFieldPreset): void {
  const newField = createContractField(type as FieldType, defaultLabel(type))
  if (rowId !== undefined) {
    newField.rowId = rowId
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
  if (resolvedOptions.editOnAdd) {
    builder.selectField(fieldId)
    emit('field-selected', { fieldId })
  }
}

function handleControlClick(payload: { type: string; preset?: CustomFieldPreset }): void {
  addNewField(payload.type, undefined, undefined, payload.preset)
}

function handleControlDragStart(payload: { type: string }): void {
  dragDrop.onControlDragStart(payload.type as FieldType, {} as DragEvent)
}

// `payload.fieldId` is the stable `internalId` surfaced by `BuilderStage`. For
// backwards compat (e.g. external code still feeding in a `field.name`), fall
// back to the name lookup when no internal match is found.
function resolveInternalId(fieldId: string): string | undefined {
  if (builder.getField(fieldId)) {
    return fieldId
  }
  return builder.findFieldIdByName(fieldId)
}

function handleFieldRemoved(payload: { fieldId: string; field: FormDataField }): void {
  if (resolvedOptions.fieldRemoveWarn && !window.confirm(i18n.t('confirmRemove'))) {
    return
  }
  const internalId = resolveInternalId(payload.fieldId)
  if (internalId) {
    builder.removeField(internalId)
  }
  emit('field-removed', payload)
}

function handleFieldCopied(payload: { fieldId: string }): void {
  const copyId = builder.duplicateField(resolveInternalId(payload.fieldId) ?? payload.fieldId)
  const copy = copyId === null ? undefined : builder.getField(copyId)
  if (copyId !== null && copy) {
    emit('field-added', { fieldId: copyId, field: copy })
  }
}

function handleFieldUpdated(payload: { fieldId: string; updates: Partial<FormDataField> }): void {
  const internalId = resolveInternalId(payload.fieldId)
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
  builder.moveFieldToRow(payload.fromIndex, payload.toIndex, payload.rowId)
  const fieldId = builder.getFieldIdByIndex(payload.toIndex)
  if (fieldId) {
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

function save(): FormDataField[] {
  const formData = builder.getData()
  emit('save', { formData })
  return formData
}

function handleSave(): void {
  save()
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
  getFieldIds: () => builder.internalFields.value.map((entry) => entry.internalId),
  setData: builder.setData,
  clearFields: builder.clearFields,
  save,
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
      :class="resolvedOptions.controlPosition === 'left' ? 'control-left' : 'control-right'"
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
  flex-wrap: wrap-reverse;
  gap: 16px;
  align-items: flex-end;
}

.builder-layout.control-left { flex-direction: row-reverse; }

.builder-layout > :deep(.builder-stage) {
  flex: 999 1 0;
  min-width: min(360px, 100%);
}

.builder-layout > :deep(.builder-control-panel) {
  flex: 1 1 200px;
  min-width: 0;
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
