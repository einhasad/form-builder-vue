import type { FormDataField } from './form-data'

/** A preset group of fields that can be added at once. */
export interface InputSet {
  name?: string
  label: string
  icon?: string
  showHeader?: boolean
  fields: FormDataField[]
}

/** A custom action button in the builder toolbar. */
export interface ActionButton {
  id: string
  label?: string
  className: string
  events: Record<string, (e: Event) => void>
}

/** A pre-defined field config for the control panel. */
export interface CustomFieldPreset {
  type: FormDataField['type']
  subtype?: string
  label?: string
  icon?: string
  values?: FormDataField['values']
  className?: string
  [key: string]: unknown
}

/** Notification callback functions. */
export interface NotifyCallbacks {
  error: (msg: string) => void
  success: (msg: string) => void
  warning: (msg: string) => void
}

/** Definition for a user-defined custom attribute. */
export interface UserAttrDef {
  label?: string | [string, string]
  options?: Record<string, string>
  type?: string
  value?: unknown
  multiple?: boolean
}
