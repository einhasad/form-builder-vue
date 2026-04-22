<script setup lang="ts">
import { ref, computed } from 'vue'
import { FormBuilder, FormRenderer } from '../../src'
import type { FormDataField, UserDataMap } from '../../src'

const formData = ref<FormDataField[]>([])
const previewUserData = ref<UserDataMap>({})

const json = computed(() => JSON.stringify(formData.value, null, 2))
const fieldCount = computed(() => formData.value.length)

type PreviewKey = 'mobile' | 'tablet' | 'desktop'

interface PreviewTarget {
  key: PreviewKey
  label: string
  width: number
}

const PREVIEWS: PreviewTarget[] = [
  { key: 'mobile', label: 'Mobile', width: 375 },
  { key: 'tablet', label: 'Tablet', width: 768 },
  { key: 'desktop', label: 'Desktop', width: 1200 },
]

/**
 * Pick the sensible default preview for the viewer. Prefers the UA's own
 * mobile/tablet hint, otherwise falls back to the closest match for the
 * current viewport width so the first render looks right on a laptop too.
 */
function detectDefaultPreview(): PreviewKey {
  if (typeof window === 'undefined') {
    return 'desktop'
  }
  const ua = navigator.userAgent
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) {
    return 'mobile'
  }
  const w = window.innerWidth
  if (w < 600) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

const activePreview = ref<PreviewKey>(detectDefaultPreview())

const activeTarget = computed<PreviewTarget>(() => {
  return PREVIEWS.find((p) => p.key === activePreview.value) ?? PREVIEWS[2]!
})

function setActive(key: PreviewKey): void {
  activePreview.value = key
}

type PanelSide = 'left' | 'right'

const panelSide = ref<PanelSide>('left')

// Note on `controlPosition`: the library's layout applies `row-reverse` when
// `controlPosition === 'right'`, which ends up visually placing the control
// panel on the **left** (the second slot jumps to the start of the row). The
// mapping below keeps the demo's Left/Right buttons aligned with where the
// user actually sees the panel.
const builderOptions = computed(() => ({
  controlPosition: panelSide.value === 'left' ? ('right' as const) : ('left' as const),
}))

function setPanelSide(side: PanelSide): void {
  panelSide.value = side
}
</script>

