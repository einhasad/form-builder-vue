# Vue 3 Form Builder

Drag-and-drop form builder and renderer for Vue 3 — TypeScript-first, zero jQuery, zero runtime dependencies.

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
- 16 built-in field types (text, select, checkbox-group, radio-group, date, file, header, paragraph, etc.)
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

### Form Builder

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from '@einhasad-vue/form-builder-vue'
import type { FormDataField } from '@einhasad-vue/form-builder-vue'

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
| `field-added` | `{ fieldId, field }` | Field added |
| `field-removed` | `{ fieldId, field }` | Field removed |
| `field-updated` | `{ fieldId, field }` | Field updated |
| `field-moved` | `{ fieldId, fromIndex, toIndex }` | Field reordered |
| `field-selected` | `{ fieldId }` | Field selected for editing |
| `save` | `{ formData }` | Save button clicked |
| `clear` | — | Clear button clicked |
| `loaded` | — | Builder mounted |

### FormBuilder Exposed Methods

| Method | Description |
|--------|-------------|
| `getData()` | Get current form data array |
| `setData(fields)` | Set form data |
| `addField(field)` | Add a new field |
| `removeField(id)` | Remove field by id |
| `clearFields()` | Remove all fields |
| `save()` | Returns current form data |

### FormRenderer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `formData` | `FormDataField[]` | `[]` | Field definitions to render |
| `modelValue` | `UserDataMap` | `{}` | User answers (v-model) |
| `options` | `Partial<RendererOptions>` | `{}` | Configuration overrides |
| `disabled` | `boolean` | `false` | Disable all inputs |

### BuilderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `controlPosition` | `'left' \| 'right'` | `'left'` | Control panel side |
| `disableFields` | `FieldType[]` | `[]` | Field types to hide |
| `showActionButtons` | `boolean` | `true` | Show Save/Clear buttons |
| `disabledAttrs` | `string[]` | `[]` | Attributes to disable in edit panel |
| `editOnAdd` | `boolean` | `false` | Open edit panel on field add |
| `fieldRemoveWarn` | `boolean` | `false` | Warn before removing fields |

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
