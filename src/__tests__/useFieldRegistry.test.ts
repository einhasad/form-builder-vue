import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computed, isReactive, type DefineComponent } from 'vue'
import { FieldType } from '../types/field-types'
import type { ControlDefinition } from '../types/control-definition'
import type { useFieldRegistry as UseFieldRegistry } from '../composables/useFieldRegistry'
import { CONTROL_DEFINITIONS } from '../components/controls/register'

let useFieldRegistry: typeof UseFieldRegistry

beforeEach(async () => {
  vi.resetModules()
  useFieldRegistry = (await import('../composables/useFieldRegistry')).useFieldRegistry
})

const ratingDefinition: ControlDefinition = {
  type: 'star-rating',
  subtypes: ['five', 'ten'],
  label: 'Star Rating',
  icon: '★',
  inactive: [],
  defaultAttrs: ['label'],
  disabledAttrs: [],
  layout: 'default',
}

const countryPickerDefinition: ControlDefinition = {
  type: FieldType.Select,
  subtypes: [],
  label: 'Country picker',
  icon: '⚑',
  inactive: [],
  defaultAttrs: ['label'],
  disabledAttrs: [],
  layout: 'default',
}

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

describe('useFieldRegistry', () => {
  it('starts with every built-in control registered', () => {
    const registry = useFieldRegistry()

    expect(registry.getAllTypes()).toEqual(CONTROL_DEFINITIONS.map((def) => def.type))
    expect(registry.getDefinition(FieldType.Select)?.label).toBe('Select')
    expect(registry.resolveComponent(FieldType.Select)).toBeDefined()
  })

  it('shares registrations between every caller', () => {
    useFieldRegistry().register(countryPickerDefinition)

    const other = useFieldRegistry()
    expect(other.getDefinition(FieldType.Select)).toEqual(countryPickerDefinition)
    expect(other.isActive(FieldType.Select)).toBe(true)
    expect(other.getAllTypes()).toContain(FieldType.Select)
  })

  it('adds a custom field type for every caller', () => {
    const ratingComponent = {} as DefineComponent
    useFieldRegistry().register(ratingDefinition, ratingComponent)

    const other = useFieldRegistry()
    expect(other.getDefinition('star-rating')).toEqual(ratingDefinition)
    expect(other.isActive('star-rating')).toBe(true)
    expect(other.getSubtypes('star-rating')).toEqual(['five', 'ten'])
    expect(other.resolveComponent('star-rating')).toStrictEqual(ratingComponent)
    expect(other.getAllTypes()).toEqual([...CONTROL_DEFINITIONS.map((def) => def.type), 'star-rating'])
  })

  it('overrides a built-in type for every caller', () => {
    const customText = {} as DefineComponent
    useFieldRegistry().register(textDefinition, customText)

    const other = useFieldRegistry()
    expect(other.getDefinition(FieldType.Text)).toEqual(textDefinition)
    expect(other.resolveComponent(FieldType.Text)).toStrictEqual(customText)
    expect(other.getAllTypes()).toHaveLength(CONTROL_DEFINITIONS.length)
  })

  it('getSubtypes returns subtypes for registered type', () => {
    const registry = useFieldRegistry()

    registry.register(textDefinition)

    expect(registry.getSubtypes(FieldType.Text)).toEqual(['text', 'password'])
  })

  it('getSubtypes returns empty array for unregistered type', () => {
    const registry = useFieldRegistry()

    expect(registry.getSubtypes('unknown-type')).toEqual([])
  })

  it('isActive returns false for unregistered type', () => {
    const registry = useFieldRegistry()

    expect(registry.isActive('unknown-type')).toBe(false)
    expect(registry.getDefinition('unknown-type')).toBeUndefined()
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
    registry.register(countryPickerDefinition, mockComponent)

    expect(registry.resolveComponent(FieldType.Select)).toStrictEqual(mockComponent)
    expect(registry.resolveComponent('unknown-type')).toBeUndefined()
  })

  it('register without component keeps the existing component', () => {
    const registry = useFieldRegistry()
    const builtinSelect = registry.resolveComponent(FieldType.Select)

    registry.register(countryPickerDefinition)

    expect(registry.getDefinition(FieldType.Select)).toEqual(countryPickerDefinition)
    expect(builtinSelect).toBeDefined()
    expect(registry.resolveComponent(FieldType.Select)).toBe(builtinSelect)
  })

  it('definitions and components refs are reactive', () => {
    const registry = useFieldRegistry()
    const selectLabel = computed(() => registry.definitions.value.get(FieldType.Select)?.label)
    const selectComponent = computed(() => registry.components.value.get(FieldType.Select))
    const mockComponent = {} as DefineComponent

    expect(selectLabel.value).toBe('Select')
    expect(selectComponent.value).not.toBe(mockComponent)

    registry.register(countryPickerDefinition, mockComponent)

    expect(selectLabel.value).toBe('Country picker')
    expect(selectComponent.value).toStrictEqual(mockComponent)
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
    expect(registry.getDefaultAttrs(FieldType.Autocomplete)).toContain('access')
    // Checkbox
    expect(registry.getDefaultAttrs(FieldType.Checkbox)).toContain('toggle')
  })
})
