# Vue 3 Form Builder

Drag-and-drop form builder and renderer for Vue 3 — TypeScript-first, zero jQuery, zero runtime dependencies.

**[Live demo and docs](https://einhasad.github.io/form-builder-vue/)** · [npm](https://www.npmjs.com/package/@einhasad-vue/form-builder-vue) · [Issues](https://github.com/einhasad/form-builder-vue/issues)

[![npm version](https://img.shields.io/npm/v/@einhasad-vue/form-builder-vue.svg?logo=npm)](https://www.npmjs.com/package/@einhasad-vue/form-builder-vue)
[![npm downloads](https://img.shields.io/npm/dm/@einhasad-vue/form-builder-vue.svg)](https://www.npmjs.com/package/@einhasad-vue/form-builder-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@einhasad-vue/form-builder-vue?label=gzipped)](https://bundlephobia.com/package/@einhasad-vue/form-builder-vue)
[![types](https://img.shields.io/npm/types/@einhasad-vue/form-builder-vue)](https://www.npmjs.com/package/@einhasad-vue/form-builder-vue)
[![CI](https://github.com/einhasad/form-builder-vue/actions/workflows/ci.yml/badge.svg)](https://github.com/einhasad/form-builder-vue/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@einhasad-vue/form-builder-vue.svg)](./LICENSE)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./vite.config.ts)

## Size

Measured against `@einhasad-vue/form-builder-vue@0.1.0` on a clean install. **`vue` is a peer dependency — the numbers below are the delta you pay on top of an existing Vue app**; Vue's own runtime (~11 KB gzip) is not counted because your app already has it. CSS is required for the builder's drag preview; the renderer works without it.

### What actually reaches the browser

| Import | Raw (min) | gzip | brotli |
|---|---:|---:|---:|
| `FormBuilder` + `FormRenderer` (everything) | 45 KB | **~12 KB** | ~11 KB |
| `FormRenderer` only (tree-shaken) | 22 KB | **~6 KB** | ~5 KB |
| `form-builder-vue.css` (required for builder UI) | 20 KB | **~3.5 KB** | ~3 KB |

Measured by bundling a consumer with `esbuild --bundle --minify` and `vue` marked external.

### What npm puts on disk

| | Size |
|---|---:|
| Tarball downloaded from the registry | **~38 KB** |
| `node_modules/@einhasad-vue/form-builder-vue/` (ESM + UMD + CSS + `.d.ts`) | **~172 KB** |

Zero runtime dependencies — nothing transitive gets pulled in. Library is ESM, so modern bundlers tree-shake unused exports.

## Features

- Drag-and-drop form builder with live preview
- 14 built-in field types (text, select, checkbox-group, radio-group, date, file, header, paragraph, etc.)
- Form renderer for displaying saved forms and collecting user input
- v-model support on both builder and renderer
- Fully typed with TypeScript
- Customizable via options (disable fields, custom attrs, i18n, action buttons)
- Scoped styles, no global CSS pollution
- Zero jQuery dependency

## Installation

```bash
npm install @einhasad-vue/form-builder-vue
```

Requires Vue 3.5+ as a peer dependency.

## Usage

Import `@einhasad-vue/form-builder-vue/style.css` once in your app; the builder UI needs it.

### Form Builder

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@einhasad-vue/form-builder-vue'
import type { FormDataField } from '@einhasad-vue/form-builder-vue'
import '@einhasad-vue/form-builder-vue/style.css'

const formData = ref<FormDataField[]>([])
</script>

<template>
  <FormBuilder v-model="formData" />
</template>
```

### Form Renderer

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormRenderer } from '@einhasad-vue/form-builder-vue'
import type { FormDataField, UserDataMap } from '@einhasad-vue/form-builder-vue'
import '@einhasad-vue/form-builder-vue/style.css'

const formData = ref<FormDataField[]>([/* saved form data */])
const userData = ref<UserDataMap>({})
</script>

<template>
  <FormRenderer
    :form-data="formData"
    v-model="userData"
  />
</template>
```

## API

### FormBuilder Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `FormDataField[]` | `[]` | Form fields (v-model) |
| `options` | `Partial<BuilderOptions>` | `{}` | Configuration overrides |

### FormBuilder Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `FormDataField[]` | Fields changed |
| `field-added` | `{ fieldId, field }` | Field added (palette, drop or copy) |
| `field-removed` | `{ fieldId, field }` | Field removed |
| `field-updated` | `{ fieldId, field }` | Field updated |
| `field-moved` | `{ fieldId, fromIndex, toIndex }` | Field reordered |
| `field-selected` | `{ fieldId: string \| null }` | Field opened for editing (`null` when the edit panel closes) |
| `save` | `{ formData }` | Save button clicked or `save()` called |
| `clear` | — | Clear button clicked |
| `loaded` | — | Builder mounted |

### FormBuilder Exposed Methods

| Method | Description |
|--------|-------------|
| `getData()` | Get current form data array |
| `setData(fields)` | Set form data |
| `addField(field, index?)` | Add a new field (appended when no index); returns its id |
| `removeField(id)` | Remove field by id; returns `false` when not found |
| `clearFields()` | Remove all fields |
| `save()` | Emits `save` and returns current form data |
| `getFieldIds()` | Field ids in stage order, for `removeField` / `toggleFieldEdit` |
| `getFieldTypes(activeOnly?)` | Registered field types; `activeOnly` drops `disableFields` |
| `toggleFieldEdit(id \| null)` | Open the edit panel for a field (`null` closes it) |
| `closeAllFieldEdit()` | Close the edit panel |
| `getCurrentFieldId()` | Id of the field being edited, or `null` |
| `setLocale(locale)` | Switch the UI language |

### FormRenderer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `formData` | `FormDataField[]` | `[]` | Field definitions to render |
| `modelValue` | `UserDataMap` | `{}` | User answers (v-model) |
| `options` | `Partial<RendererOptions>` | `{}` | Configuration overrides |
| `disabled` | `boolean` | `false` | Disable all inputs |

### FormRenderer Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `UserDataMap` | Answers changed (v-model) |
| `change` | `{ fieldName, value: string[] }` | A single field value changed |
| `render` | — | Form finished rendering |

### FormRenderer Exposed Methods

| Method | Description |
|--------|-------------|
| `userData()` | Current answers as `{ name, userData }[]` |
| `clear()` | Reset all answers |
| `setData(formData)` | Replace the rendered fields until the `formData` prop changes; answers of removed fields are dropped |
| `getElement(fieldName)` | The field's control element (wrapper `div` for groups and autocomplete), or `undefined` for unknown names |
| `validate()` | Check required, maxlength and number min/max; show errors under invalid fields (`aria-invalid`) and return `Record<string, string[]>` of messages by field name (`{}` when valid) |

`UserDataMap` is `Record<string, string[]>`: each field `name` maps to an array of strings.

### RendererOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disableHTMLLabels` | `boolean` | `false` | Not yet supported; labels always render as plain text |
| `notify` | `{ error, success, warning }` | no-op callbacks | Not yet supported |

### BuilderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `controlPosition` | `'left' \| 'right'` | `'right'` | Control panel side |
| `controlOrder` | `FieldType[]` | all types | Order of the controls in the panel |
| `disableFields` | `FieldType[]` | `[]` | Field types to hide |
| `showActionButtons` | `boolean` | `true` | Show Save/Clear buttons |
| `disabledAttrs` | `string[]` | `[]` | Attributes to disable in edit panel |
| `editOnAdd` | `boolean` | `false` | Open edit panel on field add |
| `fieldRemoveWarn` | `boolean` | `false` | Ask for confirmation (`window.confirm`) before removing a field |
| `fields` | `CustomFieldPreset[]` | `[]` | Extra pre-configured controls in the panel |
| `buttonStyles` | `string[]` | `['default', 'danger', 'info', 'primary', 'success', 'warning']` | Style choices for Button fields |

The `BuilderOptions` type also declares `defaultFields`, `disabledFieldButtons`, `disabledSubtypes`, `disableHTMLLabels`, `inputSets`, `roles`, `scrollToFieldOnAdd`, `sortableControls`, `actionButtons`, `disabledActionButtons`, `notify`, `typeUserAttrs`, `typeUserDisabledAttrs` and `typeUserEvents`. They are accepted for compatibility with the original formBuilder but not yet supported.

### Field Types

`text`, `number`, `date`, `select`, `checkbox-group`, `radio-group`, `textarea`, `file`, `autocomplete`, `button`, `header`, `paragraph`, `hidden`, `checkbox`

## Composables

All internal composables are exported for advanced usage:

```ts
import {
  useFormBuilder,
  useFormRenderer,
  useFieldRegistry,
  useDragDrop,
  useI18n,
} from '@einhasad-vue/form-builder-vue'
```

`useFieldRegistry()` returns one global registry shared by every `FormBuilder` and `FormRenderer` in the app:

- Call `register(def, component)` before mounting so the type is in the control panel from the start.
- `def.type` can be any string, so `register()` can add custom field types as well as override built-ins. A custom type added from the palette is saved as `{ type, label, name, access: false }`.
- Registering an existing type (including a built-in) overrides it app-wide.
- Under SSR the registry is module state, so it is shared across requests; register types once at startup, not per request.

### Validation messages and i18n

`FormRenderer.validate()` builds its messages from i18n keys, so `useI18n().addMessages(locale, messages)` can translate or reword them. `{label}`, `{maxlength}`, `{min}` and `{max}` are filled in from the field:

| Key | Default (`en`) |
|-----|----------------|
| `validationRequired` | `{label} is required` |
| `validationMaxlength` | `{label} must be at most {maxlength} characters` |
| `validationMin` | `{label} must be at least {min}` |
| `validationMax` | `{label} must be at most {max}` |

`useFormRenderer(t?)` takes an optional translator `(key: string) => string` (defaults to `useI18n().t`) when you use the composable directly.

## Provide / inject helpers

The library shares configuration, state, field registry, and i18n with
descendant components through `provide`/`inject`. The injection keys are
module-private — consumers interact with them through paired helper
functions. Use these when mounting child pieces (e.g. `BuilderStage`) inside
custom wrappers, or when reading context from your own composables:

```ts
import {
  provideBuilderOptions, useBuilderOptions,
  provideBuilderState,   useBuilderState,
  provideBuilderRegistry, useBuilderRegistry,
  provideBuilderI18n,    useBuilderI18n,
  type BuilderRegistryContext,
  type BuilderI18nContext,
} from '@einhasad-vue/form-builder-vue'
```

Each `use*()` returns `undefined` if nothing was provided upstream, so
consumers can fall back cleanly.

## Theming

Scoped styles read their colors from CSS custom properties. Redefine them
on `.form-builder` (or any ancestor) to retheme without overriding
individual selectors. Key variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `--accent` | Primary accent — action buttons, focus rings | `#ffc833` |
| `--fb-control-accent` | `accent-color` for checkbox/radio inputs and `.toggle` `:checked` background | `var(--accent, #ffc833)` |
| `--fb-focus-ring` | Focus outline color of renderer controls | `var(--ink, #111)` |
| `--surface`, `--surface-sunk` | Panel / stage backgrounds | `#fff`, `#f3f0e8` |
| `--ink`, `--ink-2`, `--ink-3` | Primary / secondary / muted text | `#111`, `#3a3a3a`, `#6e6a63` |
| `--line`, `--line-2` | Subtle / medium borders | `#e8e4db`, `#d3cec1` |

## Development

```bash
npm run build          # Build library
npm run test           # Run tests
npm run test:coverage  # Run tests with 100% coverage thresholds
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint
```

## License

MIT