<template>
  <!-- eslint-disable vue/no-bare-strings-in-template -->
  <p class="demo-lead">
    Binds an array of field objects via <code>v-model</code>. Drag chips from the control
    panel, reorder on the canvas, and watch the JSON below update in realtime. Drop a
    field on the <strong>left or right edge</strong> of an existing field to share a row —
    rows scale to halves or thirds, and collapse to a single column on mobile.
  </p>

  <div class="demo-stack">
    <div class="preview-window" data-qa="builder-wrapper" :data-panel-side="panelSide">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <div
          class="panel-side-switch"
          role="group"
          aria-label="Add fields panel position"
          data-qa="panel-side-switch"
        >
          <span class="caps panel-side-label">Add fields</span>
          <button
            type="button"
            class="panel-side-btn"
            :class="{ 'is-active': panelSide === 'left' }"
            :aria-pressed="panelSide === 'left'"
            title="Panel on left"
            data-qa="panel-side-left"
            @click="setPanelSide('left')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <rect x="2" y="4" width="7" height="16" rx="1" fill="currentColor" />
              <rect x="11" y="4" width="11" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span>Left</span>
          </button>
          <button
            type="button"
            class="panel-side-btn"
            :class="{ 'is-active': panelSide === 'right' }"
            :aria-pressed="panelSide === 'right'"
            title="Panel on right"
            data-qa="panel-side-right"
            @click="setPanelSide('right')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <rect x="2" y="4" width="11" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
              <rect x="15" y="4" width="7" height="16" rx="1" fill="currentColor" />
            </svg>
            <span>Right</span>
          </button>
        </div>
      </div>
      <div class="preview-window-body">
        <FormBuilder v-model="formData" :options="builderOptions" />
      </div>
      <div class="demo-caption">
        <span data-qa="field-count">Fields: {{ fieldCount }}</span>
      </div>
    </div>

    <div class="preview-window" data-qa="responsive-previews">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">responsive preview</span>
      </div>

      <div class="device-toolbar" data-qa="device-toolbar">
        <div
          class="device-switch"
          role="tablist"
          aria-label="Preview device"
        >
          <button
            v-for="target in PREVIEWS"
            :key="target.key"
            type="button"
            role="tab"
            class="device-btn"
            :class="{ 'is-active': target.key === activePreview }"
            :aria-selected="target.key === activePreview"
            :data-qa="`device-${target.key}`"
            :title="`${target.label} · ${String(target.width)}px`"
            @click="setActive(target.key)"
          >
            <svg
              v-if="target.key === 'mobile'"
              class="device-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <rect x="7" y="2" width="10" height="20" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.5" />
              <line x1="11" y1="18.5" x2="13" y2="18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg
              v-else-if="target.key === 'tablet'"
              class="device-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.5" />
              <line x1="11" y1="18.5" x2="13" y2="18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <svg
              v-else
              class="device-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="13" rx="1.5" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.5" />
              <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <line x1="12" y1="17" x2="12" y2="20" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span class="device-label">{{ target.label }}</span>
            <span class="device-dim">{{ target.width }}px</span>
          </button>
        </div>
      </div>

      <div class="responsive-frame-outer" data-qa="responsive-frame-outer">
        <div
          class="responsive-frame"
          :style="{ width: `${String(activeTarget.width)}px` }"
          :data-preview="activePreview"
          :data-qa="`preview-${activePreview}`"
        >
          <FormRenderer
            v-model="previewUserData"
            :form-data="formData"
          />
          <div
            v-if="formData.length === 0"
            class="responsive-empty"
          >
            Add fields in the builder above to see them rendered here.
          </div>
        </div>
      </div>
    </div>

    <div class="preview-window">
      <div class="preview-chrome">
        <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
        <span style="flex: 1" />
        <span class="caps preview-chrome-label">v-model json</span>
      </div>
      <pre class="demo-pre" data-qa="model-json">{{ json }}</pre>
    </div>
  </div>
  <!-- eslint-enable vue/no-bare-strings-in-template -->
</template>

<style scoped>
.panel-side-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: var(--surface-sunk, #f3f0e8);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 5px;
}

.panel-side-label {
  margin: 0 4px 0 6px;
  color: var(--ink-3, #6e6a63);
  font-size: 10px;
}

.panel-side-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--ink-3, #6e6a63);
  font-family: inherit;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.panel-side-btn:hover { color: var(--ink, #111); }

.panel-side-btn.is-active {
  background: var(--surface, #fff);
  color: var(--ink, #111);
  box-shadow: 0 1px 0 rgba(17, 17, 17, 0.04);
}

.panel-side-btn svg { flex-shrink: 0; }

.device-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line, #e8e4db);
  background: var(--surface, #fff);
}

.device-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--surface-sunk, #f3f0e8);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 6px;
}

.device-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: var(--ink-3, #6e6a63);
  font-family: inherit;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}

.device-btn:hover { color: var(--ink, #111); }

.device-btn.is-active {
  background: var(--surface, #fff);
  color: var(--ink, #111);
  box-shadow: 0 1px 0 rgba(17, 17, 17, 0.04);
}

.device-icon {
  flex-shrink: 0;
  color: currentColor;
}

.device-label {
  font-weight: 500;
  letter-spacing: 0.02em;
}

.device-dim {
  font-size: 10px;
  color: var(--ink-3, #6e6a63);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.device-btn.is-active .device-dim { color: var(--ink-2, #3a3a3a); }

.responsive-frame-outer {
  overflow-x: auto;
  padding: 18px;
  background:
    radial-gradient(circle, rgba(211, 206, 193, 0.4) 1px, transparent 1px) 0 0 / 14px 14px,
    var(--surface-sunk, #f3f0e8);
  display: flex;
  justify-content: center;
}

.responsive-frame {
  background: var(--surface, #fff);
  border: 1px solid var(--line, #e8e4db);
  border-radius: 4px;
  padding: 14px;
  box-shadow: 0 1px 0 rgba(17, 17, 17, 0.04);
  flex-shrink: 0;
  transition: width 220ms ease;
}

.responsive-empty {
  color: var(--ink-3, #6e6a63);
  font-size: 12px;
  padding: 8px 0;
}
</style>
