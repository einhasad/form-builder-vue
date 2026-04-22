<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import type { FormDataField } from '../types/form-data'
import type { CustomFieldPreset } from '../types/common'
import { BUILDER_OPTIONS_KEY, BUILDER_STATE_KEY, FIELD_REGISTRY_KEY } from '../types/injection-keys'
import BuilderField from './BuilderField.vue'

/** Maximum number of fields that may share a single inline row. */
const MAX_ROW_SIZE = 3

/** Fields to display. */
const props = defineProps<{
  /** Fields to display on the stage. */
  fields: FormDataField[]
  /** ID of the currently selected field. */
  selectedFieldId: string | null
  /** Attributes that should not be editable. */
  disabledAttrs: string[]
}>()

const emit = defineEmits<{
  (e: 'field-removed', payload: { fieldId: string; field: FormDataField }): void
  (e: 'field-selected', payload: { fieldId: string | null }): void
  (e: 'field-copied', payload: { fieldId: string }): void
  (e: 'field-updated', payload: { fieldId: string; updates: Partial<FormDataField> }): void
  (e: 'field-reorder', payload: { fromIndex: number; toIndex: number; rowId?: string }): void
  (e: 'control-dropped', payload: { type: string; index: number; rowId?: string; preset?: CustomFieldPreset }): void
}>()

const builderState = inject(BUILDER_STATE_KEY)
const registry = inject(FIELD_REGISTRY_KEY)
const options = inject(BUILDER_OPTIONS_KEY)

void registry

function parseControlData(data: string): { type: string; preset?: CustomFieldPreset } | null {
  if (!data.startsWith('control:')) {
    return null
  }
  const rest = data.slice('control:'.length)
  if (rest.startsWith('preset:')) {
    const idx = Number(rest.slice('preset:'.length))
    const preset = options?.fields[idx]
    if (preset) {
      return { type: preset.type, preset }
    }
    return null
  }
  return { type: rest }
}

defineSlots<{
  empty(): void
  field(props: { field: FormDataField; index: number; isSelected: boolean; isEditing: boolean }): void
}>()

type DropSide = 'above' | 'left' | 'right'

const dragOverIndex = ref<number | null>(null)
const dragOverSide = ref<DropSide | null>(null)
const isStageDragOver = ref(false)
const draggedFieldName = ref<string | null>(null)

const isDragActive = computed(
  () => isStageDragOver.value || dragOverIndex.value !== null || draggedFieldName.value !== null,
)

/**
 * Groups consecutive fields that share the same `rowId` into rows. Fields
 * without a `rowId` (or with a unique one) occupy their own row. A row
 * caps at {@link MAX_ROW_SIZE} fields — beyond that the next field starts
 * a new row even if the `rowId` still matches.
 */
interface StageRow {
  fields: { field: FormDataField; index: number }[]
  rowId: string | undefined
}

const rows = computed<StageRow[]>(() => {
  const result: StageRow[] = []
  let current: StageRow | null = null
  props.fields.forEach((field, index) => {
    if (
      current !== null &&
      field.rowId !== undefined &&
      field.rowId === current.rowId &&
      current.fields.length < MAX_ROW_SIZE
    ) {
      current.fields.push({ field, index })
    } else {
      current = { fields: [{ field, index }], rowId: field.rowId }
      result.push(current)
    }
  })
  return result
})

function rowMembersForIndex(index: number): number {
  const row = rows.value.find((r) => r.fields.some((f) => f.index === index))
  /* v8 ignore next -- row is always found for any in-range field index */
  return row?.fields.length ?? 1
}

function resetDragState(): void {
  dragOverIndex.value = null
  dragOverSide.value = null
  isStageDragOver.value = false
  draggedFieldName.value = null
}

function onFieldRemove(payload: { fieldId: string }): void {
  const field = props.fields.find((f) => f.name === payload.fieldId)
  if (field) {
    emit('field-removed', { fieldId: payload.fieldId, field })
  }
}

function onFieldCopy(payload: { fieldId: string }): void {
  emit('field-copied', payload)
}

