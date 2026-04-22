import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, provide, defineComponent } from 'vue'
import BuilderEditPanel from '../components/BuilderEditPanel.vue'
import { FIELD_REGISTRY_KEY, I18N_KEY } from '../types/injection-keys'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const fullRegistry = {
  getDefaultAttrs: (type: string) => {
    const map: Record<string, string[]> = {
      [FieldType.Text]: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'value', 'access', 'subtype', 'maxlength'],
      [FieldType.Select]: ['required', 'label', 'description', 'placeholder', 'name', 'className', 'access', 'multiple', 'values'],
      [FieldType.Button]: ['label', 'subtype', 'style', 'className', 'name', 'value', 'access'],
      [FieldType.CheckboxGroup]: ['required', 'label', 'description', 'name', 'className', 'access', 'toggle', 'inline', 'other', 'values'],
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
): ReturnType<typeof mount> {
  const ParentComponent = defineComponent({
    setup() {
      if (withRegistry) {
        provide(FIELD_REGISTRY_KEY, fullRegistry)
        provide(I18N_KEY, { t: (key: string) => key })
      }
    },
    render() {
      return h(BuilderEditPanel, { field, disabledAttrs })
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

  it('emits update:field with empty fieldId when field has no name', async () => {
    const wrapper = createWrapper({
      type: FieldType.Text,
      label: 'Name',
      access: false,
    })

    const panel = wrapper.findComponent(BuilderEditPanel)
    const textInputs = wrapper.findAll('[data-qa="attr-text"]')
    if (textInputs.length > 0) {
      const input = textInputs[0]
      if (input) {
        await input.setValue('New Value')
        const emitted = panel.emitted('update:field')
        const payload = emitted?.[0]?.[0] as { fieldId: string }
        expect(payload.fieldId).toBe('')
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
})
