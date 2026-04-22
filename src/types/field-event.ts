import type { FormDataField } from './form-data'

/** Lifecycle event callbacks for a field. */
export interface FieldEvents {
  onadd?: (field: FormDataField) => void
  onremove?: (field: FormDataField) => void
  onclone?: (field: FormDataField) => void
}
