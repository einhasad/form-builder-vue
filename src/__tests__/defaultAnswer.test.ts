import { describe, it, expect } from 'vitest'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import { defaultAnswer } from '../utils/defaultAnswer'

function range(attrs: Partial<FormDataField> = {}): FormDataField {
  return { type: FieldType.Number, subtype: 'range', label: 'Range', name: 'range', ...attrs }
}

describe('defaultAnswer', () => {
  it('returns selected option values', () => {
    expect(defaultAnswer({
      type: FieldType.CheckboxGroup,
      label: 'Group',
      values: [
        { label: 'A', value: 'a', selected: true },
        { label: 'B', value: 'b', selected: false },
        { label: 'C', value: 'c', selected: true },
      ],
    })).toEqual(['a', 'c'])
  })

  it('returns the preset value', () => {
    expect(defaultAnswer({ type: FieldType.Hidden, label: '', value: 'secret' })).toEqual(['secret'])
  })

  it('leaves empty fields unanswered', () => {
    expect(defaultAnswer({ type: FieldType.Text, label: 'Text', subtype: 'text', value: '' })).toBeUndefined()
    expect(defaultAnswer({ type: FieldType.RadioGroup, label: 'Radio', values: [{ label: 'A', value: 'a', selected: false }] })).toBeUndefined()
  })

  it('never treats button and single checkbox values as answers', () => {
    expect(defaultAnswer({ type: FieldType.Button, label: 'Go', value: 'go' })).toBeUndefined()
    expect(defaultAnswer({ type: FieldType.Checkbox, label: 'Agree', value: 'I agree' })).toBeUndefined()
  })

  it('returns the first option of a single select without placeholder', () => {
    const values = [
      { label: 'A', value: 'a', selected: false },
      { label: 'B', value: 'b', selected: false },
    ]
    expect(defaultAnswer({ type: FieldType.Select, label: 'Select', values })).toEqual(['a'])
    expect(defaultAnswer({ type: FieldType.Select, label: 'Select', values, placeholder: 'Pick' })).toBeUndefined()
    expect(defaultAnswer({ type: FieldType.Select, label: 'Select', values, multiple: true })).toBeUndefined()
    expect(defaultAnswer({ type: FieldType.Select, label: 'Select', values: [] })).toBeUndefined()
  })

  it('returns black for an empty color input', () => {
    expect(defaultAnswer({ type: FieldType.Text, label: 'Color', subtype: 'color' })).toEqual(['#000000'])
  })

  it('returns the browser midpoint for an empty range input', () => {
    expect(defaultAnswer(range())).toEqual(['50'])
    expect(defaultAnswer(range({ min: '1', max: '5' }))).toEqual(['3'])
    expect(defaultAnswer(range({ min: '0', max: '10', step: '4' }))).toEqual(['4'])
    expect(defaultAnswer(range({ min: '0', max: '10', step: '3' }))).toEqual(['6'])
    expect(defaultAnswer(range({ min: '0', max: '3', step: '2' }))).toEqual(['2'])
    expect(defaultAnswer(range({ min: '0', max: '1', step: '2' }))).toEqual(['0'])
    expect(defaultAnswer(range({ min: '10', max: '5' }))).toEqual(['10'])
    expect(defaultAnswer(range({ step: '0' }))).toEqual(['50'])
    expect(defaultAnswer(range({ min: 'abc', max: '' }))).toEqual(['50'])
    expect(defaultAnswer(range({ value: '7' }))).toEqual(['7'])
  })
})
