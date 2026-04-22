<script setup lang="ts">
import { ref, computed } from 'vue'
import { FormRenderer } from '../../src'
import type { FormDataField, UserDataMap } from '../../src'

const formData = ref<FormDataField[]>([
  { type: 'header', subtype: 'h1', label: 'Contact details', access: false },
  {
    type: 'text',
    subtype: 'text',
    label: 'Full name',
    className: 'form-control',
    name: 'full-name',
    access: false,
    required: true,
    placeholder: 'Ada Lovelace',
    description: 'As shown on your passport or government ID.',
  },
  {
    type: 'text',
    subtype: 'email',
    label: 'Email',
    className: 'form-control',
    name: 'email',
    access: false,
    placeholder: 'ada@example.com',
  },
  {
    type: 'select',
    label: 'Country',
    className: 'form-control',
    name: 'country',
    access: false,
    multiple: false,
    values: [
      { label: 'United Kingdom', value: 'uk', selected: false },
      { label: 'Ukraine', value: 'ua', selected: true },
      { label: 'United States', value: 'us', selected: false },
    ],
  },
  {
    type: 'checkbox-group',
    label: 'Interests',
    className: 'form-control',
    name: 'interests',
    access: false,
    other: false,
    values: [
      { label: 'Vue', value: 'vue', selected: false },
      { label: 'TypeScript', value: 'ts', selected: false },
      { label: 'CSS', value: 'css', selected: false },
    ],
  },
  {
    type: 'textarea',
    subtype: 'textarea',
    label: 'Bio',
    className: 'form-control',
    name: 'bio',
    access: false,
  },
])

const userData = ref<UserDataMap>({})
const json = computed(() => JSON.stringify(userData.value, null, 2))

const emittedChange = ref<{ fieldName: string; value: string[] } | null>(null)
function onChange(payload: { fieldName: string; value: string[] }): void {
  emittedChange.value = payload
}
</script>

<template>
  <p class="demo-lead">
    A pre-populated form definition rendered into answerable inputs. Fill fields and the
    <code>UserDataMap</code> on the right updates live.
  </p>

  <div class="demo-stack">
    <div class="preview-window" data-qa="renderer-wrapper">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">live form</span>
      </div>
      <div class="preview-window-body">
        <FormRenderer :form-data="formData" v-model="userData" @change="onChange" />
      </div>
    </div>

    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">v-model · userData</span>
      </div>
      <pre class="demo-pre" data-qa="user-data-json">{{ json }}</pre>
      <div class="demo-caption" data-qa="last-change">
        last @change: {{ emittedChange ? `${emittedChange.fieldName} → ${JSON.stringify(emittedChange.value)}` : '(none yet)' }}
      </div>
    </div>
  </div>
</template>
