import { describe, it, expect } from 'vitest'
import { useI18n } from '../composables/useI18n'

describe('useI18n', () => {
  it('returns default message for known keys', () => {
    const { t } = useI18n()

    expect(t('text')).toBe('Text Field')
    expect(t('select')).toBe('Select')
    expect(t('addField')).toBe('Add Field')
    expect(t('removeField')).toBe('Remove Field')
    expect(t('required')).toBe('Required')
    expect(t('label')).toBe('Label')
  })

  it('returns key as fallback for unknown keys', () => {
    const { t } = useI18n()

    expect(t('unknown.key')).toBe('unknown.key')
    expect(t('someRandomString')).toBe('someRandomString')
  })

  it('setLocale changes the active locale', () => {
    const { locale, t, setLocale, addMessages } = useI18n()

    addMessages('uk-UA', {
      text: 'Текстове поле',
      select: 'Вибір',
    })

    setLocale('uk-UA')

    expect(locale.value).toBe('uk-UA')
    expect(t('text')).toBe('Текстове поле')
    expect(t('select')).toBe('Вибір')
  })

  it('falls back to DEFAULT_MESSAGES when locale messages are missing key', () => {
    const { t, setLocale } = useI18n()

    setLocale('fr-FR')

    // 'text' exists in DEFAULT_MESSAGES but not in fr-FR
    expect(t('text')).toBe('Text Field')
  })

  it('addMessages merges new messages into locale', () => {
    const { t, setLocale, addMessages } = useI18n()

    addMessages('de-DE', { text: 'Textfeld' })
    addMessages('de-DE', { select: 'Auswahl' })

    setLocale('de-DE')

    expect(t('text')).toBe('Textfeld')
    expect(t('select')).toBe('Auswahl')
  })

  it('addMessages does not overwrite existing keys when adding new ones', () => {
    const { t, setLocale, addMessages } = useI18n()

    addMessages('es-ES', { text: 'Campo de texto' })
    addMessages('es-ES', { select: 'Selección' })

    setLocale('es-ES')

    expect(t('text')).toBe('Campo de texto')
    expect(t('select')).toBe('Selección')
  })

  it('addMessages overwrites when called with same key', () => {
    const { t, setLocale, addMessages } = useI18n()

    addMessages('it-IT', { text: 'Campo vecchio' })
    addMessages('it-IT', { text: 'Campo nuovo' })

    setLocale('it-IT')

    expect(t('text')).toBe('Campo nuovo')
  })

  it('locale starts as en-US', () => {
    const { locale } = useI18n()

    expect(locale.value).toBe('en-US')
  })

  it('setLocale initializes empty messages for new locale', () => {
    const { t, setLocale } = useI18n()

    setLocale('ja-JP')

    // Falls back to DEFAULT_MESSAGES
    expect(t('addField')).toBe('Add Field')
  })

  it('returns all default message keys correctly', () => {
    const { t } = useI18n()

    // Field type labels
    expect(t('autocomplete')).toBe('Autocomplete')
    expect(t('button')).toBe('Button')
    expect(t('checkbox-group')).toBe('Checkbox Group')
    expect(t('checkbox')).toBe('Checkbox')
    expect(t('date')).toBe('Date Field')
    expect(t('file')).toBe('File Upload')
    expect(t('header')).toBe('Header')
    expect(t('hidden')).toBe('Hidden Input')
    expect(t('number')).toBe('Number')
    expect(t('paragraph')).toBe('Paragraph')
    expect(t('radio-group')).toBe('Radio Group')
    expect(t('select')).toBe('Select')
    expect(t('text')).toBe('Text Field')
    expect(t('textarea')).toBe('Text Area')

    // Attribute labels
    expect(t('description')).toBe('Help Text')
    expect(t('placeholder')).toBe('Placeholder')
    expect(t('name')).toBe('Name')
    expect(t('className')).toBe('Class')
    expect(t('value')).toBe('Value')
    expect(t('access')).toBe('Limit access')
    expect(t('subtype')).toBe('Subtype')
    expect(t('values')).toBe('Options')
    expect(t('multiple')).toBe('Multiple')
    expect(t('toggle')).toBe('Toggle')
    expect(t('inline')).toBe('Inline')
    expect(t('other')).toBe('Other')
    expect(t('min')).toBe('Min')
    expect(t('max')).toBe('Max')
    expect(t('step')).toBe('Step')
    expect(t('maxlength')).toBe('Max Length')
    expect(t('rows')).toBe('Rows')
    expect(t('style')).toBe('Style')
    expect(t('requireValidOption')).toBe('Require valid option')
    expect(t('role')).toBe('Role')

    // UI strings
    expect(t('save')).toBe('Save')
    expect(t('clear')).toBe('Clear')
    expect(t('getData')).toBe('Get Data')
    expect(t('confirmRemove')).toBe('Are you sure you want to remove this field?')
    expect(t('emptyStage')).toBe('Drag a field from the panel to add it here.')

    // Option management
    expect(t('addOption')).toBe('Add Option')
    expect(t('removeOption')).toBe('Remove Option')
    expect(t('selected')).toBe('Selected')

    // Button styles
    expect(t('default')).toBe('Default')
    expect(t('danger')).toBe('Danger')
    expect(t('info')).toBe('Info')
    expect(t('primary')).toBe('Primary')
    expect(t('success')).toBe('Success')
    expect(t('warning')).toBe('Warning')
  })
})
