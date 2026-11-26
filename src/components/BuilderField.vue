<script setup lang="ts">
import { computed, useId, type DefineComponent } from 'vue'
import type { FormDataField } from '../types/form-data'
import { useBuilderRegistry } from '../state/builderRegistry'
import { useBuilderI18n } from '../state/builderI18n'
import BuilderEditPanel from './BuilderEditPanel.vue'
import BuilderIcon from './BuilderIcon.vue'

/** The field data. */
const props = defineProps<{
  /** The field data. */
  field: FormDataField
  /**
   * Stable identity for this field used in outgoing events. Parent components
   * (notably `BuilderStage`) pass the builder's `internalId` here so that
   * actions continue to work for fields without a `name` attribute. Falls back
   * to `field.name` when omitted to preserve backwards compatibility.
   */
  fieldId?: string
  /** Whether this field is selected. */
  isSelected: boolean
  /** Whether this field is in edit mode. */
  isEditing: boolean
  /** Attributes that should not be editable. */
  disabledAttrs: string[]
}>()

const emit = defineEmits<{
  (e: 'update:field', payload: { fieldId: string; updates: Partial<FormDataField> }): void
  (e: 'remove' | 'copy' | 'edit', payload: { fieldId: string }): void
  (e: 'dragstart' | 'dragend', payload: { fieldId: string; event: DragEvent }): void
}>()

const registry = useBuilderRegistry()
const i18n = useBuilderI18n()
const helpTipId = `${useId()}-help`

const controlComponent = computed<DefineComponent | undefined>(() => {
  if (!registry) {
    return undefined
  }
  return registry.resolveComponent(props.field.type)
})

const fieldLayout = computed<string>(() => {
  if (!registry) {
    return 'default'
  }
  const def = registry.getDefinition(props.field.type)
  return def?.layout ?? 'default'
})

function translate(key: string): string {
  if (i18n) {
    return i18n.t(key)
  }
  return key
}

function getTypeLabel(): string {
  return translate(props.field.type)
}

const previewValue = computed<string[]>(() =>
  (props.field.values ?? []).filter((option) => option.selected).map((option) => option.value),
)

function hasText(text: string | undefined): boolean {
  return text !== undefined && text !== ''
}

const showPreviewLabel = computed<boolean>(() =>
  fieldLayout.value === 'default'
  && (hasText(props.field.label) || props.field.required === true || hasText(props.field.description)),
)

const resolvedFieldId = computed<string | undefined>(() => props.fieldId ?? props.field.name)

function onRemove(): void {
  if (resolvedFieldId.value) {
    emit('remove', { fieldId: resolvedFieldId.value })
  }
}

function onCopy(): void {
  if (resolvedFieldId.value) {
    emit('copy', { fieldId: resolvedFieldId.value })
  }
}

function onEdit(): void {
  if (resolvedFieldId.value) {
    emit('edit', { fieldId: resolvedFieldId.value })
  }
}

function onDragStart(event: DragEvent): void {
  if (resolvedFieldId.value) {
    emit('dragstart', { fieldId: resolvedFieldId.value, event })
  }
}

function onDragEnd(event: DragEvent): void {
  if (resolvedFieldId.value) {
    emit('dragend', { fieldId: resolvedFieldId.value, event })
  }
}

