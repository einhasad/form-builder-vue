import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, provide, defineComponent } from 'vue'
import BuilderField from '../components/BuilderField.vue'
import { FIELD_REGISTRY_KEY, I18N_KEY } from '../types/injection-keys'
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
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
          getDefinition: () => undefined,
          getAllTypes: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
          getDefaultAttrs: () => [] as string[],
          resolveComponent: () => undefined,
        })
        provide(I18N_KEY, { t: (key: string) => `[${key}]` })
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
        provide(FIELD_REGISTRY_KEY, {
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
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
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
        provide(I18N_KEY, { t: (key: string) => key })
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
        provide(FIELD_REGISTRY_KEY, {
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
        provide(I18N_KEY, { t: (key: string) => key })
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
    expect(wrapper.find('[data-qa="preview-help-icon"]').attributes('aria-label')).toBe('Full legal name')
    expect(wrapper.find('[data-qa="preview-help-tip"]').text()).toBe('Full legal name')
  })

  it('omits help wrap when field.description is empty', () => {
    const ParentComponent = defineComponent({
      setup() {
        provide(FIELD_REGISTRY_KEY, {
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
        provide(I18N_KEY, { t: (key: string) => key })
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
})
