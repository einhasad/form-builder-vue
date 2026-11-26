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

describe('useFormBuilder unique names', () => {
  it('generateName gives unique names for fields added in the same millisecond', () => {
    const builder = useFormBuilder()
    const names: string[] = []
    for (let i = 0; i < 3; i += 1) {
      const name = builder.generateName('text')
      names.push(name)
      builder.addField({ type: FieldType.Text, label: 'T', name })
    }

    expect(new Set(names).size).toBe(3)
    expect(names[0]).toMatch(/^text-\d+-0$/)
  })

  it('gives every copy of the same field a unique name', () => {
    const builder = useFormBuilder()
    const id = builder.addField(textField)

    builder.duplicateField(id)
    builder.duplicateField(id)
    builder.duplicateField(id)

    const names = builder.fields.value.map((field) => field.name)
    expect(names).toEqual(['name-field', 'name-field-copy-3', 'name-field-copy-2', 'name-field-copy'])
  })
})

describe('useFormBuilder rows', () => {
  function rowField(name: string, rowId?: string): FormDataField {
    const field: FormDataField = { type: FieldType.Text, label: name, name }
    if (rowId !== undefined) {
      field.rowId = rowId
    }
    return field
  }

  function layout(builder: ReturnType<typeof useFormBuilder>): string[] {
    return builder.fields.value.map((field) => `${field.name ?? ''}@${field.rowId ?? '-'}`)
  }

  it('copies a field of a non-full row into the same row', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r')])
    const id = builder.getFieldIdByIndex(0) ?? ''

    builder.duplicateField(id)

    expect(layout(builder)).toEqual(['a@r', 'a-copy@r', 'b@r'])
  })

  it('places a copy from a full row on its own row after the row', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('c', 'r'), rowField('d')])
    const id = builder.getFieldIdByIndex(1) ?? ''

    builder.duplicateField(id)

    expect(layout(builder)).toEqual(['a@r', 'b@r', 'c@r', 'b-copy@-', 'd@-'])
  })

  it('moveFieldToRow without rowId takes the field out of its row', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('c', 'r'), rowField('d')])

    builder.moveFieldToRow(0, 3)

    expect(layout(builder)).toEqual(['b@r', 'c@r', 'd@-', 'a@-'])
  })

  it('moveFieldToRow drops the rowId of a row-mate left alone', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('c')])

    builder.moveFieldToRow(0, 2)

    expect(layout(builder)).toEqual(['b@-', 'c@-', 'a@-'])
  })

  it('moveFieldToRow joins the target row', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a'), rowField('b', 's'), rowField('c', 's')])

    builder.moveFieldToRow(0, 2, 's')

    expect(layout(builder)).toEqual(['b@s', 'c@s', 'a@s'])
  })

  it('moveFieldToRow gives a split-off group of the same row a fresh rowId', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('x'), rowField('y', 'r'), rowField('z', 'r')])

    builder.moveFieldToRow(2, 2)

    const [a, b, x, y, z] = builder.fields.value
    expect(a?.rowId).toBe('r')
    expect(b?.rowId).toBe('r')
    expect(x?.rowId).toBeUndefined()
    expect(y?.rowId).toBeTypeOf('string')
    expect(y?.rowId).not.toBe('r')
    expect(z?.rowId).toBe(y?.rowId)
  })

  it('moveFieldToRow splits a row that grew past the size limit', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('c', 'r'), rowField('d', 'r'), rowField('e')])

    builder.moveFieldToRow(4, 4)

    const rowIds = builder.fields.value.map((field) => field.rowId)
    expect(rowIds.slice(0, 3)).toEqual(['r', 'r', 'r'])
    expect(rowIds[3]).toBeUndefined()
  })

  it('moveFieldToRow between two row members breaks that row up', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('x')])

    builder.moveFieldToRow(2, 1)

    expect(layout(builder)).toEqual(['a@-', 'x@-', 'b@-'])
  })

  it('moveFieldToRow ignores out-of-range indices', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r')])

    builder.moveFieldToRow(5, 0)
    builder.moveFieldToRow(0, 5)

    expect(layout(builder)).toEqual(['a@r', 'b@r'])
  })

  it('removeField drops the rowId of a row-mate left alone', () => {
    const builder = useFormBuilder()
    builder.setData([rowField('a', 'r'), rowField('b', 'r'), rowField('c')])

    builder.removeField(builder.getFieldIdByIndex(0) ?? '')

    expect(layout(builder)).toEqual(['b@-', 'c@-'])
  })

  it('setData keeps loaded rowIds untouched', () => {
    const builder = useFormBuilder()
    const loaded = [rowField('a', 'r'), rowField('b'), rowField('c', 'r')]

    builder.setData(loaded)

    expect(builder.getData()).toEqual(loaded)
  })
})
