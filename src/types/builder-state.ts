import type { Ref } from 'vue'
import type { FormDataField } from './form-data'

/** Reactive builder state shared via provide/inject. */
export interface BuilderState {
  fields: Ref<FormDataField[]>
  selectedFieldId: Ref<string | null>
  fieldIdCounter: Ref<number>
}
