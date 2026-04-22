// Components
export { default as FormBuilder } from './components/FormBuilder.vue'
export { default as FormRenderer } from './components/FormRenderer.vue'

// Types
export { FieldType, SUBTYPE_MAP } from './types/field-types'
export type { TextSubtype, DateSubtype, NumberSubtype, HeaderSubtype, ParagraphSubtype, ButtonSubtype, TextareaSubtype } from './types/field-types'
export type { FormDataField, FormValueOption } from './types/form-data'
export type { ControlDefinition, ControlLayout } from './types/control-definition'
export type { BuilderOptions } from './types/builder-options'
export type { RendererOptions } from './types/renderer-options'
export type { UserDataMap } from './types/user-data'
export type { FieldEvents } from './types/field-event'
export type { InputSet, ActionButton, CustomFieldPreset, NotifyCallbacks, UserAttrDef } from './types/common'
export type { BuilderState } from './types/builder-state'

// Composables
export { useFormBuilder } from './composables/useFormBuilder'
export { useFormRenderer } from './composables/useFormRenderer'
export { useFieldRegistry } from './composables/useFieldRegistry'
export { useDragDrop } from './composables/useDragDrop'
export { useI18n } from './composables/useI18n'

// Provide/inject helpers — paired `provide*()` and `use*()` functions that
// encapsulate each injection key as a module-private symbol.
export { provideBuilderOptions, useBuilderOptions } from './state/builderOptions'
export { provideBuilderState, useBuilderState } from './state/builderState'
export {
  provideBuilderRegistry,
  useBuilderRegistry,
  type BuilderRegistryContext,
} from './state/builderRegistry'
export { provideBuilderI18n, useBuilderI18n, type BuilderI18nContext } from './state/builderI18n'
