<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, shallowRef, watch, type Component } from 'vue'
import BuilderBasic from './views/BuilderBasic.vue'
import BuilderOptions from './views/BuilderOptions.vue'
import BuilderEvents from './views/BuilderEvents.vue'
import BuilderMethods from './views/BuilderMethods.vue'
import RendererBasic from './views/RendererBasic.vue'
import RendererDisabled from './views/RendererDisabled.vue'
import Composables from './views/Composables.vue'
import Changelog from './views/Changelog.vue'
import { FormBuilder, FormRenderer, FieldType } from '../src'
import type { FormDataField, UserDataMap } from '../src'

/* ── Public assets ──────────────────────────────────────────
 * Files under `public/` are copied verbatim to the build root.
 * `import.meta.env.BASE_URL` is a path like `/` (dev) or
 * `/form-builder-vue/` (GH Pages); prefix directly — DON'T pass it
 * to `new URL(path, base)` because the base there must be absolute.
 */
const logomarkUrl = `${import.meta.env.BASE_URL}logomark.svg`

declare const __APP_VERSION__: string
const appVersion = __APP_VERSION__
const appVersionShort = `v${appVersion.split('.').slice(0, 2).join('.')}`

/* ── State ──────────────────────────────────────────────── */
const searchQuery = ref('')
const copiedBlock = ref('')
const mounted = ref(false)
const currentHash = ref<string>(typeof window === 'undefined' ? '' : window.location.hash)
const activeScrollId = ref<string | null>(null)

/* ── Live demo (auto-script) ───────────────────────────── */
type LiveTab = 'builder' | 'preview' | 'json'

const liveFormData = ref<FormDataField[]>([])
const liveUserData = ref<UserDataMap>({})
const liveTab = ref<LiveTab>('builder')
const liveStopped = ref(false)
const liveTimers: number[] = []
const liveGhosts = new Set<HTMLElement>()
const liveAnimations = new Set<Animation>()

interface ScriptStep {
  /** Control panel label whose chip should fly across (e.g. "Text Field"). */
  controlLabel: string
  /** Field appended to the form when the ghost lands on the stage. */
  field: FormDataField
}

const SCRIPT_STEPS: ScriptStep[] = [
  {
    controlLabel: 'Text Field',
    field: { type: FieldType.Text, subtype: 'text', label: 'Full name', required: true, placeholder: 'Ada Lovelace', className: 'form-control', name: 'full-name' },
  },
  {
    controlLabel: 'Text Field',
    field: { type: FieldType.Text, subtype: 'email', label: 'Email', required: true, placeholder: 'you@example.com', className: 'form-control', name: 'email' },
  },
  {
    controlLabel: 'Select',
    field: { type: FieldType.Select, label: 'Country', className: 'form-control', name: 'country', multiple: false, values: [
      { label: 'United States', value: 'us', selected: false },
      { label: 'Germany', value: 'de', selected: true },
      { label: 'Japan', value: 'jp', selected: false },
    ] },
  },
  {
    controlLabel: 'Checkbox Group',
    field: { type: FieldType.CheckboxGroup, label: 'Interests', className: 'form-control', name: 'interests', toggle: false, inline: false, other: false, values: [
      { label: 'Design', value: 'design', selected: true },
      { label: 'Engineering', value: 'engineering', selected: true },
      { label: 'Product', value: 'product', selected: false },
    ] },
  },
]

// Per-step phase timings (drag sequence)
const APPROACH_MS = 480   // cursor moves from previous spot to chip
const GRAB_MS = 220       // press: chip lifts under cursor
const DRAG_MS = 760       // cursor + chip travel to drop zone
const DROP_MS = 240       // release: real field appears, ghost fades
const STEP_TOTAL_MS = APPROACH_MS + GRAB_MS + DRAG_MS + DROP_MS

let liveCursorEl: HTMLElement | null = null
let liveCursorPos: { x: number; y: number } | null = null

const liveJson = computed(() => JSON.stringify(liveFormData.value, null, 2))

function clearLiveTimers(): void {
  while (liveTimers.length > 0) {
    const id = liveTimers.pop()
    if (id !== undefined) clearTimeout(id)
  }
}

function clearLiveAnimations(): void {
  for (const anim of liveAnimations) anim.cancel()
  liveAnimations.clear()
  for (const ghost of liveGhosts) ghost.remove()
  liveGhosts.clear()
  document.querySelectorAll<HTMLElement>('[data-qa="live-pane-builder"] [data-qa="control-item"].is-fly-source')
    .forEach((el) => { el.classList.remove('is-fly-source') })
  document.querySelectorAll<HTMLElement>('[data-qa="live-pane-builder"] [data-qa="builder-stage"].is-drop-target')
    .forEach((el) => { el.classList.remove('is-drop-target') })
  if (liveCursorEl) {
    liveCursorEl.remove()
    liveCursorEl = null
    liveCursorPos = null
  }
}

function scheduleLive(delay: number, fn: () => void): void {
  if (liveStopped.value) return
  const id = window.setTimeout(() => {
    if (liveStopped.value) return
    fn()
  }, delay)
  liveTimers.push(id)
}

function findControlChip(label: string): HTMLElement | null {
  const chips = document.querySelectorAll<HTMLElement>('[data-qa="live-pane-builder"] [data-qa="control-item"]')
  for (const chip of chips) {
    const text = chip.querySelector('.control-label')?.textContent?.trim()
    if (text === label) return chip
  }
  return null
}

function ensureCursor(initialX: number, initialY: number): HTMLElement {
  if (liveCursorEl) return liveCursorEl
  const el = document.createElement('div')
  el.className = 'live-cursor'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 2 L3.5 17 L7.5 13.5 L10 19.5 L12.5 18.5 L10 12.5 L15.5 12 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  el.style.position = 'fixed'
  el.style.left = '0'
  el.style.top = '0'
  el.style.zIndex = '10000'
  el.style.pointerEvents = 'none'
  el.style.transform = `translate(${String(initialX)}px, ${String(initialY)}px)`
  el.style.opacity = '0'
  document.body.appendChild(el)
  liveCursorEl = el
  liveCursorPos = { x: initialX, y: initialY }
  // Fade in
  const fadeIn = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' })
  liveAnimations.add(fadeIn)
  fadeIn.addEventListener('finish', () => { liveAnimations.delete(fadeIn) })
  return el
}

function moveCursor(toX: number, toY: number, duration: number, easing: string): void {
  const cur = liveCursorEl
  if (!cur || !liveCursorPos) return
  const fromX = liveCursorPos.x
  const fromY = liveCursorPos.y
  const anim = cur.animate(
    [
      { transform: `translate(${String(fromX)}px, ${String(fromY)}px)` },
      { transform: `translate(${String(toX)}px, ${String(toY)}px)` },
    ],
    { duration, easing, fill: 'forwards' },
  )
  liveAnimations.add(anim)
  anim.addEventListener('finish', () => { liveAnimations.delete(anim) })
  liveCursorPos = { x: toX, y: toY }
}