function onFieldEdit(payload: { fieldId: string }): void {
  if (builderState) {
    const isCurrentlySelected = builderState.selectedFieldId.value === payload.fieldId
    builderState.selectedFieldId.value = isCurrentlySelected ? null : payload.fieldId
  }
  emit('field-selected', { fieldId: payload.fieldId })
}

function onFieldUpdate(payload: { fieldId: string; updates: Partial<FormDataField> }): void {
  emit('field-updated', payload)
}

function onFieldDragStart(payload: { fieldId: string; event: DragEvent }): void {
  draggedFieldName.value = payload.fieldId
  if (payload.event.dataTransfer) {
    payload.event.dataTransfer.effectAllowed = 'move'
    payload.event.dataTransfer.setData('text/plain', `field:${payload.fieldId}`)
    payload.event.dataTransfer.setData('application/x-formbuilder-field', payload.fieldId)
  }
}

/**
 * Detect whether the active drag is a control (from the panel) vs. a field
 * reorder. `getData()` is blocked during `dragover` in real browsers for
 * security, so we rely on `types` (which remains accessible). `getData()` is
 * still checked as a fallback for the jsdom test environment.
 */
function isControlDrag(dt: DataTransfer): boolean {
  if (Array.from(dt.types).includes('application/x-formbuilder-control')) {
    return true
  }
  return dt.getData('text/plain').startsWith('control:')
}

function onFieldDragEnd(payload: { fieldId: string; event: DragEvent }): void {
  const wasDroppedOutside = payload.event.dataTransfer?.dropEffect === 'none'
  resetDragState()
  if (wasDroppedOutside) {
    const field = props.fields.find((f) => f.name === payload.fieldId)
    if (field) {
      emit('field-removed', { fieldId: payload.fieldId, field })
    }
  }
}

function onStageDragOver(event: DragEvent): void {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isControlDrag(event.dataTransfer) ? 'copy' : 'move'
  }
  if (dragOverIndex.value === null) {
    isStageDragOver.value = true
  }
}

function onStageDragLeave(event: DragEvent): void {
  const currentTarget = event.currentTarget as HTMLElement
  const related = event.relatedTarget as HTMLElement | null
  if (!related || !currentTarget.contains(related)) {
    resetDragState()
  }
}

function onStageDrop(event: DragEvent): void {
  event.preventDefault()
  const data = event.dataTransfer?.getData('text/plain') ?? ''
  resetDragState()
  if (!data) {
    return
  }

  const parsed = parseControlData(data)
  if (parsed) {
    emit('control-dropped', { type: parsed.type, index: props.fields.length, preset: parsed.preset })
  }
}

/**
 * Compute which drop side ("left", "right", or "above") was hovered by
 * comparing the pointer X position to the wrapper's bounding rect. When the
 * rect has zero width (jsdom, hidden layout) we conservatively default to
 * "above", which preserves the original "new row" behaviour.
 */
function computeDropSide(wrapper: HTMLElement, event: DragEvent, rowSize: number): DropSide {
  const rect = wrapper.getBoundingClientRect()
  if (rect.width <= 0 || rowSize >= MAX_ROW_SIZE) {
    return 'above'
  }
  const x = event.clientX - rect.left
  const leftZone = rect.width * 0.25
  const rightZone = rect.width * 0.75
  if (x < leftZone) {
    return 'left'
  }
  if (x > rightZone) {
    return 'right'
  }
  return 'above'
}

function onFieldDragOver(index: number, event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
  const wrapper = event.currentTarget as HTMLElement
  dragOverIndex.value = index
  dragOverSide.value = computeDropSide(wrapper, event, rowMembersForIndex(index))
  isStageDragOver.value = false
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = isControlDrag(event.dataTransfer) ? 'copy' : 'move'
  }
}

function onFieldDragLeave(event: DragEvent): void {
  const currentTarget = event.currentTarget as HTMLElement
  const related = event.relatedTarget as HTMLElement | null
  if (!related || !currentTarget.contains(related)) {
    dragOverIndex.value = null
    dragOverSide.value = null
  }
}

