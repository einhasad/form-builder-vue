import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FormDataField } from '../types/form-data'

/** Generates a unique field ID. */
function generateFieldId(counter: number): string {
  return `frmb-${String(Date.now())}-fld-${String(counter)}`
}

/** Maximum number of fields that may share a single inline row. */
export const MAX_ROW_SIZE = 3

/** Produce a collision-resistant rowId for a newly formed inline row. */
export function createRowId(): string {
  return `row-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`
}

/** Internal wrapper that tracks each field with a transient ID. */
export interface InternalField {
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
  generateName: (type: string) => string
  addField: (field: FormDataField, index?: number) => string
  removeField: (fieldId: string) => boolean
  moveField: (fromIndex: number, toIndex: number) => void
  moveFieldToRow: (fromIndex: number, toIndex: number, rowId?: string) => void
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

  function isNameTaken(name: string): boolean {
    return internalFields.value.some((entry) => entry.field.name === name)
  }

  /**
   * Generate a field name in the `<type>-<timestamp>-<n>` format that no field uses yet.
   * @param type - The field type used as name prefix.
   * @returns The unused name.
   */
  function generateName(type: string): string {
    const stamp = String(Date.now())
    let suffix = 0
    while (isNameTaken(`${type}-${stamp}-${String(suffix)}`)) {
      suffix += 1
    }
    return `${type}-${stamp}-${String(suffix)}`
  }

  function uniqueCopyName(name: string): string {
    const base = `${name}-copy`
    let candidate = base
    let suffix = 2
    while (isNameTaken(candidate)) {
      candidate = `${base}-${String(suffix)}`
      suffix += 1
    }
    return candidate
  }

  function setRowId(entry: InternalField, rowId: string | undefined): void {
    if (entry.field.rowId === rowId) {
      return
    }
    const field = { ...entry.field }
    if (rowId === undefined) {
      delete field.rowId
    } else {
      field.rowId = rowId
    }
    entry.field = field
  }

  function rowRuns(rowId: string): InternalField[][] {
    const runs: InternalField[][] = []
    let current: InternalField[] = []
    for (const entry of internalFields.value) {
      if (entry.field.rowId === rowId && current.length < MAX_ROW_SIZE) {
        current.push(entry)
        continue
      }
      if (current.length > 0) {
        runs.push(current)
      }
      current = entry.field.rowId === rowId ? [entry] : []
    }
    if (current.length > 0) {
      runs.push(current)
    }
    return runs
  }

  function normalizeRow(rowId: string | undefined): void {
    if (rowId === undefined) {
      return
    }
    let keptOriginal = false
    for (const run of rowRuns(rowId)) {
      let target: string | undefined
      if (run.length > 1) {
        target = keptOriginal ? createRowId() : rowId
        keptOriginal = true
      }
      for (const entry of run) {
        setRowId(entry, target)
      }
    }
  }

  function rowEndIndex(index: number): number {
    const rowId = internalFields.value[index]?.field.rowId
    let end = index
    while (rowId !== undefined && internalFields.value[end + 1]?.field.rowId === rowId) {
      end += 1
    }
    return end
  }

  function rowSizeOf(entry: InternalField): number {
    const rowId = entry.field.rowId
    if (rowId === undefined) {
      return 1
    }
    let size = 1
    for (const run of rowRuns(rowId)) {
      if (run.includes(entry)) {
        size = run.length
      }
    }
    return size
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
    const [removed] = internalFields.value.splice(idx, 1)
    normalizeRow(removed?.field.rowId)
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
   * Move a field and set its row membership; the field leaves its row when `rowId` is undefined.
   * @param fromIndex - The current index.
   * @param toIndex - The target index.
   * @param rowId - The row the field joins at its new position.
   */
  function moveFieldToRow(fromIndex: number, toIndex: number, rowId?: string): void {
    const entry = internalFields.value[fromIndex]
    if (!entry || toIndex < 0 || toIndex >= internalFields.value.length) {
      return
    }
    const previousRowId = entry.field.rowId
    moveField(fromIndex, toIndex)
    setRowId(entry, rowId)
    const touchedRowIds = new Set([
      previousRowId,
      rowId,
      internalFields.value[toIndex - 1]?.field.rowId,
      internalFields.value[toIndex + 1]?.field.rowId,
    ])
    touchedRowIds.forEach(normalizeRow)
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
    const entry: InternalField = { internalId: newId, field: { ...original.field } }
    if (original.field.name) {
      entry.field.name = uniqueCopyName(original.field.name)
    }
    let insertAt = idx + 1
    if (rowSizeOf(original) >= MAX_ROW_SIZE) {
      insertAt = rowEndIndex(idx) + 1
      setRowId(entry, undefined)
    }
    internalFields.value.splice(insertAt, 0, entry)
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
    generateName,
    addField,
    removeField,
    moveField,
    moveFieldToRow,
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
