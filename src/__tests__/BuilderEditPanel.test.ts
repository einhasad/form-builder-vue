import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import BuilderEditPanel from '../components/BuilderEditPanel.vue'
import { provideBuilderRegistry } from '../state/builderRegistry'
import { provideBuilderI18n } from '../state/builderI18n'
import { provideBuilderOptions } from '../state/builderOptions'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import type { BuilderOptions } from '../types/builder-options'

const fullRegistry = {
  getDefaultAttrs: (type: string) => {
    const map: Record<string, string[]> = {
      [FieldType.Text]: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'maxlength'],
      [FieldType.Select]: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'access', 'multiple', 'values'],
      [FieldType.Button]: ['label', 'subtype', 'style', 'className', 'name', 'value', 'access'],
      [FieldType.CheckboxGroup]: ['required', 'label', 'description', 'name', 'className', 'access', 'toggle', 'inline', 'other', 'values'],
      [FieldType.RadioGroup]: ['required', 'label', 'description', 'name', 'className', 'access', 'inline', 'other', 'values'],
      [FieldType.Autocomplete]: ['required', 'label', 'name', 'access', 'values'],
      [FieldType.Header]: ['label', 'subtype', 'className', 'access'],
    }
    return map[type] ?? ['label']
  },
  getDefinition: () => undefined,
  getAllTypes: () => [] as string[],
  getSubtypes: () => [] as string[],
  isActive: () => false,
  resolveComponent: () => undefined,
}

function createWrapper(
  field: FormDataField,
  disabledAttrs: string[] = [],
  withRegistry = true,
  fieldId = 'internal-1',
): ReturnType<typeof mount> {
  const ParentComponent = defineComponent({
    setup() {
      if (withRegistry) {
        provideBuilderRegistry(fullRegistry)
        provideBuilderI18n({ t: (key: string) => key })
      }
    },
    render() {
      return h(BuilderEditPanel, { field, fieldId, disabledAttrs })
    },
  })

  return mount(ParentComponent, { attachTo: document.body })
}

