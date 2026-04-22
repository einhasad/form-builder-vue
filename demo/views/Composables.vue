<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n, useFieldRegistry, FieldType } from '../../src'
import { registerBuiltinControls } from '../../src/components/controls/register'

const i18n = useI18n()
const registry = useFieldRegistry()
registerBuiltinControls(registry.register)

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

/* ── useFieldRegistry ───────────────────────────────────── */
const allTypes = computed(() => registry.getAllTypes())
const textDef = computed(() => registry.getDefinition(FieldType.Text))
</script>

<template>
  <p class="demo-lead">
    Two of the library's composables shown live — translate keys and inspect the control registry.
  </p>

  <div class="demo-stack">
    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useI18n</span>
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
    </div>

    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">useFieldRegistry</span>
      </div>
      <div class="demo-toolbar">
        <span class="demo-meta" data-qa="registry-count">Registered types: {{ allTypes.length }}</span>
      </div>
      <ul class="demo-types" data-qa="registry-types">
        <li v-for="t in allTypes" :key="t" :data-qa="`registry-type-${t}`">{{ t }}</li>
      </ul>
      <pre class="demo-pre" data-qa="registry-text-def">{{ textDef ? JSON.stringify({ type: textDef.type, icon: textDef.icon, layout: textDef.layout ?? 'default' }, null, 2) : 'none' }}</pre>
    </div>
  </div>
</template>

<style scoped>
.demo-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--ink);
}
</style>
