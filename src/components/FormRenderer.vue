<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, computed, useTemplateRef } from 'vue'
import type { FormDataField } from '../types/form-data'
import type { UserDataMap } from '../types/user-data'
import type { RendererOptions } from '../types/renderer-options'
import { provideBuilderRegistry } from '../state/builderRegistry'
import { provideBuilderI18n } from '../state/builderI18n'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { useI18n } from '../composables/useI18n'
import { useFormRenderer } from '../composables/useFormRenderer'
import RendererField from './RendererField.vue'
import { defaultAnswer } from '../utils/defaultAnswer'

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

void props.options

// Provide to children
provideBuilderRegistry({
  getDefinition: registry.getDefinition,
  getAllTypes: registry.getAllTypes,
  getSubtypes: registry.getSubtypes,
  isActive: registry.isActive,
  getDefaultAttrs: registry.getDefaultAttrs,
  resolveComponent: registry.resolveComponent,
})
provideBuilderI18n({ t: i18n.t })

interface RendererFieldHandle {
  fieldName: string | undefined
  controlElement: () => HTMLElement | undefined
}

const renderedFields = shallowRef<FormDataField[]>(props.formData)
const untouchedNames = new Set<string>()
const validation = useFormRenderer(i18n.t)
const fieldErrors = ref<Record<string, string[]>>({})
const fieldComponents = useTemplateRef<RendererFieldHandle[]>('fieldComponents')

function fieldNames(fields: FormDataField[]): Set<string> {
  return new Set(fields.flatMap((field) => (field.name ? [field.name] : [])))
}

function seedDefaults(current: UserDataMap, fields: FormDataField[]): UserDataMap {
  const seeded: UserDataMap = { ...current }
  const cleared = new Set<string>()
  for (const field of fields) {
    const name = field.name
    if (!name || (seeded[name] !== undefined && !untouchedNames.has(name))) {
      continue
    }
    const answer = defaultAnswer(field)
    if (answer) {
      seeded[name] = answer
      untouchedNames.add(name)
    } else if (untouchedNames.has(name)) {
      cleared.add(name)
      untouchedNames.delete(name)
    }
  }
  return withoutNames(seeded, cleared)
}

function withoutNames(data: Record<string, string[]>, names: Set<string>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(data).filter(([name]) => !names.has(name)))
}

function sameAnswers(a: UserDataMap, b: UserDataMap): boolean {
  const entries = Object.entries(a)
  return entries.length === Object.keys(b).length && entries.every(([key, left]) => {
    const right = b[key]
    return left.length === right?.length && left.every((v, i) => v === right[i])
  })
}

const localData = ref<UserDataMap>(seedDefaults(props.modelValue, renderedFields.value))
let knownNames = fieldNames(renderedFields.value)

watch(
  () => props.modelValue,
  (newValue) => {
    for (const name of untouchedNames) {
      if (newValue[name] !== localData.value[name]) {
        untouchedNames.delete(name)
      }
    }
    localData.value = { ...newValue }
  },
  { deep: true },
)

watch(
  () => props.formData,
  (fields) => {
    renderedFields.value = fields
  },
)

watch(
  renderedFields,
  (fields) => {
    const currentNames = fieldNames(fields)
    const removed = new Set([...knownNames].filter((name) => !currentNames.has(name)))
    knownNames = currentNames
    for (const name of removed) {
      untouchedNames.delete(name)
    }
    fieldErrors.value = withoutNames(fieldErrors.value, removed)
    const next = seedDefaults(withoutNames(localData.value, removed), fields)
    if (!sameAnswers(next, localData.value)) {
      localData.value = next
      emit('update:modelValue', { ...next })
    }
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
  untouchedNames.delete(field.name)
  fieldErrors.value = withoutNames(fieldErrors.value, new Set([field.name]))
  localData.value = { ...localData.value, [field.name]: value }
  emit('update:modelValue', { ...localData.value })
}

function getFieldErrors(field: FormDataField): string[] {
  return field.name ? fieldErrors.value[field.name] ?? [] : []
}

function validate(): Record<string, string[]> {
  validation.setAnswers(localData.value)
  validation.validate(renderedFields.value)
  fieldErrors.value = { ...validation.errors.value }
  return { ...fieldErrors.value }
}

function getElement(fieldName: string): HTMLElement | undefined {
  return fieldComponents.value?.find((component) => component.fieldName === fieldName)?.controlElement()
}

function resetAnswers(): void {
  untouchedNames.clear()
  fieldErrors.value = {}
  localData.value = seedDefaults({}, renderedFields.value)
  emit('update:modelValue', { ...localData.value })
}

function onClick(event: MouseEvent): void {
  if (event.target instanceof Element && event.target.closest('button[type="reset"]')) {
    event.preventDefault()
    resetAnswers()
  }
}

function handleChange(payload: { fieldName: string; value: string[] }): void {
  emit('change', payload)
}

onMounted(() => {
  if (!sameAnswers(localData.value, props.modelValue)) {
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
  renderedFields.value.forEach((field, index) => {
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
    untouchedNames.clear()
    fieldErrors.value = {}
    localData.value = {}
    emit('update:modelValue', {})
  },
  setData: (formData: FormDataField[]) => {
    renderedFields.value = formData
  },
  getElement,
  validate,
})
</script>

<template>
  <div
    class="form-renderer"
    data-qa="form-renderer"
    @click="onClick"
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
        ref="fieldComponents"
        :field="entry.field"
        :model-value="getFieldModelValue(entry.field)"
        :errors="getFieldErrors(entry.field)"
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