function onUpdateField(payload: { fieldId: string; updates: Partial<FormDataField> }): void {
  emit('update:field', payload)
}
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -->
  <div
    class="builder-field"
    :class="{ selected: props.isSelected }"
    :draggable="!props.isEditing"
    data-qa="builder-field"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div
      class="field-header"
      :draggable="props.isEditing || undefined"
      data-qa="field-header"
    >
      <span class="field-type-label">
        <BuilderIcon
          class="field-type-glyph"
          :type="props.field.type"
          :size="14"
        />
        <span class="field-type-caps">{{ getTypeLabel() }}</span>
      </span>
      <div class="field-actions">
        <button
          type="button"
          class="field-action-btn"
          :class="{ 'field-edit-active': props.isEditing }"
          :title="translate('editField')"
          :aria-label="translate('editField')"
          :aria-pressed="props.isEditing"
          data-qa="field-edit-btn"
          @click="onEdit"
        >
          ✎
        </button>
        <button
          type="button"
          class="field-action-btn"
          :title="translate('copyField')"
          :aria-label="translate('copyField')"
          data-qa="field-copy-btn"
          @click="onCopy"
        >
          ⧉
        </button>
        <button
          type="button"
          class="field-action-btn field-remove-btn"
          :title="translate('removeField')"
          :aria-label="translate('removeField')"
          data-qa="field-remove-btn"
          @click="onRemove"
        >
          ✕
        </button>
      </div>
    </div>

    <div
      class="field-preview"
      data-qa="field-preview"
    >
      <label
        v-if="showPreviewLabel"
        class="preview-label"
        data-qa="preview-label"
      >
        {{ props.field.label }}
        <span
          v-if="props.field.required"
          class="preview-required"
          data-qa="preview-required"
        >
          *
        </span>
        <span
          v-if="props.field.description"
          class="preview-help-wrap"
        >
          <button
            type="button"
            class="preview-help-icon"
            :aria-label="translate('description')"
            :aria-describedby="helpTipId"
            data-qa="preview-help-icon"
          >
            ?
          </button>
          <span
            :id="helpTipId"
            class="preview-help-tip"
            role="tooltip"
            data-qa="preview-help-tip"
          >{{ props.field.description }}</span>
        </span>
      </label>
      <component
        :is="controlComponent"
        v-if="controlComponent"
        :field="props.field"
        :model-value="previewValue"
        :preview="true"
      />
      <div
        v-else
        class="unknown-field"
      >
        Unknown field type: {{ props.field.type }}
      </div>
    </div>

    <BuilderEditPanel
      v-if="props.isEditing"
      :field="props.field"
      :field-id="resolvedFieldId ?? ''"
      :disabled-attrs="props.disabledAttrs"
      @update:field="onUpdateField"
      @close="onEdit"
    />
  </div>
  <!-- eslint-enable vue/no-bare-strings-in-template -->
</template>

<style scoped>
.builder-field {
  padding: 10px 12px;
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(17, 17, 17, 0.04);
  cursor: grab;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.builder-field:hover { border-color: var(--line-2, #d3cec1); }

.builder-field.selected {
  border-color: var(--ink, #111);
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

.builder-field:active { cursor: grabbing; }

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
}

.field-type-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-3, #6e6a63);
}

.field-type-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  color: var(--ink-2, #3a3a3a);
}

.field-type-caps {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-actions { display: flex; gap: 2px; }

.field-action-btn {
  padding: 2px 5px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--ink-3, #6e6a63);
  font-size: 12px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.field-action-btn:hover {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink, #111);
}

.field-edit-active,
.field-edit-active:hover {
  background: var(--ink, #111);
  color: var(--paper, #fbfaf7);
}

.field-remove-btn:hover {
  background: var(--danger-soft, #fceaea);
  color: var(--danger, #d64545);
}

.field-preview {
  margin-top: 2px;
  pointer-events: none;
}

.preview-label {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink, #111);
}

.preview-required {
  color: var(--danger, #d64545);
  margin-left: 2px;
}

.preview-help-wrap {
  position: relative;
  display: inline-block;
  margin-left: 6px;
  vertical-align: middle;
  pointer-events: auto;
}

.preview-help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--ink, #111);
  color: var(--paper, #fbfaf7);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.preview-help-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  max-width: 220px;
  min-width: 100px;
  padding: 6px 9px;
  background: var(--ink, #111);
  color: var(--paper, #fbfaf7);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.35;
  border-radius: 4px;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.preview-help-tip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: var(--ink, #111);
}

.preview-help-wrap:hover .preview-help-tip,
.preview-help-icon:focus-visible + .preview-help-tip {
  opacity: 1;
}

.unknown-field {
  color: var(--ink-3, #6e6a63);
  font-style: italic;
}
</style>
