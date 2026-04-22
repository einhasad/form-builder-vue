import { describe, it, expect } from 'vitest'
import { useFormBuilder } from '../composables/useFormBuilder'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const textField: FormDataField = {
  type: FieldType.Text,
  label: 'Name',
  name: 'name-field',
  className: 'form-control',
  access: false,
}

const numberField: FormDataField = {
  type: FieldType.Number,
  label: 'Age',
  name: 'age-field',
  className: 'form-control',
  access: false,
}

const selectField: FormDataField = {
  type: FieldType.Select,
  label: 'Color',
  name: 'color-field',
  className: 'form-control',
  access: false,
  values: [
    { label: 'Red', value: 'red', selected: false },
    { label: 'Blue', value: 'blue', selected: true },
  ],
}

describe('useFormBuilder', () => {
  it('adds, retrieves, and removes fields', () => {
    const builder = useFormBuilder()

    const id1 = builder.addField(textField)
    const id2 = builder.addField(numberField)

    expect(builder.fields.value).toHaveLength(2)
    expect(builder.getField(id1)).toEqual(textField)
    expect(builder.getField(id2)).toEqual(numberField)
    expect(builder.getFieldIdByIndex(0)).toBe(id1)
    expect(builder.getFieldIdByIndex(1)).toBe(id2)

    const removed = builder.removeField(id1)
    expect(removed).toBe(true)
    expect(builder.fields.value).toHaveLength(1)
    expect(builder.fields.value[0]).toEqual(numberField)

    const removedAgain = builder.removeField(id1)
    expect(removedAgain).toBe(false)
  })

  it('adds field at specific index', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.addField(numberField)
    builder.addField(selectField, 1)

    expect(builder.fields.value).toHaveLength(3)
    expect(builder.fields.value[0]).toEqual(textField)
    expect(builder.fields.value[1]).toEqual(selectField)
    expect(builder.fields.value[2]).toEqual(numberField)
  })

  it('adds field at beginning and end', () => {
    const builder = useFormBuilder()

    builder.addField(numberField)
    builder.addField(textField, 0)
    builder.addField(selectField, 3)

    expect(builder.fields.value).toHaveLength(3)
    expect(builder.fields.value[0]).toEqual(textField)
    expect(builder.fields.value[1]).toEqual(numberField)
    expect(builder.fields.value[2]).toEqual(selectField)
  })

  it('adds field at end when index is out of bounds', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.addField(numberField, 99)

    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[1]).toEqual(numberField)
  })

  it('clears selectedFieldId when removing selected field', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    builder.selectField(id)
    expect(builder.selectedFieldId.value).toBe(id)

    builder.removeField(id)
    expect(builder.selectedFieldId.value).toBeNull()
  })

  it('does not clear selectedFieldId when removing different field', () => {
    const builder = useFormBuilder()

    const id1 = builder.addField(textField)
    const id2 = builder.addField(numberField)
    builder.selectField(id1)

    builder.removeField(id2)
    expect(builder.selectedFieldId.value).toBe(id1)
  })

  it('moves fields between indices', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.addField(numberField)
    builder.addField(selectField)

    builder.moveField(0, 2)

    expect(builder.fields.value[0]).toEqual(numberField)
    expect(builder.fields.value[1]).toEqual(selectField)
    expect(builder.fields.value[2]).toEqual(textField)
  })

  it('moveField does nothing for out of bounds indices', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.addField(numberField)

    builder.moveField(-1, 0)
    builder.moveField(0, -1)
    builder.moveField(5, 0)
    builder.moveField(0, 5)

    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[0]).toEqual(textField)
    expect(builder.fields.value[1]).toEqual(numberField)
  })

  it('duplicates a field with modified name', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    const newId = builder.duplicateField(id)

    expect(newId).not.toBeNull()
    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[1].name).toBe('name-field-copy')
    expect(builder.fields.value[1].type).toBe(FieldType.Text)
  })

  it('duplicateField returns null for nonexistent id', () => {
    const builder = useFormBuilder()

    const result = builder.duplicateField('nonexistent')
    expect(result).toBeNull()
  })

  it('updates field properties', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    builder.updateField(id, { label: 'Updated Label', required: true })

    const field = builder.getField(id)
    expect(field?.label).toBe('Updated Label')
    expect(field?.required).toBe(true)
  })

  it('updateField is no-op for nonexistent id', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.updateField('nonexistent', { label: 'X' })

    expect(builder.fields.value).toHaveLength(1)
    expect(builder.fields.value[0].label).toBe('Name')
  })

  it('getField returns undefined for nonexistent id', () => {
    const builder = useFormBuilder()

    expect(builder.getField('nonexistent')).toBeUndefined()
  })

  it('getFieldIdByIndex returns undefined for out of bounds', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    expect(builder.getFieldIdByIndex(5)).toBeUndefined()
    expect(builder.getFieldIdByIndex(-1)).toBeUndefined()
  })

  it('clearFields removes all fields and clears selection', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    builder.addField(numberField)
    builder.selectField(id)

    builder.clearFields()

    expect(builder.fields.value).toHaveLength(0)
    expect(builder.selectedFieldId.value).toBeNull()
  })

  it('selectField and deselect', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    builder.selectField(id)
    expect(builder.selectedFieldId.value).toBe(id)

    builder.selectField(null)
    expect(builder.selectedFieldId.value).toBeNull()
  })

  it('reorderFields changes field order', () => {
    const builder = useFormBuilder()

    const id1 = builder.addField(textField)
    const id2 = builder.addField(numberField)
    const id3 = builder.addField(selectField)

    builder.reorderFields([id3, id1, id2])

    expect(builder.fields.value[0]).toEqual(selectField)
    expect(builder.fields.value[1]).toEqual(textField)
    expect(builder.fields.value[2]).toEqual(numberField)
  })

  it('reorderFields ignores unknown IDs', () => {
    const builder = useFormBuilder()

    const id1 = builder.addField(textField)
    const id2 = builder.addField(numberField)

    builder.reorderFields([id2, id1, 'unknown'])

    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[0]).toEqual(numberField)
    expect(builder.fields.value[1]).toEqual(textField)
  })

  it('getData returns serialized fields without internal IDs', () => {
    const builder = useFormBuilder()

    builder.addField(textField)
    builder.addField(numberField)

    const data = builder.getData()

    expect(data).toHaveLength(2)
    expect(data[0]).toEqual(textField)
    expect(data[1]).toEqual(numberField)
  })

  it('setData replaces all fields', () => {
    const builder = useFormBuilder()

    builder.addField(textField)

    builder.setData([numberField, selectField])

    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[0]).toEqual(numberField)
    expect(builder.fields.value[1]).toEqual(selectField)
    expect(builder.selectedFieldId.value).toBeNull()
  })

  it('findFieldIdByName returns the correct internal ID', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)
    builder.addField(numberField)

    expect(builder.findFieldIdByName('name-field')).toBe(id)
    expect(builder.findFieldIdByName('nonexistent')).toBeUndefined()
  })

  it('generateId produces unique IDs', () => {
    const builder = useFormBuilder()

    const id1 = builder.generateId()
    const id2 = builder.generateId()

    expect(id1).not.toBe(id2)
    expect(id1).toContain('frmb-')
    expect(id2).toContain('frmb-')
  })

  it('fieldIdCounter increments on each add', () => {
    const builder = useFormBuilder()

    expect(builder.fieldIdCounter.value).toBe(0)
    builder.addField(textField)
    expect(builder.fieldIdCounter.value).toBe(1)
    builder.addField(numberField)
    expect(builder.fieldIdCounter.value).toBe(2)
  })

  it('internalFields are accessible', () => {
    const builder = useFormBuilder()

    const id = builder.addField(textField)

    expect(builder.internalFields.value).toHaveLength(1)
    expect(builder.internalFields.value[0].internalId).toBe(id)
    expect(builder.internalFields.value[0].field).toEqual(textField)
  })

  it('handles field without name in duplicateField', () => {
    const builder = useFormBuilder()

    const headerField: FormDataField = {
      type: FieldType.Header,
      label: 'Title',
      subtype: 'h1',
      access: false,
    }
    const id = builder.addField(headerField)
    const newId = builder.duplicateField(id)

    expect(newId).not.toBeNull()
    expect(builder.fields.value).toHaveLength(2)
    expect(builder.fields.value[1].name).toBeUndefined()
  })

  it('handles field without name in setData', () => {
    const builder = useFormBuilder()

    builder.setData([{ type: FieldType.Header, label: 'Title', subtype: 'h1', access: false }])

    expect(builder.fields.value).toHaveLength(1)
  })

  it('moveField handles same position move', () => {
    const builder = useFormBuilder()

    builder.addField(textField)

    // Move to same position (defensive null path can't be triggered)
    builder.moveField(0, 0)
    expect(builder.fields.value).toHaveLength(1)
  })
})