/**
 * Drag a chip from the panel to the stage. The sequence is:
 *   1. cursor approaches the chip (APPROACH_MS)
 *   2. cursor "presses" — chip lifts under it (GRAB_MS)
 *   3. cursor + ghost chip travel to the stage (DRAG_MS)
 *   4. release — field is appended, ghost fades, stage un-highlights (DROP_MS)
 */
function flyAndAddField(step: ScriptStep): void {
  if (liveStopped.value) return
  const source = findControlChip(step.controlLabel)
  const stage = document.querySelector<HTMLElement>('[data-qa="live-pane-builder"] [data-qa="builder-stage"]')
  if (!source || !stage) {
    liveFormData.value = [...liveFormData.value, step.field]
    return
  }

  const sourceRect = source.getBoundingClientRect()
  const stageRect = stage.getBoundingClientRect()
  const sx = sourceRect.left + sourceRect.width / 2
  const sy = sourceRect.top + sourceRect.height / 2
  // Drop point: just inside the stage (last existing card area)
  const tx = stageRect.left + stageRect.width / 2
  const ty = stageRect.bottom - Math.min(40, stageRect.height * 0.18)

  // Spawn cursor near the chip on first use, then it persists across steps.
  if (!liveCursorEl) {
    ensureCursor(sourceRect.left - 60, sourceRect.top - 30)
  }

  // Phase 1: cursor approaches the chip
  moveCursor(sx + 6, sy + 6, APPROACH_MS, 'cubic-bezier(0.22, 1, 0.36, 1)')

  // Phase 2: grab — chip lifts in place under cursor; ghost is attached
  scheduleLive(APPROACH_MS, () => {
    const cur = liveCursorEl
    if (cur) cur.classList.add('is-grabbing')
    source.classList.add('is-fly-source')
    const ghost = source.cloneNode(true) as HTMLElement
    ghost.classList.add('live-fly-ghost')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.style.position = 'fixed'
    ghost.style.left = `${String(sx)}px`
    ghost.style.top = `${String(sy)}px`
    ghost.style.width = `${String(sourceRect.width)}px`
    ghost.style.height = `${String(sourceRect.height)}px`
    ghost.style.margin = '0'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    ghost.style.transformOrigin = '50% 50%'
    document.body.appendChild(ghost)
    liveGhosts.add(ghost)

    // Press animation: ghost lifts slightly with shadow, settling under cursor.
    const press = ghost.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', boxShadow: '0 4px 10px rgba(17,17,17,0.08)' },
        { transform: 'translate(-50%, -50%) scale(1.04)', boxShadow: '0 14px 30px rgba(17,17,17,0.22), 0 2px 6px rgba(17,17,17,0.12)' },
      ],
      { duration: GRAB_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    )
    liveAnimations.add(press)
    press.addEventListener('finish', () => { liveAnimations.delete(press) })

    // Phase 3: drag — cursor and ghost slide together to the drop point.
    const dragTimer = window.setTimeout(() => {
      if (liveStopped.value) return
      stage.classList.add('is-drop-target')
      moveCursor(tx + 6, ty + 6, DRAG_MS, 'cubic-bezier(0.4, 0.05, 0.55, 0.95)')
      const drag = ghost.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1.04)' },
          { transform: `translate(calc(-50% + ${String((tx - sx) * 0.5)}px), calc(-50% + ${String((ty - sy) * 0.5)}px)) scale(1.04) rotate(-1.5deg)`, offset: 0.5 },
          { transform: `translate(calc(-50% + ${String(tx - sx)}px), calc(-50% + ${String(ty - sy)}px)) scale(1.02) rotate(0deg)` },
        ],
        { duration: DRAG_MS, easing: 'cubic-bezier(0.4, 0.05, 0.55, 0.95)', fill: 'forwards' },
      )
      liveAnimations.add(drag)
      drag.addEventListener('finish', () => { liveAnimations.delete(drag) })
    }, GRAB_MS)
    liveTimers.push(dragTimer)

    // Phase 4: drop — append field, fade ghost, un-grab cursor, un-highlight stage.
    const dropTimer = window.setTimeout(() => {
      if (liveStopped.value) {
        ghost.remove()
        liveGhosts.delete(ghost)
        return
      }
      liveFormData.value = [...liveFormData.value, step.field]
      stage.classList.remove('is-drop-target')
      if (cur) cur.classList.remove('is-grabbing')
      source.classList.remove('is-fly-source')
      const fade = ghost.animate(
        [
          { transform: `translate(calc(-50% + ${String(tx - sx)}px), calc(-50% + ${String(ty - sy)}px)) scale(1.02)`, opacity: 1 },
          { transform: `translate(calc(-50% + ${String(tx - sx)}px), calc(-50% + ${String(ty - sy + 6)}px)) scale(0.92)`, opacity: 0 },
        ],
        { duration: DROP_MS, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' },
      )
      liveAnimations.add(fade)
      fade.addEventListener('finish', () => {
        liveAnimations.delete(fade)
        ghost.remove()
        liveGhosts.delete(ghost)
      })
    }, GRAB_MS + DRAG_MS)
    liveTimers.push(dropTimer)
  })
}

function runLiveScript(): void {
  if (liveStopped.value) return
  const TAB_GAP = 2100

  scheduleLive(0, () => { liveTab.value = 'builder'; liveFormData.value = [] })
  let elapsed = 700
  for (const step of SCRIPT_STEPS) {
    const captured = step
    scheduleLive(elapsed, () => { flyAndAddField(captured) })
    elapsed += STEP_TOTAL_MS + 240
  }
  elapsed += 600
  scheduleLive(elapsed, () => { liveTab.value = 'preview' })
  elapsed += TAB_GAP
  scheduleLive(elapsed, () => { liveTab.value = 'json' })
  elapsed += TAB_GAP
  scheduleLive(elapsed, () => { liveTab.value = 'builder' })
}

function onLiveDemoEnter(): void {
  if (liveStopped.value) return
  liveStopped.value = true
  clearLiveTimers()
  clearLiveAnimations()
  liveTab.value = 'builder'
  liveFormData.value = []
  liveUserData.value = {}
}

function selectLiveTab(tab: LiveTab): void {
  // Manual click also halts the script (user took control).
  if (!liveStopped.value) {
    liveStopped.value = true
    clearLiveTimers()
    clearLiveAnimations()
  }
  liveTab.value = tab
}

