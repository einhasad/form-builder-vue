import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import FormRenderer from '../components/FormRenderer.vue'
import RendererField from '../components/RendererField.vue'
import { provideBuilderRegistry, type BuilderRegistryContext } from '../state/builderRegistry'

const options = [
  { label: 'A', value: 'a', selected: false },
  { label: 'B', value: 'b', selected: false },
]

function render(formData: FormDataField[]): VueWrapper {
  const wrapper: VueWrapper = mount(FormRenderer, { props: { formData }, attachTo: document.body })
  return wrapper
}

function fieldAt(wrapper: VueWrapper, index: number): HTMLElement {
  const field = wrapper.findAll<HTMLElement>('[data-qa="renderer-field"]')[index]
  if (!field) {
    throw new Error(`no renderer field at ${String(index)}`)
  }
  return field.element
}

function labelledControl(field: HTMLElement, selector: string): HTMLInputElement {
  const control = field.querySelector<HTMLInputElement>(selector)
  if (!control) {
    throw new Error(`no control ${selector}`)
  }
  return control
}

describe('RendererField className', () => {
  it('puts className on the control only', () => {
    const wrapper = render([{ type: FieldType.Text, subtype: 'text', label: 'Name', name: 'n', className: 'form-control' }])

    expect(fieldAt(wrapper, 0).classList.contains('form-control')).toBe(false)
    expect(wrapper.find('[data-qa="control-input"]').classes()).toContain('form-control')
    wrapper.unmount()
  })
})

