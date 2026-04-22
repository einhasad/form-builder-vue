<script setup lang="ts">
import { inject, computed, type DefineComponent } from 'vue'
import type { FormDataField } from '../types/form-data'
import { FIELD_REGISTRY_KEY } from '../types/injection-keys'

/** The field definition. */
const props = defineProps<{
  /** The field definition. */
  field: FormDataField
  /** Current answer value(s). */
  modelValue: string[]
  /** Whether all controls are disabled. */
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', payload: { fieldName: string; value: string[] }): void
}>()

const registry = inject(FIELD_REGISTRY_KEY)

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
    :class="props.field.className"
    data-qa="renderer-field"
  >
    <label
      v-if="fieldLayout === 'default' && props.field.label"
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
      <span
        v-if="props.field.description"
        class="help-wrap"
      >
        <button
          type="button"
          class="help-icon"
          :aria-label="props.field.description"
          data-qa="field-help-icon"
          tabindex="-1"
        >
          ?
        </button>
        <span
          class="help-tip"
          role="tooltip"
          data-qa="field-help-tip"
        >{{ props.field.description }}</span>
      </span>
    </label>

    <slot
      :field="props.field"
      :value="props.modelValue"
      :update-value="onUpdateValue"
    >
      <component
        :is="controlComponent"
        v-if="controlComponent"
        :field="props.field"
        :model-value="props.modelValue"
        :disabled="props.disabled"
        @update:model-value="onUpdateValue"
      />
    </slot>
  </div>

  <component
    :is="controlComponent"
    v-else-if="controlComponent"
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

.field-label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
}

.required-marker {
  color: #ff4d4f;
  margin-left: 2px;
}

.help-wrap {
  position: relative;
  display: inline-block;
  margin-left: 6px;
  vertical-align: middle;
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
  background: #1e2329;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  cursor: help;
}

.help-icon:hover {
  background: #000;
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
  background: #1e2329;
  color: #fff;
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
  border-bottom-color: #1e2329;
}

.help-wrap:hover .help-tip,
.help-icon:focus-visible + .help-tip {
  opacity: 1;
}
</style>