interface NavItem {
  /** Link label shown in the sidebar. */
  label: string
  /** Either an anchor like `#quickstart` or a hash route like `#/examples/builder-basic`. */
  target: string
  /** Optional element id to scroll to on the destination page (for sub-sections within a route). */
  scrollTo?: string
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Getting started',
    items: [
      { label: 'Introduction', target: '#introduction' },
      { label: 'Installation', target: '#installation' },
      { label: 'Quickstart', target: '#quickstart' },
    ],
  },
  {
    section: 'Form builder',
    items: [
      { label: 'FormBuilder', target: '#/examples/builder-basic' },
      { label: 'Field types', target: '#field-types' },
      { label: 'BuilderOptions', target: '#/examples/builder-options' },
      { label: 'Events', target: '#/examples/builder-events' },
      { label: 'Exposed methods', target: '#/examples/builder-methods' },
    ],
  },
  {
    section: 'Form renderer',
    items: [
      { label: 'FormRenderer', target: '#/examples/renderer-basic' },
      { label: 'RendererOptions', target: '#/examples/renderer-disabled' },
      { label: 'v-model shape', target: '#form-renderer' },
    ],
  },
  {
    section: 'Composables',
    items: [
      { label: 'useFormBuilder', target: '#/examples/composables', scrollTo: 'useFormBuilder' },
      { label: 'useFieldRegistry', target: '#/examples/composables', scrollTo: 'useFieldRegistry' },
      { label: 'useDragDrop', target: '#/examples/composables', scrollTo: 'useDragDrop' },
      { label: 'useI18n', target: '#/examples/composables', scrollTo: 'useI18n' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { label: 'FormDataField', target: '#formbuilder-props' },
      { label: 'UserDataMap', target: '#form-renderer' },
      { label: 'FieldType enum', target: '#field-types' },
      { label: 'Changelog', target: '#/changelog' },
    ],
  },
]

interface ExampleRoute {
  hash: string
  title: string
  component: Component
}

const EXAMPLE_ROUTES: ExampleRoute[] = [
  { hash: '#/examples/builder-basic', title: 'FormBuilder · basic v-model', component: BuilderBasic },
  { hash: '#/examples/builder-options', title: 'FormBuilder · options', component: BuilderOptions },
  { hash: '#/examples/builder-events', title: 'FormBuilder · events', component: BuilderEvents },
  { hash: '#/examples/builder-methods', title: 'FormBuilder · exposed methods', component: BuilderMethods },
  { hash: '#/examples/renderer-basic', title: 'FormRenderer · basic', component: RendererBasic },
  { hash: '#/examples/renderer-disabled', title: 'FormRenderer · disabled', component: RendererDisabled },
  { hash: '#/examples/composables', title: 'Composables', component: Composables },
  { hash: '#/changelog', title: 'Changelog', component: Changelog },
]

const activeExample = computed<ExampleRoute | null>(() => {
  return EXAMPLE_ROUTES.find((r) => r.hash === currentHash.value) ?? null
})

function isLinkActive(item: NavItem): boolean {
  // Hash routes become "active" when the current hash matches exactly. When
  // several sidebar items share a route (e.g. the composables) and disambiguate
  // via `scrollTo`, the item whose `scrollTo` matches `activeScrollId` wins;
  // otherwise the first item in that group is active.
  if (!item.target.startsWith('#/') || currentHash.value !== item.target) return false
  const siblings: NavItem[] = []
  for (const sec of NAV) {
    for (const it of sec.items) {
      if (it.target === item.target) siblings.push(it)
    }
  }
  if (siblings.length <= 1) return true
  const matched = siblings.find((it) => it.scrollTo && it.scrollTo === activeScrollId.value)
  if (matched) return matched === item
  return siblings[0] === item
}

