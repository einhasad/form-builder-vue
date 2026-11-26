# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-26

### Added

- `FormBuilder` exposed `getFieldIds()` — field ids in stage order, for `removeField` / `toggleFieldEdit`.
- `FormRenderer` exposed `validate(): Record<string, string[]>` (required, maxlength, number min/max; `{}` when valid). Invalid fields show their message and get `aria-invalid` / `aria-describedby`.
- `FormRenderer` exposed `setData(formData)` and `getElement(fieldName)` (previously no-op stubs).
- Buttons with `subtype: 'reset'` reset the answers to the field defaults; `subtype: 'submit'` submits the enclosing `<form>`.
- `useFieldRegistry().register()` accepts custom field types (`ControlDefinition.type` is any string). A custom type added from the palette is saved as `{ type, label, name, access: false }`.
- Validation messages are i18n keys (`validationRequired`, `validationMaxlength`, `validationMin`, `validationMax`) with `{label}` / `{maxlength}` / `{min}` / `{max}` placeholders; `useFormRenderer(t?)` takes an optional translator (defaults to `useI18n().t`).
- CSS variable `--fb-focus-ring` sets the focus outline color of renderer controls (defaults to `var(--ink, #111)`).
- Accessibility: renderer labels are linked to their controls, checkbox/radio groups are labelled groups, and palette controls can be added with the keyboard.

### Changed

- **Behavior:** `controlPosition` is now rendered as named — `'right'` (the default) puts the control panel on the right, `'left'` on the left. Apps that passed the opposite value to compensate must swap it.
- **Behavior:** `useFieldRegistry` is one shared module-level registry. Types registered before mounting appear in every builder and renderer, and overrides of built-in types apply app-wide.
- New fields get the data-contract defaults (`required`, `className`, `access`, `subtype`, `multiple`, `values[].selected`, ...); header and paragraph fields get no `name`. Existing JSON loads without gaining or losing keys.
- Copied fields get a unique `name` and emit `field-added`.
- `field-selected` emits `{ fieldId: null }` when the edit panel closes.
- The exposed `save()` now emits `save` as well as returning the form data.
- `FormBuilder` no longer emits `update:modelValue` on mount.
- Dragging a field off the stage no longer deletes it.
- `editOnAdd` and `fieldRemoveWarn` are implemented (`fieldRemoveWarn` asks with `window.confirm`).
- Renderer buttons no longer write `"clicked"` into the user data.
- The renderer "Other" option and autocomplete store the typed text as the answer (no `other-<name>` value).

## [0.3.0] - 2026-04-23

### Added

- Paired `provide*()` / `use*()` helpers exported from the package root, replacing the raw `InjectionKey` export. Each injection key is now a module-private `Symbol` and consumers interact with it through functions:
  - `provideBuilderOptions` / `useBuilderOptions`
  - `provideBuilderState` / `useBuilderState`
  - `provideBuilderRegistry` / `useBuilderRegistry` (+ exported `BuilderRegistryContext` type)
  - `provideBuilderI18n` / `useBuilderI18n` (+ exported `BuilderI18nContext` type)
- `BuilderState.internalFields` — optional ref of `{ internalId, field }` pairs surfaced by `useFormBuilder`. Downstream components use the stable `internalId` instead of `field.name` so actions work on fields loaded without a `name` attribute.
- CSS variable `--fb-control-accent` (defaults to `var(--accent, #ffc833)`) controls the `accent-color` of native checkbox/radio inputs across `BuilderEditPanel`, `ControlCheckbox`, `ControlCheckboxGroup`, `ControlRadioGroup`, and the `:checked` background of `.toggle`-styled switches. Set it on any ancestor of `.form-builder` to retheme all checkboxes/radios without overriding individual selectors.

### Changed

- **Breaking:** `BUILDER_OPTIONS_KEY`, `FIELD_REGISTRY_KEY`, `I18N_KEY`, and `BUILDER_STATE_KEY` are no longer exported. Use the matching `provide*()` / `use*()` helpers instead. Callers that imported the raw keys from `@einhasad-vue/form-builder-vue` must switch to the helpers.

### Fixed

- `BuilderField` action buttons (edit / copy / remove) and drag source no longer gate on `field.name`. Fields loaded from persisted schemas without a `name` attribute can now be selected, duplicated, reordered, and removed. Selection / drag / remove all route through `internalId` internally; external drag data is still accepted keyed by `name` for backwards compatibility.

## [0.2.1] - 2026-04-23

### Fixed

- `BuilderEditPanel` scoped styles (`.attr-label`, `.edit-attr input[type="text"]`, `.edit-attr select`, `.style-btn`, `.option-label-input`, `.option-value-input`, `.remove-option-btn`, `.add-option-btn`) now read `background`, `border`, and `color` from CSS variables (`--surface`, `--line`, `--ink`, `--ink-2`, `--ink-3`, `--accent`) with the previous hex colors as fallbacks. This lets host apps theme the edit panel by redefining the variables on `.form-builder` — previously the hardcoded `#ccc` / `#fff` / `#555` / `#999` / `#1890ff` won on specificity and forced a light look in dark themes.

## [0.2.0] - 2026-04-23

### Added

- `BuilderOptions.buttonStyles` — configurable list of Button-field style options rendered in the edit panel. Each name is set as `data-style` on the rendered button and as a `btn-<name>` class in the edit panel, so host apps can theme new styles with matching CSS rules. Defaults to `['default', 'danger', 'info', 'primary', 'success', 'warning']`.

### Changed

- `ControlButton` no longer coerces unknown `style` values back to `"default"`. The value is passed through verbatim as `data-style` so custom styles defined via `buttonStyles` render correctly.

## [0.1.0] - 2026-04-19

### Added

- FormBuilder component with drag-and-drop field creation
- FormRenderer component for displaying and collecting form data
- 14 built-in field types (text, number, date, select, checkbox-group, radio-group, textarea, file, autocomplete, button, header, paragraph, hidden, checkbox)
- v-model support on both builder and renderer
- BuilderOptions for customization (control position, disabled fields/attrs, action buttons, i18n)
- Composables: useFormBuilder, useFormRenderer, useFieldRegistry, useDragDrop, useI18n
- Full TypeScript support with strict mode
- 100% test coverage with Vitest
- ESLint with vue and typescript-eslint rules
