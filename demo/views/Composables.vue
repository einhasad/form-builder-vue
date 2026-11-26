<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n, useFieldRegistry, useFormBuilder, useDragDrop, FieldType } from '../../src'
import type { FormDataField } from '../../src'

const i18n = useI18n()
const registry = useFieldRegistry()

/* ── useFormBuilder ─────────────────────────────────────── */
const builder = useFormBuilder()
const builderFieldCount = computed(() => builder.fields.value.length)
const builderSelected = computed(() => builder.selectedFieldId.value ?? 'none')

function addTextField(): void {
  const field: FormDataField = {
    type: 'text',
    label: `Field ${String(builderFieldCount.value + 1)}`,
    name: `text-${String(Date.now())}`,
  }
  builder.addField(field)
}

function removeLastBuilderField(): void {
  const id = builder.internalFields.value.at(-1)?.internalId
  if (id) builder.removeField(id)
}

function clearBuilder(): void {
  builder.clearFields()
}

/* ── useFieldRegistry ───────────────────────────────────── */
const allTypes = computed(() => registry.getAllTypes())
const textDef = computed(() => registry.getDefinition(FieldType.Text))

/* ── useDragDrop ────────────────────────────────────────── */
const drag = useDragDrop()
const simulatedType = ref<FieldType | null>(null)

function simulateDragStart(type: FieldType): void {
  simulatedType.value = type
  const dt = new DataTransfer()
  drag.onControlDragStart(type, new DragEvent('dragstart', { dataTransfer: dt }))
}

function simulateDragEnd(): void {
  simulatedType.value = null
  drag.onControlDragEnd()
}

/* ── useI18n ────────────────────────────────────────────── */
const translationKey = ref('checkbox-group')
const translated = computed(() => i18n.t(translationKey.value))

const frMessages = {
  'checkbox-group': 'Groupe de cases à cocher',
  text: 'Champ de texte',
  save: 'Enregistrer',
  clear: 'Effacer',
}

function switchToFrench(): void {
  i18n.addMessages('fr-FR', frMessages)
  i18n.setLocale('fr-FR')
}
function switchToEnglish(): void {
  i18n.setLocale('en-US')
}
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -->
  <p class="demo-lead">
    Every composable that powers <code>FormBuilder</code> is exported standalone so host apps can
    drive their own UI on top of the same state machine. Each section below is a minimal live
    demo — data flows are identical to how the packaged components use them.
  </p>

  <div class="demo-stack">
    <section id="useFormBuilder" class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useFormBuilder</span>
      </div>
      <div class="preview-window-body">
        <p>
          Returns a reactive form state: the fields array, selection, and a handful of
          mutators (<code>addField</code>, <code>removeField</code>, <code>clearFields</code>).
        </p>
      </div>
      <div class="demo-toolbar">
        <button type="button" class="demo-btn" data-qa="builder-add" @click="addTextField">
          addField (text)
        </button>
        <button type="button" class="demo-btn" data-qa="builder-remove" @click="removeLastBuilderField">
          removeField (last)
        </button>
        <button type="button" class="demo-btn" data-qa="builder-clear" @click="clearBuilder">
          clearFields
        </button>
        <span class="demo-meta" data-qa="builder-count">fields: {{ builderFieldCount }}</span>
        <span class="demo-meta" data-qa="builder-selected">selected: {{ builderSelected }}</span>
      </div>
      <pre class="demo-pre" data-qa="builder-json">{{ JSON.stringify(builder.fields.value, null, 2) }}</pre>
    </section>

    <section id="useFieldRegistry" class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useFieldRegistry</span>
      </div>
      <div class="preview-window-body">
        <p>
          Catalog of every registered control. Use <code>register()</code> to add custom field
          types, <code>getDefinition()</code> to read one, <code>getAllTypes()</code> to list them.
        </p>
      </div>
      <div class="demo-toolbar">
        <span class="demo-meta" data-qa="registry-count">Registered types: {{ allTypes.length }}</span>
      </div>
      <ul class="demo-types" data-qa="registry-types">
        <li v-for="t in allTypes" :key="t" :data-qa="`registry-type-${t}`">{{ t }}</li>
      </ul>
      <pre class="demo-pre" data-qa="registry-text-def">{{ textDef ? JSON.stringify({ type: textDef.type, icon: textDef.icon, layout: textDef.layout ?? 'default' }, null, 2) : 'none' }}</pre>
    </section>

    <section id="useDragDrop" class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useDragDrop</span>
      </div>
      <div class="preview-window-body">
        <p>
          Shared drag state used across the control panel and stage. Handlers update refs like
          <code>draggedType</code> and <code>isDragging</code> so any custom drop target can
          react to the user's pointer without duplicating listeners.
        </p>
      </div>
      <div class="demo-toolbar">
        <button type="button" class="demo-btn" data-qa="drag-start-text" @click="simulateDragStart(FieldType.Text)">
          simulate drag: text
        </button>
        <button type="button" class="demo-btn" data-qa="drag-start-select" @click="simulateDragStart(FieldType.Select)">
          simulate drag: select
        </button>
        <button type="button" class="demo-btn" data-qa="drag-end" @click="simulateDragEnd">
          end drag
        </button>
        <span class="demo-meta" data-qa="drag-active">isDragging: {{ drag.isDragging.value }}</span>
        <span class="demo-meta" data-qa="drag-type">draggedType: {{ simulatedType ?? 'none' }}</span>
      </div>
    </section>

    <section id="useI18n" class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useI18n</span>
      </div>
      <div class="preview-window-body">
        <p>
          Lightweight translator. <code>t()</code> looks up a key in the active locale and
          falls back to the key if missing. <code>addMessages()</code> merges a message bundle;
          <code>setLocale()</code> switches the active locale.
        </p>
      </div>
      <div class="demo-toolbar">
        <label>
          key
          <input v-model="translationKey" data-qa="i18n-key-input" class="demo-input" style="margin-left: 6px" />
        </label>
        <span class="demo-meta" data-qa="i18n-locale">locale: {{ i18n.locale.value }}</span>
        <button type="button" class="demo-btn" data-qa="i18n-to-french" @click="switchToFrench">
          Switch to French
        </button>
        <button type="button" class="demo-btn" data-qa="i18n-to-english" @click="switchToEnglish">
          Switch to English
        </button>
      </div>
      <div class="preview-window-body">
        result: <strong data-qa="i18n-result">{{ translated }}</strong>
      </div>
    </section>
  </div>
  <!-- eslint-enable vue/no-bare-strings-in-template -->
</template>

<style scoped>
.demo-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--ink);
}

section[id] { scroll-margin-top: calc(var(--header-h, 56px) + 12px); }
</style>