function onSidebarClick(item: NavItem, event: MouseEvent): void {
  if (item.target.startsWith('#/')) {
    event.preventDefault()
    const sameRoute = window.location.hash === item.target
    if (!sameRoute) {
      window.location.hash = item.target
    }
    currentHash.value = item.target
    activeScrollId.value = item.scrollTo ?? null
    if (item.scrollTo) {
      void nextTick(() => {
        document.getElementById(item.scrollTo ?? '')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return
  }
  // Docs anchor clicked while an example route is active: the article is
  // `v-else`'d out, so the browser's native scroll-to-anchor lands on nothing.
  // Render docs first, then scroll manually once Vue has mounted the target.
  if (activeExample.value && item.target.length > 1 && item.target.startsWith('#')) {
    event.preventDefault()
    if (window.location.hash !== item.target) {
      window.location.hash = item.target
    }
    currentHash.value = item.target
    void nextTick(() => {
      document.getElementById(item.target.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
    return
  }
  // Plain docs anchor click within the docs page — browser handles the jump,
  // and the `html { scroll-behavior: smooth }` rule makes it animate.
}

function goToDocs(): void {
  currentHash.value = ''
  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const FIELD_TYPES = [
  { id: 'text', label: 'Text', desc: 'Single-line text input' },
  { id: 'number', label: 'Number', desc: 'Numeric input with min/max' },
  { id: 'date', label: 'Date', desc: 'Date picker' },
  { id: 'select', label: 'Select', desc: 'Dropdown with options' },
  { id: 'checkbox-group', label: 'Checkbox Group', desc: 'Multi-select checkboxes' },
  { id: 'radio-group', label: 'Radio Group', desc: 'Single-select radio buttons' },
  { id: 'checkbox', label: 'Checkbox', desc: 'Boolean toggle' },
  { id: 'textarea', label: 'Text Area', desc: 'Multi-line text input' },
  { id: 'file', label: 'File Upload', desc: 'File attachment' },
  { id: 'autocomplete', label: 'Autocomplete', desc: 'Search + pick from list' },
  { id: 'button', label: 'Button', desc: 'Action trigger' },
  { id: 'header', label: 'Header', desc: 'Section heading (h1-h6)' },
  { id: 'paragraph', label: 'Paragraph', desc: 'Static content block' },
  { id: 'hidden', label: 'Hidden', desc: 'Non-visible field value' },
]

const QUICKSTART_CODE = `<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@einhasad-vue/form-builder-vue'
import type { FormDataField } from '@einhasad-vue/form-builder-vue'

const formData = ref<FormDataField[]>([])

function onSave(payload: { formData: FormDataField[] }) {
  fetch('/api/forms', {
    method: 'POST',
    body: JSON.stringify(payload.formData),
  })
}
<\/script>

<template>
  <FormBuilder v-model="formData" @save="onSave" />
</template>`

const RENDERER_CODE = `<script setup lang="ts">
import { ref } from 'vue'
import { FormRenderer } from '@einhasad-vue/form-builder-vue'
import type { FormDataField, UserDataMap } from '@einhasad-vue/form-builder-vue'

const formData = ref<FormDataField[]>([ /* loaded from API */ ])
const userData = ref<UserDataMap>({})
<\/script>

<template>
  <FormRenderer :form-data="formData" v-model="userData" />
</template>`

const PROPS_ROWS = [
  ['modelValue', 'FormDataField[]', '[]', 'Form fields bound via v-model.'],
  ['options', 'Partial<BuilderOptions>', '{}', 'Configuration overrides.'],
]

const EVENTS_ROWS = [
  ['update:modelValue', 'FormDataField[]', 'Fields changed.'],
  ['field-added', '{ fieldId, field }', 'A field was added to the stage.'],
  ['field-removed', '{ fieldId, field }', 'A field was removed.'],
  ['field-updated', '{ fieldId, field }', 'A field attribute changed.'],
  ['field-moved', '{ fieldId, fromIndex, toIndex }', 'A field was reordered via drag.'],
  ['save', '{ formData }', 'User clicked the save button.'],
  ['clear', '\u2014', 'All fields were cleared.'],
]

const OPTIONS_ROWS = [
  ['controlPosition', "'left' | 'right'", "'left'", 'Which side the control panel sits on.'],
  ['disableFields', 'FieldType[]', '[]', 'Field types to omit from the panel.'],
  ['showActionButtons', 'boolean', 'true', 'Show Save / Clear action bar.'],
  ['disabledAttrs', 'string[]', '[]', 'Attributes to hide in edit panel.'],
  ['editOnAdd', 'boolean', 'false', 'Auto-open edit panel on field add.'],
  ['fieldRemoveWarn', 'boolean', 'false', 'Confirm dialog before field removal.'],
]

function copyText(text: string, id: string) {
  void navigator.clipboard?.writeText(text)
  copiedBlock.value = id
  setTimeout(() => { copiedBlock.value = '' }, 1400)
}

/* ── Search (Fuse.js via CDN, see index.html) ───────────── */
interface FuseSearchResult<T> { item: T }
interface FuseInstance<T> { search: (pattern: string) => FuseSearchResult<T>[] }
interface FuseOptions<T> {
  keys?: (keyof T & string)[]
  threshold?: number
  ignoreLocation?: boolean
  minMatchCharLength?: number
}
type FuseCtor = new <T>(items: readonly T[], options?: FuseOptions<T>) => FuseInstance<T>

declare global {
  interface Window { Fuse?: FuseCtor }
}

interface SearchItem {
  label: string
  section: string
  target: string
}

const searchItems = computed<SearchItem[]>(() => {
  const items: SearchItem[] = []
  for (const sec of NAV) {
    for (const it of sec.items) {
      items.push({ label: it.label, section: sec.section, target: it.target })
    }
  }
  for (const ft of FIELD_TYPES) {
    items.push({ label: ft.label, section: 'Field types', target: '#field-types' })
  }
  return items
})

const fuseIndex = shallowRef<FuseInstance<SearchItem> | null>(null)
const searchFocused = ref(false)
const searchHighlight = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)

const searchResults = computed<SearchItem[]>(() => {
  const q = searchQuery.value.trim()
  if (!q) return []
  if (fuseIndex.value) {
    return fuseIndex.value.search(q).slice(0, 8).map((r) => r.item)
  }
  const lc = q.toLowerCase()
  return searchItems.value
    .filter((it) => it.label.toLowerCase().includes(lc) || it.section.toLowerCase().includes(lc))
    .slice(0, 8)
})

const showSearchDropdown = computed(() => searchFocused.value && searchResults.value.length > 0)

watch(searchResults, () => { searchHighlight.value = 0 })

function onSearchFocus(): void {
  searchFocused.value = true
}

function onSearchBlur(): void {
  // Delay so mousedown on a result can fire before the dropdown unmounts.
  setTimeout(() => { searchFocused.value = false }, 150)
}

function selectSearchResult(item: SearchItem): void {
  if (window.location.hash === item.target) {
    const el = document.getElementById(item.target.replace(/^#/, ''))
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  } else {
    window.location.hash = item.target
  }
  searchQuery.value = ''
  searchFocused.value = false
  searchInputRef.value?.blur()
}

function onSearchKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    searchQuery.value = ''
    searchInputRef.value?.blur()
    return
  }
  if (!showSearchDropdown.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    searchHighlight.value = Math.min(searchHighlight.value + 1, searchResults.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    searchHighlight.value = Math.max(searchHighlight.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = searchResults.value[searchHighlight.value]
    if (item) selectSearchResult(item)
  }
}

function onGlobalKey(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  }
}

function onHashChange(): void {
  currentHash.value = window.location.hash
}

onMounted(() => {
  void nextTick(() => { mounted.value = true })

  currentHash.value = window.location.hash
  window.addEventListener('hashchange', onHashChange)

  // Kick off the live-demo script after the page settles.
  scheduleLive(700, () => { runLiveScript() })

  if (window.Fuse) {
    fuseIndex.value = new window.Fuse(searchItems.value, {
      keys: ['label', 'section'],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  }
  window.addEventListener('keydown', onGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange)
  window.removeEventListener('keydown', onGlobalKey)
  clearLiveTimers()
  clearLiveAnimations()
})
</script>

<template>
  <div class="fc page-root" :class="{ 'is-mounted': mounted }">
    <!-- ── SVG Sprite ─────────────────────────────────────── -->
    <svg xmlns="http://www.w3.org/2000/svg" style="display: none">
      <symbol id="fc-text" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 6V5h12v1" /><path d="M10 5v10" /><path d="M8 15h4" />
      </symbol>
      <symbol id="fc-number" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 4L5.5 16" /><path d="M14.5 4L13 16" /><path d="M4 8h13" /><path d="M3 12h13" />
      </symbol>
      <symbol id="fc-date" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="14" height="12" rx="1.5" /><path d="M7 3v3" /><path d="M13 3v3" /><path d="M3 9h14" />
      </symbol>
      <symbol id="fc-select" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="14" height="10" rx="1.5" /><path d="M8 9l2 2 2-2" />
      </symbol>
      <symbol id="fc-checkbox-group" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="6" height="6" rx="1" /><path d="M4.5 6l1.2 1.2L7.5 5.2" /><rect x="3" y="11" width="6" height="6" rx="1" /><path d="M11 5h6" /><path d="M11 14h6" />
      </symbol>
      <symbol id="fc-radio-group" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="6" r="3" /><circle cx="6" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="6" cy="14" r="3" /><path d="M11 5h6" /><path d="M11 14h6" />
      </symbol>
      <symbol id="fc-checkbox" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="4" width="12" height="12" rx="1.5" /><path d="M6.5 10l2.5 2.5 5-5" />
      </symbol>
      <symbol id="fc-textarea" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="14" height="12" rx="1.5" /><path d="M6 8h8" /><path d="M6 11h8" /><path d="M6 14h4" />
      </symbol>
      <symbol id="fc-file" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 3h5l4 4v9a1.5 1.5 0 01-1.5 1.5h-7.5A1.5 1.5 0 014.5 16V4.5A1.5 1.5 0 016 3z" /><path d="M11 3v4h4" />
      </symbol>
      <symbol id="fc-autocomplete" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="9" r="5" /><path d="M13 13l3 3" /><path d="M7 9h4" />
      </symbol>
      <symbol id="fc-button" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="6" width="14" height="8" rx="2" /><path d="M7 10h6" />
      </symbol>
      <symbol id="fc-header" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 4v12" /><path d="M12 4v12" /><path d="M5 10h7" /><path d="M15 7l1.5-1v10" />
      </symbol>
      <symbol id="fc-paragraph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 5h12" /><path d="M4 9h12" /><path d="M4 13h12" /><path d="M4 17h8" />
      </symbol>
      <symbol id="fc-hidden" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10s2.5-5 7-5c1.5 0 2.8.5 3.9 1.2" /><path d="M17 10s-2.5 5-7 5c-1.5 0-2.8-.5-3.9-1.2" /><path d="M3 3l14 14" /><circle cx="10" cy="10" r="2" />
      </symbol>
    </svg>

    <!-- ── Header ─────────────────────────────────────────── -->
    <header class="hdr">
      <div class="hdr-inner">
        <a href="#" class="hdr-brand" @click.prevent>
          <img :src="logomarkUrl" width="22" height="22" alt="Formcraft" />
          <span class="hdr-brand-name">Formcraft</span>
          <span class="hdr-version">v{{ appVersion }}</span>
        </a>
        <nav class="hdr-nav">
          <a
            href="#"
            class="hdr-nav-item"
            :class="{ 'is-active': !activeExample }"
            data-qa="header-docs-link"
            @click.prevent="goToDocs"
          >Docs</a>
          <a
            href="#/examples/builder-basic"
            class="hdr-nav-item"
            :class="{ 'is-active': currentHash.startsWith('#/examples/') }"
            data-qa="header-examples-link"
          >Examples</a>
          <a
            href="#/changelog"
            class="hdr-nav-item"
            :class="{ 'is-active': currentHash === '#/changelog' }"
            data-qa="header-changelog-link"
          >Changelog</a>
        </nav>
        <div style="flex: 1" />
        <div class="hdr-search">
          <svg class="hdr-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="9" cy="9" r="5" /><path d="M13 13l3 3" />
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search docs..."
            class="hdr-search-input"
            data-qa="hdr-search-input"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
            @keydown="onSearchKeydown"
          />
          <kbd class="hdr-search-kbd">&#x2318;K</kbd>
          <ul
            v-if="showSearchDropdown"
            class="hdr-search-results"
            data-qa="hdr-search-results"
          >
            <li
              v-for="(r, i) in searchResults"
              :key="`${r.target}-${r.label}`"
              class="hdr-search-result"
              :class="{ 'is-highlight': i === searchHighlight }"
              data-qa="hdr-search-result"
              @mouseenter="searchHighlight = i"
              @mousedown.prevent="selectSearchResult(r)"
            >
              <span class="hdr-search-result-label">{{ r.label }}</span>
              <span class="hdr-search-result-section">{{ r.section }}</span>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <!-- ── Shell ───────────────────────────────────────────── -->
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div v-for="sec in NAV" :key="sec.section" class="sidebar-group">
          <div class="sidebar-heading caps">{{ sec.section }}</div>
          <ul class="sidebar-list">
            <li v-for="item in sec.items" :key="`${sec.section}-${item.label}`">
              <a
                :href="item.target"
                class="sidebar-link"
                :class="{ 'is-active': isLinkActive(item) }"
                :data-qa="`sidebar-${item.label.replace(/\s+/g, '-').toLowerCase()}`"
                @click="onSidebarClick(item, $event)"
              >{{ item.label }}</a>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main -->
      <main class="main">
        <div class="content-grid">
          <article class="article" :class="{ 'is-wide': !!activeExample }">

            <!-- ════ Active example (hash-routed) ════ -->
            <section v-if="activeExample" class="example-pane" data-qa="example-pane">
              <div class="example-header">
                <div class="caps example-crumb">{{ activeExample.hash === '#/changelog' ? 'Release notes' : 'Examples' }}</div>
                <h1 class="example-title" data-qa="example-title">{{ activeExample.title }}</h1>
              </div>
              <component :is="activeExample.component" />
            </section>

            <template v-else>

            <!-- ════ Hero (live demo) ════ -->
            <section class="hero hero--demo" id="live-demo">
              <div class="hero-inner hero-inner--wide">
                <div class="hero-pill anim-rise" style="--d: 0">
                  <span class="hero-pill-tag">{{ appVersionShort }}</span>
                  <span>Initial release &mdash; Vue&nbsp;3.5+</span>
                </div>

                <p class="hero-lede anim-rise" style="--d: 1">
                  A Vue&nbsp;3 form builder you can actually reason about.<br class="hide-mobile" />
                  14 field types, v-model on both ends, fully typed, zero&nbsp;jQuery.
                </p>

                <div
                  class="preview-window live-demo anim-rise"
                  style="--d: 2"
                  data-qa="live-demo"
                  @mouseenter="onLiveDemoEnter"
                >
                  <div class="preview-chrome live-demo-chrome">
                    <span class="preview-dot" /><span class="preview-dot" /><span class="preview-dot" />
                    <div class="live-tabs" role="tablist" aria-label="Live demo views">
                      <button
                        v-for="tab in (['builder', 'preview', 'json'] as const)"
                        :key="tab"
                        type="button"
                        role="tab"
                        class="live-tab"
                        :class="{ 'is-active': liveTab === tab }"
                        :aria-selected="liveTab === tab"
                        :data-qa="`live-tab-${tab}`"
                        @click="selectLiveTab(tab)"
                      >{{ tab === 'json' ? 'JSON' : tab === 'builder' ? 'Builder' : 'Preview' }}</button>
                    </div>
                    <span style="flex: 1" />
                    <span class="caps preview-chrome-label">{{ liveStopped ? 'live demo' : 'auto-playing' }}</span>
                  </div>

                  <div v-show="liveTab === 'builder'" class="live-pane" data-qa="live-pane-builder">
                    <FormBuilder v-model="liveFormData" />
                  </div>
                  <div v-show="liveTab === 'preview'" class="live-pane live-pane--padded" data-qa="live-pane-preview">
                    <FormRenderer
                      v-model="liveUserData"
                      :form-data="liveFormData"
                    />
                    <div v-if="liveFormData.length === 0" class="live-empty">
                      No fields yet &mdash; add some in the builder.
                    </div>
                  </div>
                  <div v-show="liveTab === 'json'" class="live-pane" data-qa="live-pane-json">
                    <pre class="demo-pre live-json">{{ liveJson }}</pre>
                  </div>
                </div>

              </div>
            </section>

            <!-- ════ Introduction ════ -->
            <section class="section" id="introduction">
              <h2 class="section-title">Introduction</h2>
              <p class="intro-lede">
                Formcraft wraps <code>@einhasad-vue/form-builder-vue</code> &mdash; a drag-and-drop form builder for Vue&nbsp;3.
                Drop it in, bind an array, save the JSON.
              </p>
              <p>
                The library ships two components: <code>FormBuilder</code> (the drag-and-drop composer)
                and <code>FormRenderer</code> (renders saved JSON into an answerable form).
                Both use <code>v-model</code>, both are fully typed, and neither depends on jQuery.
              </p>

              <div class="callout callout--note">
                <span class="callout-badge">&thinsp;i&thinsp;</span>
                <div class="callout-body">
                  <strong>Stable, but young.</strong>
                  v0.1 is a ground-up Vue&nbsp;3 port of the original jQuery formBuilder.
                  API surface is intentionally narrow &mdash; prefer the composables for custom behaviour
                  rather than patching the library.
                </div>
              </div>
            </section>

            <!-- ════ Installation ════ -->
            <section class="section" id="installation">
              <h2 class="section-title">Installation</h2>
              <div class="codeblock codeblock--compact">
                <pre><code>npm install @einhasad-vue/form-builder-vue</code></pre>
                <button class="codeblock-copy" @click="copyText('npm install @einhasad-vue/form-builder-vue', 'inst')">
                  {{ copiedBlock === 'inst' ? 'copied' : 'copy' }}
                </button>
              </div>
              <p>Vue 3.5 or newer is required as a peer dependency.</p>
            </section>

            <!-- ════ Quickstart ════ -->
            <section class="section" id="quickstart">
              <h2 class="section-title">Quickstart</h2>
              <p>
                Bind an array via <code>v-model</code>.
                The builder handles field creation, edits, and reordering &mdash; you get a JSON array out.
              </p>
              <div class="codeblock">
                <div class="codeblock-bar">
                  <span class="codeblock-filename">FormBuilderDemo.vue</span>
                  <span class="codeblock-lang caps">vue</span>
                </div>
                <div class="codeblock-body">
                  <pre><code>{{ QUICKSTART_CODE }}</code></pre>
                  <button class="codeblock-copy" @click="copyText(QUICKSTART_CODE, 'qs')">
                    {{ copiedBlock === 'qs' ? 'copied' : 'copy' }}
                  </button>
                </div>
              </div>
            </section>

            <!-- ════ Form Renderer ════ -->
            <section class="section" id="form-renderer">
              <h2 class="section-title">Form renderer</h2>
              <p>
                Given a <code>FormDataField[]</code> and an empty <code>UserDataMap</code>,
                the renderer produces the filled-in form.
              </p>
              <div class="codeblock">
                <div class="codeblock-bar">
                  <span class="codeblock-filename">FormRendererDemo.vue</span>
                  <span class="codeblock-lang caps">vue</span>
                </div>
                <div class="codeblock-body">
                  <pre><code>{{ RENDERER_CODE }}</code></pre>
                  <button class="codeblock-copy" @click="copyText(RENDERER_CODE, 'rend')">
                    {{ copiedBlock === 'rend' ? 'copied' : 'copy' }}
                  </button>
                </div>
              </div>
            </section>

            <!-- ════ Props ════ -->
            <section class="section" id="formbuilder-props">
              <h2 class="section-title">FormBuilder props</h2>
              <div class="api-table-wrap">
                <table class="api-table">
                  <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr v-for="(r, i) in PROPS_ROWS" :key="i">
                      <td><code class="prop-name">{{ r[0] }}</code></td>
                      <td><code>{{ r[1] }}</code></td>
                      <td><code>{{ r[2] }}</code></td>
                      <td class="td-desc">{{ r[3] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- ════ Events ════ -->
            <section class="section" id="events">
              <h2 class="section-title">Events</h2>
              <div class="api-table-wrap">
                <table class="api-table">
                  <thead><tr><th>Event</th><th>Payload</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr v-for="(r, i) in EVENTS_ROWS" :key="i">
                      <td><code class="prop-name">{{ r[0] }}</code></td>
                      <td><code>{{ r[1] }}</code></td>
                      <td class="td-desc">{{ r[2] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- ════ Options ════ -->
            <section class="section" id="options">
              <h2 class="section-title">BuilderOptions</h2>
              <p>
                Pass <code>options</code> to hide field types, swap the control panel to the right,
                or disable specific attributes in the edit panel.
              </p>
              <div class="api-table-wrap">
                <table class="api-table">
                  <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr v-for="(r, i) in OPTIONS_ROWS" :key="i">
                      <td><code class="prop-name">{{ r[0] }}</code></td>
                      <td><code>{{ r[1] }}</code></td>
                      <td><code>{{ r[2] }}</code></td>
                      <td class="td-desc">{{ r[3] }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- ════ Field Types ════ -->
            <section class="section" id="field-types">
              <h2 class="section-title">Field types</h2>
              <p>
                Fourteen built-in field types via the <code>FieldType</code> enum.
                Each registers a control definition at builder mount.
              </p>
              <div class="field-grid">
                <div
                  v-for="(f, idx) in FIELD_TYPES"
                  :key="f.id"
                  class="field-card"
                  :style="{ '--i': idx }"
                >
                  <div class="field-card-icon">
                    <svg width="22" height="22"><use :href="`#fc-${f.id}`" /></svg>
                  </div>
                  <div class="field-card-info">
                    <div class="field-card-label">{{ f.label }}</div>
                    <div class="field-card-meta">
                      <code>{{ f.id }}</code>
                      <span class="field-card-sep">&middot;</span>
                      <span>{{ f.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Tip callout -->
            <div class="callout callout--tip">
              <span class="callout-badge callout-badge--tip">&#x2713;</span>
              <div class="callout-body">
                <strong style="color: var(--success)">Need a custom field type?</strong>
                Call <code>useFieldRegistry().register(def, component)</code> before mounting.
                Registered types appear in the control panel alongside the built-ins.
              </div>
            </div>

            <!-- ════ Footer ════ -->
            <footer class="page-footer">
              <span>Last updated <time datetime="2026-04-20">April 20, 2026</time></span>
            </footer>

            </template>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* ================================================================
   Formcraft Docs — Styles
   Uses tokens from /demo/assets/colors_and_type.css (loaded in index.html)
   ================================================================ */

/* ── Reset & Base ──────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; }
html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px;
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

/* ── Example pane (hash-routed) ───────────────────────── */
.example-pane {
  padding: var(--space-7) 0 var(--space-9);
}

.example-header {
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: var(--border);
}

.example-crumb {
  color: var(--ink-3);
  font-size: 11px;
  margin-bottom: 6px;
}

.example-title {
  font-size: 26px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
  letter-spacing: -0.015em;
}

/* ── Example view helpers (used by /#/examples/* pages) ── */
.demo-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.preview-window-body {
  padding: 16px;
  background: var(--paper);
}

.demo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: var(--border);
  background: var(--surface-sunk);
}

.demo-meta {
  font-size: 12px;
  color: var(--ink-3);
}

.demo-btn {
  font: inherit;
  font-size: 13px;
  padding: 6px 12px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: border-color var(--dur-hover) var(--ease),
              background var(--dur-hover) var(--ease);
}
.demo-btn:hover { border-color: var(--ink); }
.demo-btn.primary {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}
.demo-btn.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.demo-pre {
  margin: 0;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  background: var(--surface-sunk);
  color: var(--ink);
  max-height: 280px;
  overflow: auto;
  white-space: pre;
}

.demo-log {
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.55;
  background: #0e1116;
  color: #e4f0ff;
  max-height: 260px;
  overflow: auto;
}
.demo-log strong { color: #ffd166; font-weight: 600; }
.demo-log-empty { color: #8899aa; font-style: italic; }

.demo-opts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px 18px;
  padding: 14px 16px;
  font-size: 13px;
  background: var(--paper);
}
.demo-opts label { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); }

.demo-input {
  font: inherit;
  font-size: 13px;
  padding: 5px 8px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--ink);
}
textarea.demo-input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  min-height: 72px;
}

.demo-caption {
  padding: 10px 16px;
  font-size: 12px;
  color: var(--ink-3);
  background: var(--surface-sunk);
  border-top: var(--border);
}

.demo-types {
  list-style: none;
  padding: 12px 14px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: var(--paper);
}
.demo-types li {
  background: var(--surface-sunk);
  border: var(--border);
  border-radius: var(--radius-xs);
  padding: 3px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--ink-2);
}

.demo-lead {
  margin: 0 0 var(--space-4);
  color: var(--ink-2);
  font-size: 14.5px;
  line-height: var(--lh-body);
}

.page-root {
  min-height: 100vh;
  background: var(--paper);
  overflow-x: hidden;
}

/* ── Entrance Animations ──────────────────────────────── */
.anim-rise {
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--d, 0) * 100ms + 100ms);
}

.is-mounted .anim-rise {
  opacity: 1;
  transform: translateY(0);
}

/* ── Header ───────────────────────────────────────────── */
.hdr {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--header-h);
  background: rgba(251, 250, 247, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: var(--border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
}

.hdr-inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  max-width: var(--max-content);
  width: 100%;
  margin: 0 auto;
}

.hdr-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--ink);
}

.hdr-brand-name {
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
}

.hdr-version {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-3);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  border: var(--border);
  background: var(--surface);
}

.hdr-nav {
  display: flex;
  gap: var(--space-4);
  font-size: 14px;
  margin-left: var(--space-3);
}

.hdr-nav-item {
  text-decoration: none;
  color: var(--ink-3);
  padding: 4px 0;
  border-bottom: 1.5px solid transparent;
  transition: color var(--dur-hover) var(--ease), border-color var(--dur-hover) var(--ease);
}

.hdr-nav-item:hover { color: var(--ink); }
.hdr-nav-item.is-active {
  color: var(--ink);
  font-weight: 500;
  border-bottom-color: var(--ink);
}

.hdr-search {
  position: relative;
}

.hdr-search-input {
  font: inherit;
  font-size: 13px;
  padding: 7px 12px 7px 32px;
  border: var(--border);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--ink);
  width: 200px;
  transition: border-color var(--dur-focus) var(--ease), box-shadow var(--dur-focus) var(--ease), width var(--dur-focus) var(--ease);
}

.hdr-search-input:focus {
  outline: none;
  width: 260px;
  border-color: var(--ink);
  box-shadow: var(--shadow-focus);
}

.hdr-search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  pointer-events: none;
}

.hdr-search-kbd {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-3);
  border: var(--border);
  border-radius: 4px;
  padding: 1px 5px;
  background: var(--paper);
  pointer-events: none;
}

.hdr-search-results {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 280px;
  max-height: 340px;
  overflow-y: auto;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--surface);
  border: var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-focus);
  z-index: 50;
}

.hdr-search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 10px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
}

.hdr-search-result.is-highlight { background: var(--paper); }

.hdr-search-result-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hdr-search-result-section {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ink-3);
}


