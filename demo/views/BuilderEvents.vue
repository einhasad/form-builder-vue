<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '../../src'
import type { FormDataField } from '../../src'

const formData = ref<FormDataField[]>([])

interface LogEntry { id: number; event: string; payload: string }
const log = ref<LogEntry[]>([])
let next = 0

function add(event: string, payload: unknown): void {
  next += 1
  log.value = [
    { id: next, event, payload: JSON.stringify(payload) },
    ...log.value,
  ].slice(0, 50)
}

function clear(): void {
  log.value = []
}

function onUpdate(value: FormDataField[]): void { add('update:modelValue', { length: value.length }) }
function onAdded(p: { fieldId: string; field: FormDataField }): void { add('field-added', { fieldId: p.fieldId, type: p.field.type }) }
function onRemoved(p: { fieldId: string; field: FormDataField }): void { add('field-removed', { fieldId: p.fieldId, type: p.field.type }) }
function onUpdated(p: { fieldId: string; field: FormDataField }): void { add('field-updated', { fieldId: p.fieldId, type: p.field.type }) }
function onMoved(p: { fieldId: string; fromIndex: number; toIndex: number }): void { add('field-moved', p) }
function onSelected(p: { fieldId: string | null }): void { add('field-selected', p) }
function onSave(p: { formData: FormDataField[] }): void { add('save', { count: p.formData.length }) }
function onClear(): void { add('clear', {}) }
function onLoaded(): void { add('loaded', {}) }
</script>

<template>
  <p class="demo-lead">
    Every FormBuilder event is wired to the console below. Add, remove, reorder, edit, or
    click Save/Clear to see entries land at the top of the log.
  </p>

  <div class="demo-stack">
    <div class="preview-window" data-qa="builder-wrapper">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">live builder</span>
      </div>
      <div class="preview-window-body">
        <FormBuilder
          v-model="formData"
          @update:model-value="onUpdate"
          @field-added="onAdded"
          @field-removed="onRemoved"
          @field-updated="onUpdated"
          @field-moved="onMoved"
          @field-selected="onSelected"
          @save="onSave"
          @clear="onClear"
          @loaded="onLoaded"
        />
      </div>
    </div>

    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">event log</span>
      </div>
      <div class="demo-toolbar">
        <button type="button" class="demo-btn" data-qa="log-clear" @click="clear">
          Clear log
        </button>
        <span data-qa="log-count" class="demo-meta">Entries: {{ log.length }}</span>
      </div>
      <div class="demo-log" data-qa="event-log">
        <div v-if="log.length === 0" class="demo-log-empty">No events yet.</div>
        <div v-for="entry in log" :key="entry.id" :data-qa="`log-${entry.event}`">
          <strong>{{ entry.event }}</strong>
          <span> {{ entry.payload }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
