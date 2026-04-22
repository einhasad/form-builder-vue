<script setup lang="ts">
import { provide, ref, watch, onMounted, computed } from 'vue'
import type { FormDataField } from '../types/form-data'
import type { UserDataMap } from '../types/user-data'
import type { RendererOptions } from '../types/renderer-options'
import { FIELD_REGISTRY_KEY, I18N_KEY } from '../types/injection-keys'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { useI18n } from '../composables/useI18n'
import { registerBuiltinControls } from './controls/register'
import RendererField from './RendererField.vue'

/** Field definitions to render. */
const props = withDefaults(defineProps<{
  /** Field definitions to render. */
  formData?: FormDataField[]
  /** User answers via v-model. */
  modelValue?: UserDataMap
  /** Configuration overrides. */
  options?: Partial<RendererOptions>
  /** Whether all inputs are disabled. */
  disabled?: boolean
}>(), {
  formData: () => [],
  modelValue: () => ({}),
  options: () => ({}),
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: UserDataMap): void
  (e: 'render'): void
  (e: 'change', payload: { fieldName: string; value: string[] }): void
}>()

// Composables
const registry = useFieldRegistry()
const i18n = useI18n()

// Register all built-in controls
registerBuiltinControls(registry.register)

// Build resolved options
const resolvedOptions: RendererOptions = {
  disableHTMLLabels: props.options.disableHTMLLabels ?? false,
  notify: props.options.notify ?? {
    error: (msg: string) => { void msg },
    success: (msg: string) => { void msg },
    warning: (msg: string) => { void msg },
  },
}

// Use resolvedOptions to provide renderer configuration
provide('renderer-options', resolvedOptions)

// Provide to children
provide(FIELD_REGISTRY_KEY, {
  getDefinition: registry.getDefinition,
  getAllTypes: registry.getAllTypes,
  getSubtypes: registry.getSubtypes,
  isActive: registry.isActive,
  getDefaultAttrs: registry.getDefaultAttrs,
  resolveComponent: registry.resolveComponent,
})
provide(I18N_KEY, { t: i18n.t })

// Local state — seed from parent modelValue first, then fall back to
// per-field defaults (`values[].selected` or `field.value`) so that
// pre-marked selections survive into the rendered form.
function seedDefaults(initial: UserDataMap): UserDataMap {
  const seeded: UserDataMap = { ...initial }
  for (const field of props.formData) {
    const name = field.name
    if (!name || seeded[name] !== undefined) {
      continue
    }
    if (field.values && field.values.length > 0) {
      const defaults = field.values.filter((v) => v.selected).map((v) => v.value)
      if (defaults.length > 0) {
        seeded[name] = defaults
      }
    } else if (field.value !== undefined && field.value !== '') {
      seeded[name] = [field.value]
    }
  }
  return seeded
}

const localData = ref<UserDataMap>(seedDefaults(props.modelValue))

// Sync external modelValue -> local
watch(
  () => props.modelValue,
  (newValue) => {
    localData.value = { ...newValue }
  },
  { deep: true },
)

function getFieldModelValue(field: FormDataField): string[] {
  const name = field.name
  if (!name) {
    return []
  }
  return localData.value[name] ?? []
}

function handleUpdateValue(field: FormDataField, value: string[]): void {
  if (!field.name) {
    return
  }
  localData.value = { ...localData.value, [field.name]: value }
  emit('update:modelValue', { ...localData.value })
}

function handleChange(payload: { fieldName: string; value: string[] }): void {
  emit('change', payload)
}

onMounted(() => {
  if (Object.keys(localData.value).length > Object.keys(props.modelValue).length) {
    emit('update:modelValue', { ...localData.value })
  }
  emit('render')
})

/**
 * Group consecutive fields that share a `rowId` (max 3 per row) so they
 * render side-by-side. Fields without a `rowId` occupy their own row.
 */
interface RendererRow {
  fields: { field: FormDataField; index: number }[]
  rowId: string | undefined
}

const rows = computed<RendererRow[]>(() => {
  const MAX_ROW_SIZE = 3
  const result: RendererRow[] = []
  let current: RendererRow | null = null
  props.formData.forEach((field, index) => {
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

defineSlots<{
  field(props: { field: FormDataField; index: number; value: string[]; updateValue: (v: string[]) => void }): void
}>()

defineExpose({
  userData: () => Object.entries(localData.value).map(([name, values]) => ({
    name,
    userData: values,
  })),
  clear: () => {
    localData.value = {}
    emit('update:modelValue', {})
  },
  setData: (formData: FormDataField[]) => {
    void formData
  },
  getElement: (fieldName: string) => {
    void fieldName
    return undefined
  },
})
</script>

<template>
  <div
    class="form-renderer"
    data-qa="form-renderer"
  >
    <div
      v-for="(row, rowIndex) in rows"
      :key="row.rowId ?? `row-${String(rowIndex)}`"
      class="form-renderer-row"
      :data-row-size="row.fields.length"
      data-qa="form-renderer-row"
    >
      <RendererField
        v-for="entry in row.fields"
        :key="entry.field.name ?? entry.index"
        :field="entry.field"
        :model-value="getFieldModelValue(entry.field)"
        :disabled="props.disabled"
        @update:model-value="handleUpdateValue(entry.field, $event)"
        @change="handleChange"
      >
        <template #default="{ value, updateValue }">
          <slot
            name="field"
            :field="entry.field"
            :index="entry.index"
            :value="value"
            :update-value="updateValue"
          />
        </template>
      </RendererField>
    </div>
  </div>
</template>

<style scoped>
.form-renderer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  container-type: inline-size;
  container-name: form-renderer;
}

.form-renderer-row {
  display: flex;
  gap: 16px;
  flex-direction: row;
  align-items: flex-start;
}

.form-renderer-row > :deep(.renderer-field) {
  flex: 1 1 0;
  min-width: 0;
}

@container form-renderer (max-width: 520px) {
  .form-renderer-row { flex-direction: column; gap: 0; }
  .form-renderer-row > :deep(.renderer-field) { flex: 0 0 auto; width: 100%; }
}
</style>
