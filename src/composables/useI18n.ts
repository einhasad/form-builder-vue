import { ref, type Ref } from 'vue'

/** Default English messages for all UI strings. */
const DEFAULT_MESSAGES: Record<string, string> = {
  // Field type labels
  autocomplete: 'Autocomplete',
  button: 'Button',
  'checkbox-group': 'Checkbox Group',
  checkbox: 'Checkbox',
  date: 'Date Field',
  file: 'File Upload',
  header: 'Header',
  hidden: 'Hidden Input',
  number: 'Number',
  paragraph: 'Paragraph',
  'radio-group': 'Radio Group',
  select: 'Select',
  text: 'Text Field',
  textarea: 'Text Area',

  // Attribute labels
  label: 'Label',
  description: 'Help Text',
  placeholder: 'Placeholder',
  name: 'Name',
  className: 'Class',
  value: 'Value',
  required: 'Required',
  access: 'Limit access',
  subtype: 'Subtype',
  values: 'Options',
  multiple: 'Multiple',
  toggle: 'Toggle',
  inline: 'Inline',
  other: 'Other',
  min: 'Min',
  max: 'Max',
  step: 'Step',
  maxlength: 'Max Length',
  rows: 'Rows',
  style: 'Style',
  requireValidOption: 'Require valid option',
  role: 'Role',

  // Button styles
  default: 'Default',
  danger: 'Danger',
  info: 'Info',
  primary: 'Primary',
  success: 'Success',
  warning: 'Warning',

  // UI strings
  addField: 'Add Field',
  removeField: 'Remove Field',
  copyField: 'Copy Field',
  editField: 'Edit Field',
  save: 'Save',
  clear: 'Clear',
  getData: 'Get Data',
  confirmRemove: 'Are you sure you want to remove this field?',
  emptyStage: 'Drag a field from the panel to add it here.',

  // Validation messages
  validationRequired: '{label} is required',
  validationMaxlength: '{label} must be at most {maxlength} characters',
  validationMin: '{label} must be at least {min}',
  validationMax: '{label} must be at most {max}',

  // Option management
  addOption: 'Add Option',
  removeOption: 'Remove Option',
  moveUp: 'Move Up',
  moveDown: 'Move Down',
  selected: 'Selected',
}

function ownMessage(table: Record<string, string> | undefined, key: string): string | undefined {
  return table && Object.hasOwn(table, key) ? table[key] : undefined
}

/** Composable for internationalization support. */
export function useI18n(): {
  locale: Ref<string>
  t: (key: string) => string
  setLocale: (newLocale: string) => void
  addMessages: (newLocale: string, newMessages: Record<string, string>) => void
} {
  const locale = ref('en-US')
  const messages = ref<Record<string, Record<string, string>>>({
    'en-US': { ...DEFAULT_MESSAGES },
  })

  function t(key: string): string {
    return ownMessage(messages.value[locale.value], key) ?? ownMessage(DEFAULT_MESSAGES, key) ?? key
  }

  function setLocale(newLocale: string): void {
    messages.value[newLocale] ??= {}
    locale.value = newLocale
  }

  function addMessages(newLocale: string, newMessages: Record<string, string>): void {
    messages.value[newLocale] ??= {}
    messages.value[newLocale] = { ...messages.value[newLocale], ...newMessages }
  }

  return { locale, t, setLocale, addMessages }
}
