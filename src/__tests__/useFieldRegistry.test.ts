import { describe, it, expect } from 'vitest'
import { isReactive, type DefineComponent } from 'vue'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { FieldType } from '../types/field-types'
import type { ControlDefinition } from '../types/control-definition'

const textDefinition: ControlDefinition = {
  type: FieldType.Text,
  subtypes: ['text', 'password'],
  label: 'Text Field',
  icon: 'T',
  inactive: [],
  defaultAttrs: ['label', 'required'],
  disabledAttrs: [],
  layout: 'default',
}

const selectDefinition: ControlDefinition = {
  type: FieldType.Select,
  subtypes: [],
  label: 'Select',
  icon: '▾',
  inactive: [],
  defaultAttrs: ['label', 'values'],
  disabledAttrs: [],
  layout: 'default',
}

describe('useFieldRegistry', () => {
  it('registers and retrieves definitions', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)

    expect(registry.getDefinition(FieldType.Text)).toEqual(textDefinition)
    expect(registry.getDefinition(FieldType.Select)).toBeUndefined()
  })

  it('getAllTypes returns all registered types', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)
    registry.register(selectDefinition)

    const types = registry.getAllTypes()
    expect(types).toContain(FieldType.Text)
    expect(types).toContain(FieldType.Select)
    expect(types).toHaveLength(2)
  })

  it('getAllTypes returns empty array when nothing registered', () => {
    const registry = useFieldRegistry()

    expect(registry.getAllTypes()).toEqual([])
  })

  it('getSubtypes returns subtypes for registered type', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)

    const subtypes = registry.getSubtypes(FieldType.Text)
    expect(subtypes).toEqual(['text', 'password'])
  })

  it('getSubtypes returns empty array for unregistered type', () => {
    const registry = useFieldRegistry()

    expect(registry.getSubtypes(FieldType.Select)).toEqual([])
  })

  it('isActive returns true for registered type', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)

    expect(registry.isActive(FieldType.Text)).toBe(true)
    expect(registry.isActive(FieldType.Select)).toBe(false)
  })

  it('getDefaultAttrs returns attribute list for known type', () => {
    const registry = useFieldRegistry()

    const textAttrs = registry.getDefaultAttrs(FieldType.Text)
    expect(textAttrs).toContain('label')
    expect(textAttrs).toContain('required')

    const selectAttrs = registry.getDefaultAttrs(FieldType.Select)
    expect(selectAttrs).toContain('label')
    expect(selectAttrs).toContain('values')
  })

  it('getDefaultAttrs returns label for unknown type', () => {
    const registry = useFieldRegistry()

    const attrs = registry.getDefaultAttrs('unknown-type')
    expect(attrs).toEqual(['label'])
  })

  it('registers and resolves components', () => {
    const registry = useFieldRegistry()

    const mockComponent = {} as DefineComponent
    registry.register(textDefinition, mockComponent)

    expect(registry.resolveComponent(FieldType.Text)).toStrictEqual(mockComponent)
    expect(registry.resolveComponent(FieldType.Select)).toBeUndefined()
  })

  it('register without component does not add to components map', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)

    expect(registry.resolveComponent(FieldType.Text)).toBeUndefined()
  })

  it('definitions and components refs are reactive', () => {
    const registry = useFieldRegistry()

    expect(registry.definitions.value.size).toBe(0)
    expect(registry.components.value.size).toBe(0)

    registry.register(textDefinition, {} as DefineComponent)

    expect(registry.definitions.value.size).toBe(1)
    expect(registry.components.value.size).toBe(1)
  })

  it('stores registered components as non-reactive so Vue does not proxy them', () => {
    const registry = useFieldRegistry()
    const mockComponent = {} as DefineComponent

    registry.register(textDefinition, mockComponent)

    const resolved = registry.resolveComponent(FieldType.Text)
    expect(resolved).toBeDefined()
    expect(isReactive(resolved)).toBe(false)
  })

  it('getDefaultAttrs returns correct attrs for all field types', () => {
    const registry = useFieldRegistry()

    // Button
    expect(registry.getDefaultAttrs(FieldType.Button)).toContain('style')
    // Header
    expect(registry.getDefaultAttrs(FieldType.Header)).toContain('subtype')
    // Number
    expect(registry.getDefaultAttrs(FieldType.Number)).toContain('min')
    // Textarea
    expect(registry.getDefaultAttrs(FieldType.Textarea)).toContain('rows')
    // CheckboxGroup
    expect(registry.getDefaultAttrs(FieldType.CheckboxGroup)).toContain('toggle')
    // Date
    expect(registry.getDefaultAttrs(FieldType.Date)).toContain('min')
    // File
    expect(registry.getDefaultAttrs(FieldType.File)).toContain('multiple')
    // Hidden
    expect(registry.getDefaultAttrs(FieldType.Hidden)).toContain('value')
    // Paragraph
    expect(registry.getDefaultAttrs(FieldType.Paragraph)).toContain('subtype')
    // RadioGroup
    expect(registry.getDefaultAttrs(FieldType.RadioGroup)).toContain('inline')
    // Autocomplete
    expect(registry.getDefaultAttrs(FieldType.Autocomplete)).toContain('requireValidOption')
    // Checkbox
    expect(registry.getDefaultAttrs(FieldType.Checkbox)).toContain('toggle')
  })
})
