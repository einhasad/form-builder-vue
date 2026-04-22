import type { FieldType } from './field-types'

/** A single option in select, checkbox-group, radio-group, or autocomplete fields. */
export interface FormValueOption {
  label: string
  value: string
  selected: boolean
}

/**
 * The field object stored in the JSON array.
 * Index signature preserves typeUserAttrs extensibility.
 */
export interface FormDataField {
  type: FieldType
  subtype?: string
  label: string
  name?: string
  className?: string
  access?: boolean
  role?: string
  required?: boolean
  disabled?: boolean
  value?: string
  description?: string
  placeholder?: string
  values?: FormValueOption[]
  multiple?: boolean
  other?: boolean
  inline?: boolean
  toggle?: boolean
  min?: string
  max?: string
  step?: string
  maxlength?: string
  rows?: string
  style?: string
  requireValidOption?: boolean
  userData?: string[]
  /**
   * Shared identifier for consecutive fields that should render side-by-side in
   * the same visual row. Rows contain at most 3 fields; on narrow viewports
   * the row collapses to a single column.
   */
  rowId?: string
  [key: string]: unknown
}