describe('RendererField label linking', () => {
  it.each([
    { kind: 'text', attrs: { type: FieldType.Text, subtype: 'text' }, selector: '[data-qa="control-input"]' },
    { kind: 'select', attrs: { type: FieldType.Select, values: options }, selector: '[data-qa="control-select"]' },
    { kind: 'textarea', attrs: { type: FieldType.Textarea }, selector: '[data-qa="control-textarea"]' },
    { kind: 'file', attrs: { type: FieldType.File }, selector: '[data-qa="control-file"]' },
    { kind: 'autocomplete', attrs: { type: FieldType.Autocomplete, values: options }, selector: '[data-qa="autocomplete-input"]' },
    { kind: 'checkbox', attrs: { type: FieldType.Checkbox }, selector: '[data-qa="checkbox-single-input"]' },
  ])('links the label to the $kind control', ({ attrs, selector }) => {
    const wrapper = render([{ label: 'Question', name: 'q', ...attrs } as FormDataField])
    const control = labelledControl(fieldAt(wrapper, 0), selector)
    const label = fieldAt(wrapper, 0).querySelector('label.field-label')

    expect(control.id).not.toBe('')
    expect(label?.getAttribute('for')).toBe(control.id)
    expect(Array.from(control.labels ?? [])).toContain(label)
    wrapper.unmount()
  })

  it('gives every field its own id', () => {
    const wrapper = render([
      { type: FieldType.Text, subtype: 'text', label: 'One', name: 'one' },
      { type: FieldType.Text, subtype: 'text', label: 'Two', name: 'two' },
    ])
    const ids = wrapper.findAll('[data-qa="control-input"]').map((input) => input.attributes('id'))

    expect(new Set(ids).size).toBe(2)
    wrapper.unmount()
  })

  it.each([FieldType.CheckboxGroup, FieldType.RadioGroup])('names a %s through role=group and aria-labelledby', (type) => {
    const wrapper = render([{ type, label: 'Pick some', name: 'g', values: options }])
    const field = fieldAt(wrapper, 0)
    const labelId = field.getAttribute('aria-labelledby') ?? ''

    expect(field.getAttribute('role')).toBe('group')
    expect(document.getElementById(labelId)?.textContent.trim()).toBe('Pick some')
    expect(field.querySelector('label.field-label')).toBeNull()
    wrapper.unmount()
  })

  it('passes no id when the field has no label', () => {
    const wrapper = render([{ type: FieldType.Text, subtype: 'text', label: '', name: 'n' }])

    expect(wrapper.find('[data-qa="field-label"]').exists()).toBe(false)
    expect(wrapper.find('[data-qa="control-input"]').attributes('id')).toBeUndefined()
    wrapper.unmount()
  })

  it('does not label noLabel controls', () => {
    const wrapper = render([{ type: FieldType.Button, label: 'Go', name: 'go', subtype: 'button' }])

    expect(wrapper.find('[data-qa="field-label"]').exists()).toBe(false)
    expect(wrapper.find('[data-qa="control-button"]').attributes('id')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('RendererField help text', () => {
  it('keeps the help button keyboard reachable and describes the control', () => {
    const wrapper = render([{ type: FieldType.Text, subtype: 'text', label: 'Name', name: 'n', description: 'Your full name' }])
    const helpIcon = wrapper.find('[data-qa="field-help-icon"]')
    const tip = wrapper.find('[data-qa="field-help-tip"]')

    expect(helpIcon.attributes('tabindex')).toBeUndefined()
    expect(wrapper.find('[data-qa="control-input"]').attributes('aria-describedby')).toBe(tip.attributes('id'))
    expect(tip.text()).toBe('Your full name')
    wrapper.unmount()
  })

  it('describes a group with its help text', () => {
    const wrapper = render([{ type: FieldType.RadioGroup, label: 'Size', name: 's', values: options, description: 'Pick one' }])

    expect(fieldAt(wrapper, 0).getAttribute('aria-describedby')).toBe(wrapper.find('[data-qa="field-help-tip"]').attributes('id'))
    wrapper.unmount()
  })

  it('omits aria-describedby without help text', () => {
    const wrapper = render([{ type: FieldType.Text, subtype: 'text', label: 'Name', name: 'n' }])

    expect(wrapper.find('[data-qa="control-input"]').attributes('aria-describedby')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('RendererField registry fallbacks', () => {
  const textField: FormDataField = { type: FieldType.Text, label: 'Name', name: 'n' }

  function mountWithRegistry(registry: BuilderRegistryContext | undefined, field: FormDataField): VueWrapper {
    const wrapper: VueWrapper = mount(defineComponent({
      setup: () => {
        if (registry) {
          provideBuilderRegistry(registry)
        }
        return () => h(RendererField, { field, modelValue: [], disabled: false })
      },
    }))
    return wrapper
  }

  it('renders only the label without a registry', () => {
    const wrapper = mountWithRegistry(undefined, textField)

    expect(wrapper.find('[data-qa="field-label"]').text()).toBe('Name')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('renders only the label for an unregistered type', () => {
    const wrapper = render([{ ...textField, type: 'unknown' as FieldType }])

    expect(wrapper.find('[data-qa="field-label"]').text()).toBe('Name')
    expect(wrapper.find('input').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders nothing for a hidden-layout type without a component', () => {
    const wrapper = mountWithRegistry({
      getDefinition: () => ({
        type: FieldType.Hidden,
        subtypes: [],
        label: 'Hidden',
        icon: '',
        inactive: [],
        defaultAttrs: [],
        disabledAttrs: [],
        layout: 'hidden',
      }),
      getAllTypes: () => [],
      getSubtypes: () => [],
      isActive: () => true,
      getDefaultAttrs: () => [],
      resolveComponent: () => undefined,
    }, textField)

    expect(wrapper.find('[data-qa="renderer-field"]').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('names no label for an unlabelled group', () => {
    const wrapper = render([{ type: FieldType.CheckboxGroup, label: '', name: 'g', values: options }])

    expect(fieldAt(wrapper, 0).getAttribute('role')).toBe('group')
    expect(fieldAt(wrapper, 0).hasAttribute('aria-labelledby')).toBe(false)
    wrapper.unmount()
  })
})

