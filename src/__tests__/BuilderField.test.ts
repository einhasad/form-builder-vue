import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent } from 'vue'
import BuilderField from '../components/BuilderField.vue'
import { provideBuilderRegistry } from '../state/builderRegistry'
import { provideBuilderI18n } from '../state/builderI18n'
import { useFieldRegistry } from '../composables/useFieldRegistry'
import { registerBuiltinControls } from '../components/controls/register'
import BuilderEditPanel from '../components/BuilderEditPanel.vue'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const textField: FormDataField = {
  type: FieldType.Text,
  label: 'Name',
  name: 'name-field',
  className: 'form-control',
  access: false,
}

describe('BuilderField', () => {
  it('renders unknown field type when no registry', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: textField,
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)

    expect(wrapper.find('.unknown-field').exists()).toBe(true)
    expect(wrapper.find('.unknown-field').text()).toContain('text')
  })

  it('renders with registry providing component', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: textField,
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)

    // resolveComponent returns undefined -> shows unknown field
    expect(wrapper.find('.unknown-field').exists()).toBe(true)
  })

  it('shows selected class when isSelected is true', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: textField,
          isSelected: true,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="builder-field"]').classes()).toContain('selected')
  })

  it('shows edit-active class when isEditing is true', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: textField,
          isSelected: true,
          isEditing: true,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="field-edit-btn"]').classes()).toContain('field-edit-active')
  })

  it('does not emit when field has no name', async () => {
    const field: FormDataField = {
      type: FieldType.Header,
      label: 'Title',
      access: false,
    }

    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field,
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    const fieldComp = wrapper.findComponent(BuilderField)

    await wrapper.find('[data-qa="field-remove-btn"]').trigger('click')
    expect(fieldComp.emitted('remove')).toBeFalsy()

    await wrapper.find('[data-qa="field-copy-btn"]').trigger('click')
    expect(fieldComp.emitted('copy')).toBeFalsy()

    await wrapper.find('[data-qa="field-edit-btn"]').trigger('click')
    expect(fieldComp.emitted('edit')).toBeFalsy()
  })

  it('uses i18n for type label', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => `[${key}]` })
      },
      render() {
        return h(BuilderField, {
          field: textField,
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('.field-type-label').text()).toBe('[text]')
  })

  it('renders the required marker when field.required is true', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => ({
            type: FieldType.Text,
            subtypes: [],
            label: 'Text',
            icon: 'T',
            inactive: [],
            defaultAttrs: [],
            disabledAttrs: [],
            layout: 'default',
          }),
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: { ...textField, required: true },
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="preview-required"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="preview-required"]').text()).toBe('*')
  })

  it('does not render the required marker when field.required is false', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => ({
            type: FieldType.Text,
            subtypes: [],
            label: 'Text',
            icon: 'T',
            inactive: [],
            defaultAttrs: [],
            disabledAttrs: [],
            layout: 'default',
          }),
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: { ...textField, required: false },
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="preview-required"]').exists()).toBe(false)
  })

  it('renders help icon and tooltip when field.description is set', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => ({
            type: FieldType.Text,
            subtypes: [],
            label: 'Text',
            icon: 'T',
            inactive: [],
            defaultAttrs: [],
            disabledAttrs: [],
            layout: 'default',
          }),
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: { ...textField, description: 'Full legal name' },
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="preview-help-icon"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="preview-help-icon"]').attributes('aria-label')).toBe('description')
    expect(wrapper.find('[data-qa="preview-help-tip"]').text()).toBe('Full legal name')
  })

  it('omits help wrap when field.description is empty', () => {
    const ParentComponent = defineComponent({
      setup() {
        provideBuilderRegistry({
          getDefinition: () => ({
            type: FieldType.Text,
            subtypes: [],
            label: 'Text',
            icon: 'T',
            inactive: [],
            defaultAttrs: [],
            disabledAttrs: [],
            layout: 'default',
          }),
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provideBuilderI18n({ t: (key: string) => key })
      },
      render() {
        return h(BuilderField, {
          field: { ...textField },
          isSelected: false,
          isEditing: false,
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    expect(wrapper.find('[data-qa="preview-help-icon"]').exists()).toBe(false)
    expect(wrapper.find('[data-qa="preview-help-tip"]').exists()).toBe(false)
  })

  function mountReal(
    field: FormDataField,
    extra: { fieldId?: string; isEditing?: boolean } = {},
  ): ReturnType<typeof mount> {
    const ParentComponent = defineComponent({
      setup() {
        const registry = useFieldRegistry()
        registerBuiltinControls(registry.register)
        provideBuilderRegistry({
          getDefinition: registry.getDefinition,
          getAllTypes: registry.getAllTypes,
          getSubtypes: registry.getSubtypes,
          isActive: registry.isActive,
          getDefaultAttrs: registry.getDefaultAttrs,
          resolveComponent: registry.resolveComponent,
        })
        provideBuilderI18n({ t: (key: string) => `t:${key}` })
      },
      render() {
        return h(BuilderField, {
          field,
          fieldId: extra.fieldId,
          isSelected: false,
          isEditing: extra.isEditing ?? false,
          disabledAttrs: [],
        })
      },
    })
    return mount(ParentComponent, { attachTo: document.body })
  }

  it('forwards attribute edits of a nameless header keyed by its fieldId', async () => {
    const wrapper = mountReal(
      { type: FieldType.Header, subtype: 'h1', label: 'Preset form', access: false },
      { fieldId: 'internal-hdr', isEditing: true },
    )
    await wrapper.findComponent(BuilderEditPanel).find('[data-qa="attr-text"]').setValue('Edited')
    const emitted = wrapper.findComponent(BuilderField).emitted('update:field')
    expect(emitted?.[0]?.[0]).toEqual({ fieldId: 'internal-hdr', updates: { label: 'Edited' } })
  })

  it('forwards attribute edits keyed by fieldId rather than a duplicated name', async () => {
    const wrapper = mountReal(
      { ...textField, name: 'dup' },
      { fieldId: 'internal-3', isEditing: true },
    )
    await wrapper.findComponent(BuilderEditPanel).find('[data-qa="attr-text"]').setValue('x')
    const emitted = wrapper.findComponent(BuilderField).emitted('update:field')
    expect((emitted?.[0]?.[0] as { fieldId: string }).fieldId).toBe('internal-3')
  })

  it('passes an empty fieldId to the edit panel when neither fieldId nor name exist', () => {
    const wrapper = mountReal(
      { type: FieldType.Header, subtype: 'h1', label: 'H', access: false },
      { isEditing: true },
    )
    expect(wrapper.findComponent(BuilderEditPanel).props('fieldId')).toBe('')
  })

  it('is draggable by the whole card while not editing', () => {
    const wrapper = mountReal(textField)
    expect(wrapper.find('[data-qa="builder-field"]').attributes('draggable')).toBe('true')
    expect(wrapper.find('[data-qa="field-header"]').attributes('draggable')).toBeUndefined()
  })

  it('does not make the edit panel inputs part of a draggable while editing (text selection works)', async () => {
    const wrapper = mountReal(textField, { fieldId: 'f1', isEditing: true })
    expect(wrapper.find('[data-qa="builder-field"]').attributes('draggable')).toBe('false')
    const header = wrapper.find('[data-qa="field-header"]')
    expect(header.attributes('draggable')).toBe('true')
    await header.trigger('dragstart')
    expect(wrapper.findComponent(BuilderField).emitted('dragstart')?.[0]?.[0]).toMatchObject({ fieldId: 'f1' })
  })

  it('previews the options marked selected', () => {
    const values = [
      { label: 'Option 1', value: 'option-1', selected: false },
      { label: 'Option 2', value: 'option-2', selected: true },
    ]
    const select = mountReal({ type: FieldType.Select, label: 'S', name: 's', access: false, values })
    expect((select.find('select').element as HTMLSelectElement).value).toBe('option-2')

    const radio = mountReal({ type: FieldType.RadioGroup, label: 'R', name: 'r', access: false, values })
    const radios = radio.findAll('input[type="radio"]').map((el) => (el.element as HTMLInputElement).checked)
    expect(radios).toEqual([false, true])
  })

  it('previews nothing selected when the field has no values', () => {
    const wrapper = mountReal({ type: FieldType.Select, label: 'S', name: 's', access: false })
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.findAll('select option:checked')).toHaveLength(0)
  })

  it('keeps the required marker and help icon visible when the label is empty', () => {
    const wrapper = mountReal({ ...textField, label: '', required: true, description: 'desc' })
    expect(wrapper.find('[data-qa="preview-required"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="preview-help-icon"]').exists()).toBe(true)
  })

  it('renders no preview label for an empty label without required or help', () => {
    const wrapper = mountReal({ ...textField, label: '' })
    expect(wrapper.find('[data-qa="preview-label"]').exists()).toBe(false)
  })

  it('gives the action buttons accessible names describing the action', () => {
    const wrapper = mountReal(textField, { fieldId: 'f1' })
    const edit = wrapper.find('[data-qa="field-edit-btn"]')
    const copy = wrapper.find('[data-qa="field-copy-btn"]')
    const remove = wrapper.find('[data-qa="field-remove-btn"]')
    expect(edit.attributes('aria-label')).toBe('t:editField')
    expect(edit.attributes('title')).toBe('t:editField')
    expect(copy.attributes('aria-label')).toBe('t:copyField')
    expect(copy.attributes('title')).toBe('t:copyField')
    expect(remove.attributes('aria-label')).toBe('t:removeField')
    expect(remove.attributes('title')).toBe('t:removeField')
    expect(edit.attributes('aria-pressed')).toBe('false')
  })

  it('falls back to i18n keys for action names without an i18n provider', () => {
    const wrapper = mount(BuilderField, {
      props: { field: textField, isSelected: false, isEditing: true, disabledAttrs: [] },
    })
    expect(wrapper.find('[data-qa="field-edit-btn"]').attributes('aria-label')).toBe('editField')
    expect(wrapper.find('[data-qa="field-edit-btn"]').attributes('aria-pressed')).toBe('true')
  })

  it('makes the help icon keyboard reachable and describes it by its tooltip', () => {
    const wrapper = mountReal({ ...textField, description: 'Full legal name' })
    const icon = wrapper.find('[data-qa="preview-help-icon"]')
    const tip = wrapper.find('[data-qa="preview-help-tip"]')
    expect(icon.attributes('tabindex')).toBeUndefined()
    expect(icon.attributes('aria-label')).toBe('t:description')
    const tipId = tip.attributes('id') ?? ''
    expect(tipId).not.toBe('')
    expect(icon.attributes('aria-describedby')).toBe(tipId)
    expect(wrapper.find(`[id="${tipId}"]`).text()).toBe('Full legal name')
    wrapper.unmount()
  })
})