/* ── Shell Layout ─────────────────────────────────────── */
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  max-width: var(--max-content);
  margin: 0 auto;
}

/* ── Sidebar ──────────────────────────────────────────── */
.sidebar {
  position: sticky;
  top: var(--header-h);
  align-self: start;
  max-height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: var(--space-6) var(--space-5) var(--space-10) var(--space-6);
  border-right: var(--border);
}

.sidebar-group { margin-bottom: var(--space-5); }

.sidebar-heading {
  margin-bottom: 6px;
  padding-left: var(--space-3);
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar-link {
  display: block;
  padding: 5px var(--space-3);
  font-size: 13.5px;
  text-decoration: none;
  color: var(--ink-3);
  border-radius: var(--radius-xs);
  border-left: 2px solid transparent;
  margin-left: -2px;
  transition: all var(--dur-hover) var(--ease);
}

.sidebar-link:hover {
  color: var(--ink);
  background: var(--surface-sunk);
}

.sidebar-link.is-active {
  color: var(--ink);
  font-weight: 500;
  background: var(--surface-sunk);
  border-left-color: var(--accent);
}

/* ── Main Content ─────────────────────────────────────── */
.main {
  padding: 0 var(--space-8) var(--space-10);
  min-width: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.article { max-width: var(--max-prose); min-width: 0; }
.article.is-wide { max-width: none; }

.article p {
  margin: 12px 0;
  color: var(--ink-2);
  line-height: var(--lh-body);
}

/* ── Hero ─────────────────────────────────────────────── */
.hero {
  position: relative;
  margin: 0 calc(-1 * var(--space-8));
  padding: var(--space-7) var(--space-8) var(--space-8);
  background:
    radial-gradient(ellipse 100% 80% at 80% 0%, rgba(255, 200, 51, 0.06) 0%, transparent 70%),
    linear-gradient(180deg, var(--surface-sunk) 0%, var(--paper) 100%);
  border-bottom: var(--border);
  overflow: hidden;
}

.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 640px;
}

.hero-inner--wide { max-width: none; }

.hero--demo .hero-pill { margin-bottom: var(--space-3); }
.hero--demo .hero-lede { margin-bottom: var(--space-5); max-width: 720px; }
.hero--demo .live-demo { margin: 0; }

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  background: var(--surface);
  border: var(--border);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--ink-2);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-xs);
}