/** Produce a collision-resistant rowId for a newly formed inline row. */
function makeRowId(): string {
  return `row-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`
}

function onFieldDrop(index: number, event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()
  const data = event.dataTransfer?.getData('text/plain') ?? ''
  const side = dragOverSide.value ?? 'above'
  resetDragState()
  if (!data) {
    return
  }

  const targetField = props.fields[index]
  const rowSize = rowMembersForIndex(index)
  const canJoinRow = rowSize < MAX_ROW_SIZE

  const parsed = parseControlData(data)
  if (parsed) {
    if (targetField && canJoinRow && (side === 'left' || side === 'right')) {
      const sharedRowId = targetField.rowId ?? makeRowId()
      if (targetField.rowId === undefined && targetField.name) {
        emit('field-updated', { fieldId: targetField.name, updates: { rowId: sharedRowId } })
      }
      const insertIndex = side === 'left' ? index : index + 1
      emit('control-dropped', { type: parsed.type, index: insertIndex, rowId: sharedRowId, preset: parsed.preset })
    } else {
      emit('control-dropped', { type: parsed.type, index, preset: parsed.preset })
    }
  } else if (data.startsWith('field:')) {
    const fromFieldId = data.replace('field:', '')
    const fromIndex = props.fields.findIndex((f) => f.name === fromFieldId)
    if (fromIndex === -1) {
      return
    }
    if (targetField && canJoinRow && (side === 'left' || side === 'right') && fromIndex !== index) {
      const sharedRowId = targetField.rowId ?? makeRowId()
      if (targetField.rowId === undefined && targetField.name) {
        emit('field-updated', { fieldId: targetField.name, updates: { rowId: sharedRowId } })
      }
      const rawToIndex = side === 'left' ? index : index + 1
      const toIndex = fromIndex < rawToIndex ? rawToIndex - 1 : rawToIndex
      emit('field-reorder', { fromIndex, toIndex, rowId: sharedRowId })
    } else {
      emit('field-reorder', { fromIndex, toIndex: index })
    }
  }
}

function isFieldSelected(field: FormDataField): boolean {
  if (builderState) {
    return builderState.selectedFieldId.value === field.name
  }
  return props.selectedFieldId === field.name
}

function isFieldEditing(field: FormDataField): boolean {
  return isFieldSelected(field)
}
</script>

