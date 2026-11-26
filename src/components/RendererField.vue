<script setup lang="ts">
import { computed, useId, useTemplateRef, type ComponentPublicInstance, type DefineComponent } from 'vue'
import type { FormDataField } from '../types/form-data'
import { FieldType } from '../types/field-types'
import { useBuilderRegistry } from '../state/builderRegistry'

/** The field definition. */
const props = withDefaults(defineProps<{
  /** The field definition. */
  field: FormDataField
  /** Current answer value(s). */
  modelValue: string[]
  /** Whether all controls are disabled. */
  disabled: boolean
  /** Validation messages shown under the control. */
  errors?: string[]
}>(), {
  errors: () => [],
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', payload: { fieldName: string; value: string[] }): void
}>()

const registry = useBuilderRegistry()

const controlComponent = computed<DefineComponent | undefined>(() => {
  if (!registry) {
    return undefined
  }
  return registry.resolveComponent(props.field.type)
})

const fieldLayout = computed(() => {
  if (!registry) {
    return 'default'
  }
  const def = registry.getDefinition(props.field.type)
  return def?.layout ?? 'default'
})

const GROUP_TYPES = new Set<string>([FieldType.CheckboxGroup, FieldType.RadioGroup])

const controlId = useId()
const labelId = `${controlId}-label`
const helpId = `${controlId}-help`
const errorId = `${controlId}-error`
const control = useTemplateRef<ComponentPublicInstance>('control')

const isGroup = computed(() => GROUP_TYPES.has(props.field.type))
const showLabel = computed(() => fieldLayout.value === 'default' && Boolean(props.field.label))
const errorText = computed(() => props.errors.join(' '))

const describedBy = computed(() => {
  const ids = [
    showLabel.value && props.field.description ? helpId : '',
    errorText.value ? errorId : '',
  ].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
})

function definedAttrs(attrs: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}

const a11yAttrs = computed(() => definedAttrs({
  'aria-describedby': describedBy.value,
  'aria-invalid': errorText.value ? 'true' : undefined,
}))

const groupAttrs = computed(() => (isGroup.value
  ? { role: 'group', ...definedAttrs({ 'aria-labelledby': showLabel.value ? labelId : undefined }), ...a11yAttrs.value }
  : {}))

const controlAttrs = computed(() => (isGroup.value
  ? {}
  : { ...definedAttrs({ id: showLabel.value ? controlId : undefined }), ...a11yAttrs.value }))

function controlElement(): HTMLElement | undefined {
  return control.value?.$el as HTMLElement | undefined
}

defineExpose({
  fieldName: computed(() => props.field.name),
  controlElement,
})

function onUpdateValue(value: string[]): void {
  emit('update:modelValue', value)
  if (props.field.name) {
    emit('change', { fieldName: props.field.name, value })
  }
}

defineSlots<{
  default(props: { field: FormDataField; value: string[]; updateValue: (v: string[]) => void }): void
}>()
</script>

<template>
  <div
    v-if="fieldLayout !== 'hidden'"
    class="renderer-field"
    data-qa="renderer-field"
    v-bind="groupAttrs"
  >
    <div
      v-if="showLabel"
      class="field-label-row"
    >
      <component
        :is="isGroup ? 'span' : 'label'"
        :id="labelId"
        :for="isGroup ? undefined : controlId"
        class="field-label"
        data-qa="field-label"
      >
        {{ props.field.label }}
        <span
          v-if="props.field.required"
          class="required-marker"
          data-qa="required-marker"
        >
          *
        </span>
      </component>
      <span
        v-if="props.field.description"
        class="help-wrap"
      >
        <button
          type="button"
          class="help-icon"
          :aria-label="props.field.description"
          data-qa="field-help-icon"
        >
          ?
        </button>
        <span
          :id="helpId"
          class="help-tip"
          role="tooltip"
          data-qa="field-help-tip"
        >{{ props.field.description }}</span>
      </span>
    </div>

    <slot
      :field="props.field"
      :value="props.modelValue"
      :update-value="onUpdateValue"
    >
      <component
        :is="controlComponent"
        v-if="controlComponent"
        ref="control"
        v-bind="controlAttrs"
        :field="props.field"
        :model-value="props.modelValue"
        :disabled="props.disabled"
        @update:model-value="onUpdateValue"
      />
    </slot>

    <div
      v-if="errorText"
      :id="errorId"
      class="field-error"
      data-qa="field-error"
    >
      {{ errorText }}
    </div>
  </div>

  <component
    :is="controlComponent"
    v-else-if="controlComponent"
    ref="control"
    :field="props.field"
    :model-value="props.modelValue"
    :disabled="props.disabled"
    @update:model-value="onUpdateValue"
  />
</template>

<style scoped>
.renderer-field {
  margin-bottom: 16px;
}

.field-label-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.field-label {
  font-weight: 500;
  color: var(--ink, #333);
}

.field-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--danger, #ff4d4f);
}

.required-marker {
  color: var(--danger, #ff4d4f);
  margin-left: 2px;
}

.help-wrap {
  position: relative;
  display: inline-flex;
  margin-left: 6px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--ink-2, #1e2329);
  color: var(--surface, #fff);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.help-icon:hover {
  background: var(--ink, #000);
}

.help-icon:focus-visible {
  outline: 2px solid var(--fb-focus-ring, var(--ink, #111));
  outline-offset: 1px;
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

.help-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  max-width: 240px;
  min-width: 120px;
  padding: 7px 10px;
  background: var(--ink-2, #1e2329);
  color: var(--surface, #fff);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  border-radius: 4px;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.help-tip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-bottom-color: var(--ink-2, #1e2329);
}

.help-wrap:hover .help-tip,
.help-icon:focus-visible + .help-tip {
  opacity: 1;
}
</style>
