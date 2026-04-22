import type { FieldType } from './field-types'

/** Control layout modes. */
export type ControlLayout = 'default' | 'noLabel' | 'hidden'

/** Registered control metadata. */
export interface ControlDefinition {
  type: FieldType
  subtypes: string[]
  label: string
  icon: string
  inactive: string[]
  defaultAttrs: string[]
  disabledAttrs: string[]
  layout: ControlLayout
}
