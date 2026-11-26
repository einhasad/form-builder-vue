import { describe, it, expect } from 'vitest'
import { CONTROL_DEFINITIONS } from '../components/controls/register'
import { FieldType } from '../types/field-types'

describe('register CONTROL_DEFINITIONS', () => {
  it('offers "access" (Limit access) on every built-in type, including autocomplete', () => {
    const missing = CONTROL_DEFINITIONS.filter((def) => !def.defaultAttrs.includes('access')).map((def) => def.type)
    expect(missing).toEqual([])
  })

  it('places autocomplete "access" right after className like the other option types', () => {
    const autocomplete = CONTROL_DEFINITIONS.find((def) => def.type === FieldType.Autocomplete)
    const attrs = autocomplete?.defaultAttrs ?? []
    expect(attrs.indexOf('access')).toBe(attrs.indexOf('className') + 1)
  })
})
