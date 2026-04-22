# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