.hero-pill-tag {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.hero-lede {
  font-size: 18px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 var(--space-7) 0;
  max-width: 540px;
}

/* ── Sections ─────────────────────────────────────────── */
.section {
  padding-top: var(--space-8);
  scroll-margin-top: calc(var(--header-h) + var(--space-4));
}

.section-title {
  font-size: var(--fs-xl);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--tracking-display);
  line-height: var(--lh-tight);
  margin: 0 0 var(--space-4) 0 !important;
  color: var(--ink);
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 8px;
  width: 4px;
  height: 20px;
  background: var(--accent);
  border-radius: 2px;
}

.intro-lede {
  font-size: var(--fs-md) !important;
  color: var(--ink-2);
  line-height: var(--lh-body);
}

/* ── Callouts ─────────────────────────────────────────── */
.callout {
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin: 20px 0;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.55;
}

.callout--note {
  background: var(--surface);
  border: 1px solid var(--line-2);
}

.callout--tip {
  background: var(--success-soft);
  border: 1px solid transparent;
}

.callout-badge {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.callout-badge--tip {
  background: var(--success);
  color: white;
}

.callout-body { flex: 1; color: var(--ink); }

/* ── Code Blocks ──────────────────────────────────────── */
.codeblock {
  margin: 16px 0 20px;
  border: var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--surface-sunk);
}