<!-- eslint-disable vue/no-bare-strings-in-template -->
<template>
  <div
    class="builder-stage"
    :class="{
      'drag-active': isDragActive,
      'drag-over': isStageDragOver,
      'has-fields': props.fields.length > 0,
    }"
    data-qa="builder-stage"
    @dragover="onStageDragOver"
    @dragleave="onStageDragLeave"
    @drop="onStageDrop"
  >
    <slot name="empty">
      <div
        v-if="props.fields.length === 0"
        class="stage-empty"
        data-qa="stage-empty"
      >
        <div class="stage-empty-icon">
          +
        </div>
        <div class="stage-empty-title">
          Drag a field here
        </div>
        <div class="stage-empty-hint">
          Pick a control from the panel on the right and drop it here,
          or click to add it.
        </div>
      </div>
    </slot>

    <div
      v-for="(row, rowIndex) in rows"
      :key="row.rowId ?? `row-${String(rowIndex)}`"
      class="stage-row"
      :data-row-size="row.fields.length"
      data-qa="stage-row"
    >
      <div
        v-for="entry in row.fields"
        :key="entry.field.name ?? entry.index"
        class="stage-field-wrapper"
        :class="{
          'drop-before': dragOverIndex === entry.index && dragOverSide === 'above',
          'drop-left': dragOverIndex === entry.index && dragOverSide === 'left',
          'drop-right': dragOverIndex === entry.index && dragOverSide === 'right',
          'is-dragging': draggedFieldName === entry.field.name,
        }"
        data-qa="stage-field-wrapper"
        @dragover="onFieldDragOver(entry.index, $event)"
        @dragleave="onFieldDragLeave"
        @drop="onFieldDrop(entry.index, $event)"
      >
        <slot
          name="field"
          :field="entry.field"
          :index="entry.index"
          :is-selected="isFieldSelected(entry.field)"
          :is-editing="isFieldEditing(entry.field)"
        >
          <BuilderField
            :field="entry.field"
            :is-selected="isFieldSelected(entry.field)"
            :is-editing="isFieldEditing(entry.field)"
            :disabled-attrs="props.disabledAttrs"
            @update:field="onFieldUpdate"
            @remove="onFieldRemove"
            @copy="onFieldCopy"
            @edit="onFieldEdit"
            @dragstart="onFieldDragStart"
            @dragend="onFieldDragEnd"
          />
        </slot>
      </div>
    </div>

    <div
      v-if="props.fields.length > 0 && isDragActive"
      class="stage-tail-drop"
      :class="{ 'drop-target': dragOverIndex === null }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.builder-stage {
  min-height: 240px;
  padding: 12px;
  border: 2px dashed var(--line-2, #d3cec1);
  border-radius: 6px;
  background:
    radial-gradient(circle, rgba(211, 206, 193, 0.5) 1px, transparent 1px),
    var(--surface-sunk, #f3f0e8);
  background-size: 16px 16px, 100% 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 150ms ease, background-color 150ms ease;
  container-type: inline-size;
  container-name: builder-stage;
}

.builder-stage.drag-active {
  border-color: var(--accent, #ffc833);
}

.builder-stage.drag-over {
  border-color: var(--accent, #ffc833);
  background-color: rgba(255, 200, 51, 0.08);
}

.stage-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 48px 24px;
  text-align: center;
  color: var(--ink-3, #6e6a63);
  min-height: 200px;
  pointer-events: none;
}

.stage-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px dashed var(--line-2, #d3cec1);
  font-size: 24px;
  line-height: 1;
  color: var(--ink-3, #6e6a63);
  margin-bottom: 4px;
}

.builder-stage.drag-over .stage-empty-icon {
  border-color: var(--accent, #ffc833);
  color: var(--ink, #111);
}

.stage-empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-2, #3a3a3a);
}

.stage-empty-hint {
  font-size: 12px;
  color: var(--ink-3, #6e6a63);
  max-width: 280px;
}

.stage-row {
  display: flex;
  gap: 8px;
  flex-direction: row;
  align-items: stretch;
}

@container builder-stage (max-width: 520px) {
  .stage-row { flex-direction: column; }
}

.stage-field-wrapper {
  position: relative;
  padding-top: 4px;
  flex: 1 1 0;
  min-width: 0;
  transition: padding-top 150ms ease;
}

.builder-stage.drag-active .stage-field-wrapper {
  padding-top: 10px;
}

.stage-field-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--accent, #ffc833);
  opacity: 0;
  transform: scaleX(0.6);
  transform-origin: center;
  transition: opacity 120ms ease, transform 120ms ease;
  pointer-events: none;
}

.stage-field-wrapper.drop-before::before {
  opacity: 1;
  transform: scaleX(1);
}

.stage-field-wrapper::after {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 0;
  width: 3px;
  border-radius: 2px;
  background: var(--accent, #ffc833);
  opacity: 0;
  transition: opacity 120ms ease;
  pointer-events: none;
}

.stage-field-wrapper.drop-left::after {
  opacity: 1;
  left: -5px;
  right: auto;
}

.stage-field-wrapper.drop-right::after {
  opacity: 1;
  right: -5px;
  left: auto;
}

.stage-field-wrapper.is-dragging > :deep(.builder-field) {
  opacity: 0.4;
  border-style: dashed;
  border-color: var(--accent, #ffc833);
}

.stage-tail-drop {
  position: relative;
  min-height: 40px;
  margin-top: 4px;
  border: 2px dashed var(--line-2, #d3cec1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.4);
  transition: border-color 120ms ease, background-color 120ms ease;
  pointer-events: none;
}

.stage-tail-drop.drop-target {
  border-color: var(--accent, #ffc833);
  background-color: rgba(255, 200, 51, 0.12);
}
</style>
