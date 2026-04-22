import { FieldType, SUBTYPE_MAP } from '../../types/field-types'
import type { ControlDefinition } from '../../types/control-definition'
import type { DefineComponent } from 'vue'
import ControlInput from './ControlInput.vue'
import ControlSelect from './ControlSelect.vue'
import ControlCheckbox from './ControlCheckbox.vue'
import ControlCheckboxGroup from './ControlCheckboxGroup.vue'
import ControlRadioGroup from './ControlRadioGroup.vue'
import ControlAutocomplete from './ControlAutocomplete.vue'
import ControlTextarea from './ControlTextarea.vue'
import ControlButton from './ControlButton.vue'
import ControlHeader from './ControlHeader.vue'
import ControlParagraph from './ControlParagraph.vue'
import ControlHidden from './ControlHidden.vue'
import ControlFile from './ControlFile.vue'

/** All control definitions for built-in field types. */
const CONTROL_DEFINITIONS: ControlDefinition[] = [
  {
    type: FieldType.Autocomplete,
    subtypes: SUBTYPE_MAP[FieldType.Autocomplete],
    label: 'Autocomplete',
    icon: '⚙',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'values', 'requireValidOption'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Button,
    subtypes: SUBTYPE_MAP[FieldType.Button],
    label: 'Button',
    icon: '🔘',
    inactive: [],
    defaultAttrs: ['label', 'subtype', 'style', 'className', 'name', 'value', 'access'],
    disabledAttrs: [],
    layout: 'noLabel',
  },
  {
    type: FieldType.CheckboxGroup,
    subtypes: SUBTYPE_MAP[FieldType.CheckboxGroup],
    label: 'Checkbox Group',
    icon: '☑',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'name', 'className', 'access', 'toggle', 'inline', 'other', 'values'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Checkbox,
    subtypes: SUBTYPE_MAP[FieldType.Checkbox],
    label: 'Checkbox',
    icon: '☑',
    inactive: ['checkbox'],
    defaultAttrs: ['required', 'label', 'description', 'name', 'className', 'access', 'toggle'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Date,
    subtypes: SUBTYPE_MAP[FieldType.Date],
    label: 'Date Field',
    icon: '📅',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'min', 'max', 'step'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.File,
    subtypes: SUBTYPE_MAP[FieldType.File],
    label: 'File Upload',
    icon: '📎',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'name', 'className', 'access', 'multiple'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Header,
    subtypes: SUBTYPE_MAP[FieldType.Header],
    label: 'Header',
    icon: '🔤',
    inactive: [],
    defaultAttrs: ['label', 'subtype', 'className', 'access'],
    disabledAttrs: [],
    layout: 'noLabel',
  },
  {
    type: FieldType.Hidden,
    subtypes: SUBTYPE_MAP[FieldType.Hidden],
    label: 'Hidden Input',
    icon: '👁',
    inactive: ['hidden'],
    defaultAttrs: ['name', 'value', 'access'],
    disabledAttrs: [],
    layout: 'hidden',
  },
  {
    type: FieldType.Number,
    subtypes: SUBTYPE_MAP[FieldType.Number],
    label: 'Number',
    icon: '#',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'min', 'max', 'step'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Paragraph,
    subtypes: SUBTYPE_MAP[FieldType.Paragraph],
    label: 'Paragraph',
    icon: '¶',
    inactive: [],
    defaultAttrs: ['label', 'subtype', 'className', 'access'],
    disabledAttrs: [],
    layout: 'noLabel',
  },
  {
    type: FieldType.RadioGroup,
    subtypes: SUBTYPE_MAP[FieldType.RadioGroup],
    label: 'Radio Group',
    icon: '◉',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'name', 'className', 'access', 'inline', 'other', 'values'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Select,
    subtypes: SUBTYPE_MAP[FieldType.Select],
    label: 'Select',
    icon: '▾',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'access', 'multiple', 'values'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Text,
    subtypes: SUBTYPE_MAP[FieldType.Text],
    label: 'Text Field',
    icon: 'T',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'maxlength'],
    disabledAttrs: [],
    layout: 'default',
  },
  {
    type: FieldType.Textarea,
    subtypes: SUBTYPE_MAP[FieldType.Textarea],
    label: 'Text Area',
    icon: '▭',
    inactive: [],
    defaultAttrs: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'maxlength', 'rows'],
    disabledAttrs: [],
    layout: 'default',
  },
]

/** Map from FieldType to its Vue component. */
const COMPONENT_MAP: Record<string, DefineComponent> = {
  [FieldType.Autocomplete]: ControlAutocomplete as unknown as DefineComponent,
  [FieldType.Button]: ControlButton as unknown as DefineComponent,
  [FieldType.CheckboxGroup]: ControlCheckboxGroup as unknown as DefineComponent,
  [FieldType.Checkbox]: ControlCheckbox as unknown as DefineComponent,
  [FieldType.Date]: ControlInput as unknown as DefineComponent,
  [FieldType.File]: ControlFile as unknown as DefineComponent,
  [FieldType.Header]: ControlHeader as unknown as DefineComponent,
  [FieldType.Hidden]: ControlHidden as unknown as DefineComponent,
  [FieldType.Number]: ControlInput as unknown as DefineComponent,
  [FieldType.Paragraph]: ControlParagraph as unknown as DefineComponent,
  [FieldType.RadioGroup]: ControlRadioGroup as unknown as DefineComponent,
  [FieldType.Select]: ControlSelect as unknown as DefineComponent,
  [FieldType.Text]: ControlInput as unknown as DefineComponent,
  [FieldType.Textarea]: ControlTextarea as unknown as DefineComponent,
}

/**
 * Register all built-in controls with the field registry.
 * @param register - The register function from useFieldRegistry.
 */
export function registerBuiltinControls(register: (definition: ControlDefinition, component: DefineComponent) => void): void {
  for (const definition of CONTROL_DEFINITIONS) {
    const component = COMPONENT_MAP[definition.type]
    if (component) {
      register(definition, component)
    }
  }
}

export { CONTROL_DEFINITIONS, COMPONENT_MAP }
