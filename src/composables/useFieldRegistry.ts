import { markRaw, ref, type DefineComponent, type Ref } from 'vue'
import type { ControlDefinition } from '../types/control-definition'
import { FieldType } from '../types/field-types'

/** Default editable attributes per field type. */
const TYPE_ATTR_MAP: Record<string, string[]> = {
  [FieldType.Autocomplete]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'value', 'values', 'requireValidOption',
  ],
  [FieldType.Button]: [
    'label', 'subtype', 'style', 'className', 'name', 'value', 'access',
  ],
  [FieldType.CheckboxGroup]: [
    'required', 'label', 'description', 'name', 'className', 'access',
    'toggle', 'inline', 'other', 'values',
  ],
  [FieldType.Checkbox]: [
    'required', 'label', 'description', 'name', 'className', 'access', 'toggle',
  ],
  [FieldType.Date]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'value', 'access', 'subtype', 'min', 'max', 'step',
  ],
  [FieldType.File]: [
    'required', 'label', 'description', 'name', 'className', 'access', 'multiple',
  ],
  [FieldType.Header]: [
    'label', 'subtype', 'className', 'access',
  ],
  [FieldType.Hidden]: [
    'name', 'value', 'access',
  ],
  [FieldType.Number]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'value', 'access', 'subtype', 'min', 'max', 'step',
  ],
  [FieldType.Paragraph]: [
    'label', 'subtype', 'className', 'access',
  ],
  [FieldType.RadioGroup]: [
    'required', 'label', 'description', 'name', 'className', 'access',
    'inline', 'other', 'values',
  ],
  [FieldType.Select]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'access', 'multiple', 'values',
  ],
  [FieldType.Text]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'value', 'access', 'subtype', 'maxlength',
  ],
  [FieldType.Textarea]: [
    'required', 'label', 'description', 'placeholder', 'name',
    'className', 'value', 'access', 'subtype', 'maxlength', 'rows',
  ],
}

/** Composable for managing registered field controls. */
export function useFieldRegistry(): {
  definitions: Ref<Map<string, ControlDefinition>>
  components: Ref<Map<string, DefineComponent>>
  register: (definition: ControlDefinition, component?: DefineComponent) => void
  getDefinition: (type: string) => ControlDefinition | undefined
  getAllTypes: () => string[]
  getSubtypes: (type: string) => string[]
  isActive: (type: string) => boolean
  getDefaultAttrs: (type: string) => string[]
  resolveComponent: (type: string) => DefineComponent | undefined
} {
  const definitions = ref<Map<string, ControlDefinition>>(new Map())
  const components = ref<Map<string, DefineComponent>>(new Map())

  function register(definition: ControlDefinition, component?: DefineComponent): void {
    const key = definition.type
    definitions.value.set(key, definition)
    if (component) {
      components.value.set(key, markRaw(component))
    }
  }

  function getDefinition(type: string): ControlDefinition | undefined {
    return definitions.value.get(type)
  }

  function getAllTypes(): string[] {
    return Array.from(definitions.value.keys())
  }

  function getSubtypes(type: string): string[] {
    const def = definitions.value.get(type)
    return def ? [...def.subtypes] : []
  }

  function isActive(type: string): boolean {
    return definitions.value.has(type)
  }

  function getDefaultAttrs(type: string): string[] {
    return TYPE_ATTR_MAP[type] ?? ['label']
  }

  function resolveComponent(type: string): DefineComponent | undefined {
    return components.value.get(type)
  }

  return {
    definitions,
    components,
    register,
    getDefinition,
    getAllTypes,
    getSubtypes,
    isActive,
    getDefaultAttrs,
    resolveComponent,
  }
}