.codeblock--compact {
  display: flex;
  align-items: center;
}

.codeblock--compact pre {
  flex: 1;
  margin: 0;
  padding: 12px 16px;
}

.codeblock--compact .codeblock-copy {
  position: relative;
  top: auto;
  right: auto;
  margin: 0 8px 0 0;
}

.codeblock-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 14px;
  border-bottom: var(--border);
  background: var(--paper);
}

.codeblock-filename {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
}

.codeblock-lang { font-size: 10px; }

.codeblock-body {
  position: relative;
}

.codeblock pre {
  margin: 0;
  padding: 16px;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: var(--fs-sm);
  line-height: 1.65;
  overflow-x: auto;
}

.codeblock-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  border: var(--border);
  background: var(--surface);
  border-radius: var(--radius-xs);
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--ink-3);
  font-family: var(--font-sans);
  transition: all var(--dur-hover) var(--ease);
}

.codeblock-copy:hover {
  color: var(--ink);
  border-color: var(--line-2);
}

/* ── API Tables ───────────────────────────────────────── */
.api-table-wrap {
  border: var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin: 16px 0 20px;
  background: var(--surface);
}

.api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.api-table thead tr { background: var(--surface-sunk); }

.api-table th {
  text-align: left;
  padding: 10px 14px;
  font-weight: 500;
  color: var(--ink-3);
  font-size: 11px;
  letter-spacing: .04em;
  text-transform: uppercase;
  border-bottom: var(--border);
}

