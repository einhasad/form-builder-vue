<script setup lang="ts">
import { inject, computed } from 'vue'
import { FIELD_REGISTRY_KEY, I18N_KEY, BUILDER_OPTIONS_KEY } from '../types/injection-keys'
import type { ControlDefinition } from '../types/control-definition'
import type { CustomFieldPreset } from '../types/common'
import BuilderIcon from './BuilderIcon.vue'

/** Disabled field types. */
const props = defineProps<{
  /** Field types that should be hidden from the panel. */
  disabledTypes: string[]
}>()

const emit = defineEmits<(
  e: 'control-drag-start' | 'control-click',
  payload: { type: string; preset?: CustomFieldPreset },
) => void>()

const registry = inject(FIELD_REGISTRY_KEY)
const i18n = inject(I18N_KEY)
const options = inject(BUILDER_OPTIONS_KEY)

const controls = computed<ControlDefinition[]>(() => {
  if (!registry) {
    return []
  }
  const allTypes = registry.getAllTypes()
  const controlOrder = (options?.controlOrder ?? []) as string[]
  const ordered = controlOrder.filter((t) => allTypes.includes(t))
  const remaining = allTypes.filter((t) => !ordered.includes(t))
  return [...ordered, ...remaining]
    .map((type) => registry.getDefinition(type))
    .filter((def): def is ControlDefinition => def !== undefined)
    .filter((def) => !props.disabledTypes.includes(def.type))
})

const presets = computed<CustomFieldPreset[]>(() => options?.fields ?? [])

function getLabel(key: string): string {
  if (i18n) {
    return i18n.t(key)
  }
  return key
}

function onControlDragStart(type: string, event: DragEvent): void {
  emit('control-drag-start', { type })
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', `control:${type}`)
    event.dataTransfer.setData('application/x-formbuilder-control', type)
  }
}

function onControlClick(type: string): void {
  emit('control-click', { type })
}

function onPresetDragStart(index: number, preset: CustomFieldPreset, event: DragEvent): void {
  emit('control-drag-start', { type: preset.type, preset })
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', `control:preset:${String(index)}`)
    event.dataTransfer.setData('application/x-formbuilder-control', preset.type)
  }
}

function onPresetClick(preset: CustomFieldPreset): void {
  emit('control-click', { type: preset.type, preset })
}
</script>

<template>
  <div
    class="builder-control-panel"
    data-qa="builder-control-panel"
  >
    <!-- eslint-disable-next-line vue/no-bare-strings-in-template -->
    <div class="panel-title">
      Add fields
    </div>
    <div class="controls-list">
      <div
        v-for="control in controls"
        :key="control.type"
        class="control-item"
        draggable="true"
        data-qa="control-item"
        @dragstart="onControlDragStart(control.type, $event)"
        @click="onControlClick(control.type)"
      >
        <BuilderIcon
          class="control-icon"
          :type="control.type"
          :size="13"
        />
        <span class="control-label">{{ getLabel(control.type) }}</span>
      </div>
      <div
        v-for="(preset, index) in presets"
        :key="`preset-${String(index)}`"
        class="control-item control-preset"
        draggable="true"
        data-qa="control-preset-item"
        @dragstart="onPresetDragStart(index, preset, $event)"
        @click="onPresetClick(preset)"
      >
        <BuilderIcon
          class="control-icon"
          :type="preset.type"
          :size="13"
        />
        <span class="control-label">{{ preset.label ?? getLabel(preset.type) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.builder-control-panel {
  padding: 14px;
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
}

.panel-title {
  margin-bottom: 12px;
  color: var(--ink, #111);
  font-size: 13px;
  font-weight: 600;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: var(--paper, #fbfaf7);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 6px;
  color: var(--ink-2, #3a3a3a);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  cursor: grab;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}

.control-item:hover {
  background: var(--surface, #fff);
  border-color: var(--ink, #111);
  color: var(--ink, #111);
}

.control-item:active { cursor: grabbing; }

.control-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--glyph, var(--ink-3, #6e6a63));
  transition: color 120ms ease;
}

.control-item:hover .control-icon {
  color: var(--ink, #111);
}

.control-label { color: inherit; }
</style>
