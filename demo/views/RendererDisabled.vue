<script setup lang="ts">
import { ref } from 'vue'
import { FormRenderer } from '../../src'
import type { FormDataField, UserDataMap } from '../../src'

const disabled = ref(true)

const formData = ref<FormDataField[]>([
  {
    type: 'text',
    subtype: 'text',
    label: 'Order number',
    className: 'form-control',
    name: 'order-no',
    access: false,
    value: 'FBV-4217',
  },
  {
    type: 'date',
    subtype: 'date',
    label: 'Placed on',
    className: 'form-control',
    name: 'placed-on',
    access: false,
    value: '2026-01-12',
  },
  {
    type: 'textarea',
    subtype: 'textarea',
    label: 'Note',
    className: 'form-control',
    name: 'note',
    access: false,
    value: 'Ship with care',
  },
])

const userData = ref<UserDataMap>({})
</script>

<template>
  <p class="demo-lead">
    Toggle the <code>disabled</code> prop to lock every input. Values stay seeded from the
    field definition via the renderer's default-handling.
  </p>

  <div class="demo-stack">
    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">read-only form</span>
      </div>
      <div class="demo-toolbar">
        <label>
          <input v-model="disabled" type="checkbox" data-qa="disabled-toggle" />
          <span class="demo-meta" style="margin-left: 6px">disabled = {{ disabled }}</span>
        </label>
      </div>
      <div class="preview-window-body" data-qa="renderer-wrapper">
        <FormRenderer :form-data="formData" v-model="userData" :disabled="disabled" />
      </div>
    </div>
  </div>
</template>