.api-table td {
  padding: 10px 14px;
  vertical-align: top;
  border-top: var(--border);
}

.api-table tbody tr:first-child td { border-top: none; }

.api-table tbody tr {
  transition: background var(--dur-hover) var(--ease);
}

.api-table tbody tr:hover {
  background: var(--surface-sunk);
}

.prop-name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  color: var(--ink);
}

.td-desc { color: var(--ink-2); }

.api-table code { font-size: 12px; }

/* ── Field Type Grid ──────────────────────────────────── */
.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  margin: 12px 0 20px;
}

.field-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: default;
  transition: all var(--dur-hover) var(--ease);
}

.field-card:hover {
  border-color: var(--line-2);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.field-card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-sunk);
  border-radius: var(--radius-xs);
  color: var(--ink-2);
  flex-shrink: 0;
  transition: background var(--dur-hover) var(--ease), color var(--dur-hover) var(--ease);
}

.field-card:hover .field-card-icon {
  background: var(--accent);
  color: var(--accent-ink);
}

.field-card-info { min-width: 0; }

.field-card-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 1px;
}

.field-card-meta {
  font-size: 11.5px;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 5px;
}

.field-card-meta code {
  font-family: var(--font-mono);
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 0;
  color: var(--ink-3);
}

.field-card-sep { opacity: 0.5; }

/* ── Builder Preview ──────────────────────────────────── */
.preview-window {
  margin: 16px 0 24px;
  border: var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.preview-chrome {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: var(--border);
  background: var(--surface-sunk);
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--line-2);
}

.preview-chrome-label { font-size: 10px; }

/* ── Live demo (tabs + real components) ───────────────── */
.live-demo-chrome {
  gap: 10px;
  flex-wrap: wrap;
}

.live-tabs {
  display: inline-flex;
  gap: 2px;
  margin-left: var(--space-3);
  padding: 3px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
}

.live-tab {
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--ink-3);
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--dur-hover) var(--ease), color var(--dur-hover) var(--ease);
}

.live-tab:hover { color: var(--ink); }

.live-tab.is-active {
  background: var(--ink);
  color: var(--paper);
}

.live-pane {
  background: var(--paper);
  min-height: 320px;
}

.live-pane--padded {
  padding: 16px;
}

.live-empty {
  margin-top: 8px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.live-json {
  margin: 0;
  border-radius: 0;
  max-height: 360px;
}

/* Animated ghost chip the virtual cursor "drags" onto the stage. */
.live-fly-ghost {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  background: var(--surface);
  border: 1px solid var(--ink);
  box-shadow: 0 4px 10px rgba(17, 17, 17, 0.08);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  cursor: grabbing;
}

[data-qa="live-pane-builder"] [data-qa="control-item"].is-fly-source {
  opacity: 0.4;
  transition: opacity 200ms var(--ease);
}

[data-qa="live-pane-builder"] [data-qa="builder-stage"].is-drop-target {
  outline: 2px dashed var(--accent);
  outline-offset: -4px;
  background-color: rgba(255, 200, 51, 0.08);
  transition: background-color 180ms var(--ease), outline-color 180ms var(--ease);
}

/* Virtual mouse cursor that drives the demo. */
.live-cursor {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
  transition: filter 160ms var(--ease);
}

.live-cursor.is-grabbing {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.32));
}

.live-cursor.is-grabbing svg path {
  fill: #1d4ed8;
}

@media (prefers-reduced-motion: reduce) {
  .live-fly-ghost,
  .live-cursor { display: none !important; }
}

/* ── Footer ───────────────────────────────────────────── */
.page-footer {
  margin-top: var(--space-9);
  padding: var(--space-5) 0;
  border-top: var(--border);
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--ink-3);
}

.page-footer a {
  color: var(--ink-3);
  text-decoration: none;
  transition: color var(--dur-hover) var(--ease);
}

.page-footer a:hover { color: var(--ink); }

/* ── Responsive ───────────────────────────────────────── */
.hide-mobile { display: inline; }

@media (max-width: 960px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .content-grid { grid-template-columns: 1fr; }
  .hero {
    margin: 0 calc(-1 * var(--space-5));
    padding: var(--space-8) var(--space-5);
  }
  .main { padding: 0 var(--space-5) var(--space-10); }
  .hide-mobile { display: none; }
  .section-title::before { display: none; }
  .field-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .hdr-nav { display: none; }
  .hdr-search-input { width: 140px; }
  .hdr-search-input:focus { width: 180px; }
}

</style>
