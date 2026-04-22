Vue 3 form builder library — drag-and-drop form creation with no jQuery dependency.

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
npm install form-builder-vue
```

Requires Vue 3.5+ as a peer dependency.

## Usage

### Form Builder

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder } from 'form-builder-vue'
import type { FormDataField } from 'form-builder-vue'

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
import { FormRenderer } from 'form-builder-vue'
import type { FormDataField, UserDataMap } from 'form-builder-vue'

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
} from 'form-builder-vue'
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
