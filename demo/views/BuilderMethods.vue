<script setup lang="ts">
import { ref, useTemplateRef, computed } from 'vue'
import { FormBuilder } from '../../src'
import type { FormDataField } from '../../src'

const formData = ref<FormDataField[]>([])
const builder = useTemplateRef<InstanceType<typeof FormBuilder>>('builder')

const savedOutput = ref<string>('')

function buildSampleField(label: string): FormDataField {
  const name = `text-${String(Date.now())}-${String(Math.random()).slice(2, 6)}`
  return {
    type: 'text',
    label,
    className: 'form-control',
    name,
    subtype: 'text',
    access: false,
    required: false,
  }
}

function addText(): void {
  builder.value?.addField(buildSampleField('Added by method'))
}

function setPreset(): void {
  builder.value?.setData([
    { type: 'header', subtype: 'h1', label: 'Preset form', access: false },
    { type: 'text', subtype: 'text', label: 'Your name', className: 'form-control', name: 'name-preset', access: false, required: true },
    { type: 'textarea', subtype: 'textarea', label: 'Message', className: 'form-control', name: 'message-preset', access: false },
  ])
}

function clearAll(): void {
  builder.value?.clearFields()
}

function removeFirst(): void {
  const current = builder.value?.getData() ?? []
  if (current.length === 0) return
  // The exposed removeField() takes an internal ID, which is only useful
  // when you already hold the ref returned by addField(). For the demo we
  // rebuild formData by slicing — the outcome is identical.
  builder.value?.setData(current.slice(1))
}

function save(): void {
  const data = builder.value?.save() ?? []
  savedOutput.value = JSON.stringify(data, null, 2)
}

const fieldCount = computed(() => formData.value.length)
</script>

<template>
  <p class="demo-lead">
    Each button invokes the corresponding method on the FormBuilder instance via a
    template ref.
  </p>

  <div class="demo-stack">
    <div class="preview-window" data-qa="builder-wrapper">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">exposed methods</span>
      </div>
      <div class="demo-toolbar">
        <button type="button" class="demo-btn primary" data-qa="m-addField" @click="addText">addField()</button>
        <button type="button" class="demo-btn" data-qa="m-setData" @click="setPreset">setData(preset)</button>
        <button type="button" class="demo-btn" data-qa="m-removeFirst" @click="removeFirst">removeField(first)</button>
        <button type="button" class="demo-btn" data-qa="m-clearFields" @click="clearAll">clearFields()</button>
        <button type="button" class="demo-btn" data-qa="m-save" @click="save">save()</button>
        <span class="demo-meta" data-qa="m-count">Fields: {{ fieldCount }}</span>
      </div>
      <div class="preview-window-body">
        <FormBuilder ref="builder" v-model="formData" />
      </div>
    </div>

    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">save() output</span>
      </div>
      <pre class="demo-pre" data-qa="saved-output">{{ savedOutput || '(click save)' }}</pre>
    </div>
  </div>
</template>
