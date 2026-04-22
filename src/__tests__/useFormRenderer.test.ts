import { describe, it, expect } from 'vitest'
import { useFormRenderer } from '../composables/useFormRenderer'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const textField: FormDataField = {
  type: FieldType.Text,
  label: 'Name',
  name: 'name-field',
  required: true,
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

describe('useFormRenderer', () => {
  it('setAnswer and getAnswer manage user data', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])
    expect(renderer.getAnswer('name-field')).toEqual(['John'])
    expect(renderer.getAnswer('unknown')).toEqual([])
  })

  it('getAllAnswers returns full data map', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])
    renderer.setAnswer('age-field', ['25'])

    const all = renderer.getAllAnswers()
    expect(all).toEqual({
      'name-field': ['John'],
      'age-field': ['25'],
    })
  })

  it('setAnswers replaces all answers from external source', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('old-field', ['old-value'])
    renderer.setAnswers({
      'new-field': ['new-value'],
      'another-field': ['another'],
    })

    expect(renderer.getAnswer('old-field')).toEqual([])
    expect(renderer.getAnswer('new-field')).toEqual(['new-value'])
    expect(renderer.getAnswer('another-field')).toEqual(['another'])
  })

  it('clearAnswers resets all data and errors', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])
    renderer.validate([textField])

    renderer.clearAnswers()

    expect(renderer.localData.value).toEqual({})
    expect(renderer.errors.value).toEqual({})
  })

  it('validate returns true for valid fields', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])

    const result = renderer.validate([textField])
    expect(result).toBe(true)
    expect(renderer.errors.value).toEqual({})
  })

  it('validate returns false for required empty fields', () => {
    const renderer = useFormRenderer()

    const result = renderer.validate([textField])
    expect(result).toBe(false)
    expect(renderer.errors.value['name-field']).toHaveLength(1)
    expect(renderer.errors.value['name-field'][0]).toContain('required')
  })

  it('validate returns false for empty string answer', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', [''])

    const result = renderer.validate([textField])
    expect(result).toBe(false)
    expect(renderer.errors.value['name-field']).toBeDefined()
  })

  it('validate skips fields without name', () => {
    const renderer = useFormRenderer()

    const field: FormDataField = {
      type: FieldType.Header,
      label: 'Title',
      access: false,
    }

    const result = renderer.validate([field])
    expect(result).toBe(true)
  })

  it('validate handles non-required empty fields', () => {
    const renderer = useFormRenderer()

    const result = renderer.validate([numberField])
    expect(result).toBe(true)
    expect(renderer.errors.value).toEqual({})
  })

  it('mergeUserData injects answers into field definitions', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])
    renderer.setAnswer('age-field', ['25'])

    const merged = renderer.mergeUserData([textField, numberField])

    expect(merged[0].userData).toEqual(['John'])
    expect(merged[1].userData).toEqual(['25'])
  })

  it('mergeUserData handles fields without name', () => {
    const renderer = useFormRenderer()

    const headerField: FormDataField = {
      type: FieldType.Header,
      label: 'Title',
      access: false,
    }

    const merged = renderer.mergeUserData([headerField])
    expect(merged[0]).toEqual(headerField)
    expect(merged[0].userData).toBeUndefined()
  })

  it('setAnswer overwrites previous value', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', ['John'])
    renderer.setAnswer('name-field', ['Jane'])

    expect(renderer.getAnswer('name-field')).toEqual(['Jane'])
  })

  it('validate returns false for required field with empty array', () => {
    const renderer = useFormRenderer()

    renderer.setAnswer('name-field', [])

    const result = renderer.validate([textField])
    expect(result).toBe(false)
  })

  it('validate clears previous errors on new validation', () => {
    const renderer = useFormRenderer()

    renderer.validate([textField])
    expect(Object.keys(renderer.errors.value)).toHaveLength(1)

    renderer.setAnswer('name-field', ['John'])
    renderer.validate([textField])
    expect(Object.keys(renderer.errors.value)).toHaveLength(0)
  })

  it('localData and errors refs are reactive', () => {
    const renderer = useFormRenderer()

    expect(renderer.localData.value).toEqual({})
    expect(renderer.errors.value).toEqual({})

    renderer.setAnswer('test', ['val'])
    expect(renderer.localData.value).toEqual({ test: ['val'] })
  })
})