describe('BuilderEditPanel', () => {
  it('renders edit panel', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    })

    expect(wrapper.find('[data-qa="edit-panel"]').exists()).toBe(true)
  })

  it('renders text attribute inputs', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      description: 'Enter name',
      placeholder: 'Name...',
      className: 'form-control',
      access: false,
    })

    const attrs = wrapper.findAll('[data-qa="edit-attr"]')
    expect(attrs.length).toBeGreaterThan(0)

    const textInputs = wrapper.findAll('[data-qa="attr-text"]')
    expect(textInputs.length).toBeGreaterThan(0)
  })

  it('renders checkbox for boolean attributes', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      required: true,
      access: true,
    })

    const checkboxes = wrapper.findAll('[data-qa="attr-checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('emits update:field when checkbox changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      required: false,
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const checkboxes = wrapper.findAll('[data-qa="attr-checkbox"]')
    const checkbox = checkboxes[0]
    if (checkbox) {
      await checkbox.setValue(true)
      expect(panel.emitted('update:field')).toBeTruthy()
    }
  })

  it('emits update:field when text input changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const textInputs = wrapper.findAll('[data-qa="attr-text"]')
    const textInput = textInputs[0]
    if (textInput) {
      await textInput.setValue('New Label')
      expect(panel.emitted('update:field')).toBeTruthy()
    }
  })

  it('renders subtype select when available', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    })

    const selects = wrapper.findAll('[data-qa="attr-select"]')
    expect(selects.length).toBeGreaterThan(0)
  })

  it('renders style buttons for button type', () => {
    const wrapper = createWrapper({
      type: FieldType.Button,
      label: 'Submit',
      name: 'btn',
      style: 'default',
      subtype: 'button',
      access: false,
    })

    expect(wrapper.find('[data-qa="attr-style-buttons"]').exists()).toBe(true)
    const styleBtns = wrapper.findAll('[data-qa="attr-style-buttons"] button')
    expect(styleBtns).toHaveLength(6)
  })

  it('emits update:field when style button clicked', async () => {
    const wrapper = createWrapper({
      type: FieldType.Button,
      label: 'Submit',
      name: 'btn',
      style: 'default',
      subtype: 'button',
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const styleBtns = wrapper.findAll('[data-qa="attr-style-buttons"] button')
    const btn = styleBtns[1]
    if (btn) {
      await btn.trigger('click')
      expect(panel.emitted('update:field')).toBeTruthy()
    }
  })

  it('renders options editor for select type', () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: true },
      ],
    })

    expect(wrapper.find('[data-qa="options-editor"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-qa="option-row"]')).toHaveLength(2)
  })

  it('emits update:field when option label changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const labelInput = wrapper.find('[data-qa="option-label"]')
    await labelInput.setValue('Green')

    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('emits update:field when option value changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const valueInput = wrapper.find('[data-qa="option-value"]')
    await valueInput.setValue('green')

    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('emits update:field when option selected changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const selectedCheckbox = wrapper.find('[data-qa="option-selected"]')
    await selectedCheckbox.setValue(true)

    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('adds a new option', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)

    await wrapper.find('[data-qa="add-option"]').trigger('click')

    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('removes an option', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: false },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)

    await wrapper.find('[data-qa="remove-option"]').trigger('click')

    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('filters out disabled attrs', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    }, ['required', 'access'])

    const attrs = wrapper.findAll('[data-qa="edit-attr"]')
    const attrLabels = attrs.map(a => a.find('[data-qa="attr-label"]').text())
    expect(attrLabels).not.toContain('required')
    expect(attrLabels).not.toContain('access')
  })

  it('renders with no registry', () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    }, [], false)

    const attrs = wrapper.findAll('[data-qa="edit-attr"]')
    expect(attrs).toHaveLength(1)
    const firstAttr = attrs[0]
    expect(firstAttr?.find('[data-qa="attr-label"]').text()).toBe('label')
  })

  it('renders checkbox group with toggle and inline', () => {
    const wrapper = createWrapper({
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      toggle: false,
      inline: false,
      values: [],
    })

    const checkboxes = wrapper.findAll('[data-qa="attr-checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
  })

  it('emits update:field when subtype select changed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      name: 'name-field',
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const selects = wrapper.findAll('[data-qa="attr-select"]')
    if (selects.length > 0) {
      const select = selects[0]
      if (select) {
        await select.setValue('text')
        expect(panel.emitted('update:field')).toBeTruthy()
      }
    }
  })

  it('emits update:field keyed by the fieldId prop when field has no name', async () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      access: false,
    }, [], true, 'internal-7')

    const panel = wrapper.findComponent(BuilderEditPanel)
    const textInputs = wrapper.findAll('[data-qa="attr-text"]')
    if (textInputs.length > 0) {
      const input = textInputs[0]
      if (input) {
        await input.setValue('New Value')
        const emitted = panel.emitted('update:field')
        const payload = emitted?.[0]?.[0] as { fieldId: string }
        expect(payload.fieldId).toBe('internal-7')
      }
    }
  })

  it('renders options editor with undefined values and adds option', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    expect(wrapper.find('[data-qa="options-editor"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-qa="option-row"]')).toHaveLength(0)

    await wrapper.find('[data-qa="add-option"]').trigger('click')
    expect(panel.emitted('update:field')).toBeTruthy()
  })

  it('renders style buttons with undefined style and marks default active', () => {
    const wrapper = createWrapper({
      type: FieldType.Button,
      label: 'Submit',
      name: 'btn',
      subtype: 'button',
      access: false,
    })

    const defaultBtn = wrapper.find('[data-qa="style-btn-default"]')
    expect(defaultBtn.classes()).toContain('active')
  })

  it('covers multi-option update branches', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: true },
      ],
    })

    const panel = wrapper.findComponent(BuilderEditPanel)

    // Change label of first option (map covers false branch for second option)
    const labelInputs = wrapper.findAll('[data-qa="option-label"]')
    await labelInputs[0].setValue('Green')
    expect(panel.emitted('update:field')).toBeTruthy()

    // Change value of first option (map covers false branch for second option)
    const valueInputs = wrapper.findAll('[data-qa="option-value"]')
    await valueInputs[0].setValue('green')
    expect(panel.emitted('update:field')).toBeTruthy()

    // Change selected of first option (map covers false branch for second option)
    const selectedCheckboxes = wrapper.findAll('[data-qa="option-selected"]')
    await selectedCheckboxes[1].setValue(false)
    expect(panel.emitted('update:field')).toBeTruthy()
  })

  function lastUpdates(wrapper: ReturnType<typeof mount>): Partial<FormDataField> {
    const emitted = wrapper.findComponent(BuilderEditPanel).emitted('update:field') ?? []
    const payload = emitted[emitted.length - 1]?.[0] as { fieldId: string; updates: Partial<FormDataField> } | undefined
    return payload?.updates ?? {}
  }

  function lastValues(wrapper: ReturnType<typeof mount>): FormDataField['values'] {
    return lastUpdates(wrapper).values
  }

  const threeOptions = (): NonNullable<FormDataField['values']> => [
    { label: 'Option 1', value: 'option-1', selected: true },
    { label: 'Option 2', value: 'option-2', selected: false },
    { label: 'Option 3', value: 'option-3', selected: false },
  ]

  it('emits attribute edits keyed by internal fieldId even when names are duplicated', async () => {
    const wrapper = createWrapper({ type: FieldType.Text, label: 'Dup', name: 'dup', access: false }, [], true, 'internal-42')
    await wrapper.find('[data-qa="attr-text"]').setValue('x')
    const emitted = wrapper.findComponent(BuilderEditPanel).emitted('update:field')
    expect((emitted?.[0]?.[0] as { fieldId: string }).fieldId).toBe('internal-42')
  })

  it('edits a nameless header field through its fieldId', async () => {
    const wrapper = createWrapper({ type: FieldType.Header, subtype: 'h1', label: 'Preset', access: false }, [], true, 'hdr-1')
    await wrapper.find('[data-qa="attr-text"]').setValue('Renamed')
    const emitted = wrapper.findComponent(BuilderEditPanel).emitted('update:field')
    expect(emitted?.[0]?.[0]).toEqual({ fieldId: 'hdr-1', updates: { label: 'Renamed' } })
  })

  it('does not offer an empty Default subtype and never writes subtype ""', async () => {
    const wrapper = createWrapper({ type: FieldType.Text, label: 'Name', name: 'n', access: false })
    const select = wrapper.find('[data-qa="attr-select"]')
    const optionValues = select.findAll('option').map((o) => o.attributes('value'))
    expect(optionValues).not.toContain('')
    expect((select.element as HTMLSelectElement).value).toBe('text')
    await select.setValue('email')
    expect(lastUpdates(wrapper)).toEqual({ subtype: 'email' })
  })

  it('shows the stored subtype as selected', () => {
    const wrapper = createWrapper({ type: FieldType.Header, subtype: 'h3', label: 'H', access: false })
    expect((wrapper.find('[data-qa="attr-select"]').element as HTMLSelectElement).value).toBe('h3')
  })

  it.each([
    { type: FieldType.RadioGroup, multiple: undefined },
    { type: FieldType.Select, multiple: false },
    { type: FieldType.Autocomplete, multiple: undefined },
  ])('keeps a single selected option for single-choice $type', async ({ type, multiple }) => {
    const wrapper = createWrapper({ type, label: 'L', name: 'n', access: false, multiple, values: threeOptions() })
    await wrapper.findAll('[data-qa="option-selected"]')[1]?.setValue(true)
    expect(lastValues(wrapper)?.map((o) => o.selected)).toEqual([false, true, false])
  })

  it('allows several selected options for multiple select and checkbox group', async () => {
    for (const field of [
      { type: FieldType.Select, multiple: true },
      { type: FieldType.CheckboxGroup },
    ]) {
      const wrapper = createWrapper({ ...field, label: 'L', name: 'n', access: false, values: threeOptions() })
      await wrapper.findAll('[data-qa="option-selected"]')[2]?.setValue(true)
      expect(lastValues(wrapper)?.map((o) => o.selected)).toEqual([true, false, true])
    }
  })

  it('deselecting the only selected option of a single-choice field leaves none selected', async () => {
    const wrapper = createWrapper({ type: FieldType.RadioGroup, label: 'L', name: 'n', access: false, values: threeOptions() })
    await wrapper.findAll('[data-qa="option-selected"]')[0]?.setValue(false)
    expect(lastValues(wrapper)?.map((o) => o.selected)).toEqual([false, false, false])
  })

  it('gives a new option a unique value after an option was removed', async () => {
    const wrapper = createWrapper({
      type: FieldType.Select,
      label: 'L',
      name: 'n',
      access: false,
      values: [
        { label: 'Option 2', value: 'option-2', selected: false },
        { label: 'Option 3', value: 'option-3', selected: false },
      ],
    })
    await wrapper.find('[data-qa="add-option"]').trigger('click')
    const values = lastValues(wrapper)?.map((o) => o.value)
    expect(values).toEqual(['option-2', 'option-3', 'option-4'])
    expect(lastValues(wrapper)?.[2]).toEqual({ label: 'Option 4', value: 'option-4', selected: false })
  })

  it('moves an option up and down', async () => {
    const wrapper = createWrapper({ type: FieldType.Select, label: 'L', name: 'n', access: false, values: threeOptions() })
    await wrapper.findAll('[data-qa="move-option-up"]')[1]?.trigger('click')
    expect(lastValues(wrapper)?.map((o) => o.value)).toEqual(['option-2', 'option-1', 'option-3'])
    await wrapper.findAll('[data-qa="move-option-down"]')[1]?.trigger('click')
    expect(lastValues(wrapper)?.map((o) => o.value)).toEqual(['option-1', 'option-3', 'option-2'])
  })

  it('disables moving the first option up and the last option down', () => {
    const wrapper = createWrapper({ type: FieldType.Select, label: 'L', name: 'n', access: false, values: threeOptions() })
    expect(wrapper.findAll('[data-qa="move-option-up"]')[0]?.attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('[data-qa="move-option-down"]')[2]?.attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('[data-qa="move-option-up"]')[1]?.attributes('disabled')).toBeUndefined()
  })

  it('every attr label for= points to an existing element and ids are unique per panel', () => {
    const wrapper = mount(defineComponent({
      setup() {
        provideBuilderRegistry(fullRegistry)
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return [
          h(BuilderEditPanel, { field: { type: FieldType.Button, label: 'B', name: 'b', access: false }, fieldId: 'a', disabledAttrs: [] }),
          h(BuilderEditPanel, { field: { type: FieldType.Select, label: 'S', name: 's', access: false, values: threeOptions() }, fieldId: 'b', disabledAttrs: [] }),
          h(BuilderEditPanel, { field: { type: FieldType.Select, label: 'S', name: 's', access: false, values: threeOptions() }, fieldId: 'c', disabledAttrs: [] }),
        ]
      },
    }), { attachTo: document.body })
    const labels = wrapper.findAll('label[for]')
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(document.getElementById(label.attributes('for') ?? '')).not.toBeNull()
    }
    const ids = wrapper.findAll('[id]').map((el) => el.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
    wrapper.unmount()
  })

  it('uses button styles from builder options', () => {
    const wrapper = mount(defineComponent({
      setup() {
        provideBuilderRegistry(fullRegistry)
        provideBuilderOptions({ buttonStyles: ['primary', 'link'] } as BuilderOptions)
      },
      render() {
        return h(BuilderEditPanel, { field: { type: FieldType.Button, label: 'B', name: 'b', access: false }, fieldId: 'a', disabledAttrs: [] })
      },
    }))
    expect(wrapper.find('[data-qa="style-btn-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="style-btn-default"]').exists()).toBe(false)
    expect(wrapper.find('[data-qa="style-btn-primary"]').classes()).toContain('active')
  })

  it('renders an empty subtype select for a type without subtypes', () => {
    const wrapper = mount(defineComponent({
      setup() {
        provideBuilderRegistry({ ...fullRegistry, getDefaultAttrs: () => ['subtype'] })
      },
      render() {
        return h(BuilderEditPanel, { field: { type: FieldType.CheckboxGroup, label: 'C', name: 'c', access: false }, fieldId: 'a', disabledAttrs: [] })
      },
    }))
    const select = wrapper.find('[data-qa="attr-select"]')
    expect(select.findAll('option')).toHaveLength(0)
    expect((select.element as HTMLSelectElement).value).toBe('')
  })
})
