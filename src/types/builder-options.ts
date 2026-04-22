import type { FieldType } from './field-types'
import type { FormDataField } from './form-data'
import type { ActionButton, CustomFieldPreset, InputSet, NotifyCallbacks, UserAttrDef } from './common'
import type { FieldEvents } from './field-event'

/** Configuration options for the FormBuilder component. */
export interface BuilderOptions {
  controlOrder: FieldType[]
  controlPosition: 'left' | 'right'
  defaultFields: FormDataField[]
  disabledAttrs: string[]
  disabledFieldButtons: Record<string, string[]>
  disabledSubtypes: Record<string, string[]>
  disableFields: FieldType[]
  disableHTMLLabels: boolean
  editOnAdd: boolean
  fields: CustomFieldPreset[]
  fieldRemoveWarn: boolean
  inputSets: InputSet[]
  roles: Record<string, string>
  scrollToFieldOnAdd: boolean
  sortableControls: boolean
  showActionButtons: boolean
  actionButtons: ActionButton[]
  disabledActionButtons: string[]
  notify?: NotifyCallbacks
  typeUserAttrs: Record<string, Record<string, UserAttrDef>>
  typeUserDisabledAttrs: Record<string, string[]>
  typeUserEvents: Record<string, FieldEvents>
}
