# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-04-22

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
- 16 built-in field types (text, number, date, select, checkbox-group, radio-group, textarea, file, autocomplete, button, header, paragraph, hidden, checkbox)
- v-model support on both builder and renderer
- BuilderOptions for customization (control position, disabled fields/attrs, action buttons, i18n)
- Composables: useFormBuilder, useFormRenderer, useFieldRegistry, useDragDrop, useI18n
- Full TypeScript support with strict mode
- 100% test coverage with Vitest
- ESLint with vue and typescript-eslint rules
