<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder, FieldType } from '../../src'
import type { FormDataField, BuilderOptions } from '../../src'

const formData = ref<FormDataField[]>([])

const controlPosition = ref<'left' | 'right'>('left')
const showActionButtons = ref(true)
const editOnAdd = ref(false)
const fieldRemoveWarn = ref(false)

const hideHidden = ref(true)
const hideButton = ref(false)

const disableLabelAttr = ref(false)

function resolvedDisableFields(): FieldType[] {
  const out: FieldType[] = []
  if (hideHidden.value) out.push(FieldType.Hidden)
  if (hideButton.value) out.push(FieldType.Button)
  return out
}

function resolvedDisabledAttrs(): string[] {
  return disableLabelAttr.value ? ['label'] : []
}

function resolvedOptions(): Partial<BuilderOptions> {
  return {
    controlPosition: controlPosition.value,
    showActionButtons: showActionButtons.value,
    editOnAdd: editOnAdd.value,
    fieldRemoveWarn: fieldRemoveWarn.value,
    disableFields: resolvedDisableFields(),
    disabledAttrs: resolvedDisabledAttrs(),
  }
}
</script>

<template>
  <p class="demo-lead">
    Every knob from <code>BuilderOptions</code> is wired up below. Flip a toggle and
    watch the live instance react.
  </p>

  <div class="demo-stack">
    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">options</span>
      </div>
      <div class="demo-opts">
        <label>
          <span>controlPosition</span>
          <select v-model="controlPosition" class="demo-input" data-qa="opt-controlPosition">
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        </label>

        <label>
          <input v-model="showActionButtons" type="checkbox" data-qa="opt-showActionButtons" />
          showActionButtons
        </label>

        <label>
          <input v-model="editOnAdd" type="checkbox" data-qa="opt-editOnAdd" />
          editOnAdd
        </label>

        <label>
          <input v-model="fieldRemoveWarn" type="checkbox" data-qa="opt-fieldRemoveWarn" />
          fieldRemoveWarn
        </label>

        <label>
          <input v-model="hideHidden" type="checkbox" data-qa="opt-hideHidden" />
          disableFields: Hidden
        </label>

        <label>
          <input v-model="hideButton" type="checkbox" data-qa="opt-hideButton" />
          disableFields: Button
        </label>

        <label>
          <input v-model="disableLabelAttr" type="checkbox" data-qa="opt-disableLabel" />
          disabledAttrs: label
        </label>
      </div>
    </div>

    <div class="preview-window" data-qa="builder-wrapper" :data-qa-position="controlPosition">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">live instance</span>
      </div>
      <div class="preview-window-body">
        <FormBuilder v-model="formData" :options="resolvedOptions()" />
      </div>
    </div>
  </div>
</template>
