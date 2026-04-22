import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FormDataField } from '../types/form-data'

/** Generates a unique field ID. */
function generateFieldId(counter: number): string {
  return `frmb-${String(Date.now())}-fld-${String(counter)}`
}

/** Internal wrapper that tracks each field with a transient ID. */
interface InternalField {
  internalId: string
  field: FormDataField
}

/** Composable that manages the form builder state. */
export function useFormBuilder(): {
  internalFields: Ref<InternalField[]>
  fields: ComputedRef<FormDataField[]>
  selectedFieldId: Ref<string | null>
  fieldIdCounter: Ref<number>
  generateId: () => string
  addField: (field: FormDataField, index?: number) => string
  removeField: (fieldId: string) => boolean
  moveField: (fromIndex: number, toIndex: number) => void
  duplicateField: (fieldId: string) => string | null
  updateField: (fieldId: string, updates: Partial<FormDataField>) => void
  getField: (fieldId: string) => FormDataField | undefined
  getFieldIdByIndex: (index: number) => string | undefined
  clearFields: () => void
  selectField: (fieldId: string | null) => void
  reorderFields: (fieldIds: string[]) => void
  getData: () => FormDataField[]
  setData: (newFields: FormDataField[]) => void
  findFieldIdByName: (name: string) => string | undefined
} {
  const internalFields = ref<InternalField[]>([])
  const selectedFieldId = ref<string | null>(null)
  const fieldIdCounter = ref(0)

  /** Reactive array of form fields. */
  const fields = computed<FormDataField[]>(() =>
    internalFields.value.map((entry) => entry.field),
  )

  /**
   * Generate a new unique ID for a field.
   * @returns The generated ID string.
   */
  function generateId(): string {
    fieldIdCounter.value += 1
    return generateFieldId(fieldIdCounter.value)
  }

  /**
   * Add a field to the builder.
   * @param field - The field data to add.
   * @param index - Optional position to insert at.
   * @returns The internal ID of the new field.
   */
  function addField(field: FormDataField, index?: number): string {
    const id = generateId()
    const entry: InternalField = { internalId: id, field: { ...field } }
    if (index !== undefined && index >= 0 && index <= internalFields.value.length) {
      internalFields.value.splice(index, 0, entry)
    } else {
      internalFields.value.push(entry)
    }
    return id
  }

  /**
   * Remove a field by its internal ID.
   * @param fieldId - The internal ID of the field to remove.
   * @returns True if the field was found and removed.
   */
  function removeField(fieldId: string): boolean {
    const idx = internalFields.value.findIndex((entry) => entry.internalId === fieldId)
    if (idx === -1) {
      return false
    }
    internalFields.value.splice(idx, 1)
    if (selectedFieldId.value === fieldId) {
      selectedFieldId.value = null
    }
    return true
  }

  /**
   * Move a field from one position to another.
   * @param fromIndex - The current index.
   * @param toIndex - The target index.
   */
  function moveField(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 || fromIndex >= internalFields.value.length ||
      toIndex < 0 || toIndex >= internalFields.value.length
    ) {
      return
    }
    const removed = internalFields.value.splice(fromIndex, 1)
    const moved = removed[0]
    /* v8 ignore next 3 -- guarded by bounds check above */
    if (!moved) {
      return
    }
    internalFields.value.splice(toIndex, 0, moved)
  }

  /**
   * Duplicate a field by its internal ID.
   * @param fieldId - The internal ID of the field to duplicate.
   * @returns The new internal ID or null if not found.
   */
  function duplicateField(fieldId: string): string | null {
    const idx = internalFields.value.findIndex((entry) => entry.internalId === fieldId)
    if (idx === -1) {
      return null
    }
    const original = internalFields.value[idx]
    /* v8 ignore next 3 -- guarded by findIndex check above */
    if (!original) {
      return null
    }
    const newId = generateId()
    const clonedField: FormDataField = { ...original.field }
    // Generate a new name for the cloned field
    if (clonedField.name) {
      clonedField.name = `${clonedField.name}-copy`
    }
    const entry: InternalField = { internalId: newId, field: clonedField }
    internalFields.value.splice(idx + 1, 0, entry)
    return newId
  }

  /**
   * Update properties of a field.
   * @param fieldId - The internal ID of the field.
   * @param updates - Partial field data to merge.
   */
  function updateField(fieldId: string, updates: Partial<FormDataField>): void {
    const entry = internalFields.value.find((e) => e.internalId === fieldId)
    if (entry) {
      entry.field = { ...entry.field, ...updates }
    }
  }

  /**
   * Get a field by its internal ID.
   * @param fieldId - The internal ID.
   * @returns The field data or undefined.
   */
  function getField(fieldId: string): FormDataField | undefined {
    const entry = internalFields.value.find((e) => e.internalId === fieldId)
    return entry ? entry.field : undefined
  }

  /**
   * Get the internal ID of a field at a given index.
   * @param index - The index in the fields array.
   * @returns The internal ID or undefined.
   */
  function getFieldIdByIndex(index: number): string | undefined {
    return internalFields.value[index]?.internalId
  }

  /**
   * Clear all fields.
   */
  function clearFields(): void {
    internalFields.value = []
    selectedFieldId.value = null
  }

  /**
   * Select a field for editing.
   * @param fieldId - The internal ID to select, or null to deselect.
   */
  function selectField(fieldId: string | null): void {
    selectedFieldId.value = fieldId
  }

  /**
   * Reorder fields to match the given array of internal IDs.
   * @param fieldIds - The new order of field IDs.
   */
  function reorderFields(fieldIds: string[]): void {
    const fieldMap = new Map(internalFields.value.map((e) => [e.internalId, e]))
    const reordered: InternalField[] = []
    for (const id of fieldIds) {
      const entry = fieldMap.get(id)
      if (entry) {
        reordered.push(entry)
      }
    }
    internalFields.value = reordered
  }

  /**
   * Get serialized data (strips internal IDs).
   * @returns Array of field data.
   */
  function getData(): FormDataField[] {
    return internalFields.value.map((entry) => ({ ...entry.field }))
  }

  /**
   * Set fields from an external data source.
   * @param newFields - The field data to load.
   */
  function setData(newFields: FormDataField[]): void {
    internalFields.value = newFields.map((field) => {
      const id = generateId()
      return { internalId: id, field: { ...field } }
    })
    selectedFieldId.value = null
  }

  /**
   * Find the internal ID for a field by its name.
   * @param name - The field name to find.
   * @returns The internal ID or undefined.
   */
  function findFieldIdByName(name: string): string | undefined {
    const entry = internalFields.value.find((e) => e.field.name === name)
    return entry?.internalId
  }

  return {
    internalFields,
    fields,
    selectedFieldId,
    fieldIdCounter,
    generateId,
    addField,
    removeField,
    moveField,
    duplicateField,
    updateField,
    getField,
    getFieldIdByIndex,
    clearFields,
    selectField,
    reorderFields,
    getData,
    setData,
    findFieldIdByName,
  }
}
