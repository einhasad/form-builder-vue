import type { Ref } from 'vue'
import type { FormDataField } from './form-data'
import type { InternalField } from '../composables/useFormBuilder'

/** Reactive builder state shared via provide/inject. */
export interface BuilderState {
  fields: Ref<FormDataField[]>
  selectedFieldId: Ref<string | null>
  fieldIdCounter: Ref<number>
  /**
   * Entries that pair each field with a transient `internalId`. When present,
   * consumers (e.g. `BuilderStage`) use the `internalId` as the selection and
   * dispatch key rather than the brittle `field.name` attribute — which may be
   * undefined for fields loaded from persisted external data.
   */
  internalFields?: Ref<InternalField[]>
}
