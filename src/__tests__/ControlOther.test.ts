import { describe, it, expect } from 'vitest'
import type { Component } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlRadioGroup from '../components/controls/ControlRadioGroup.vue'
import ControlCheckboxGroup from '../components/controls/ControlCheckboxGroup.vue'
import FormRenderer from '../components/FormRenderer.vue'

const radioField: FormDataField = {
  type: FieldType.RadioGroup,
  label: 'Size',
  name: 'size',
  access: false,
  other: true,
  values: [
    { label: 'Small', value: 'sm', selected: false },
    { label: 'Large', value: 'lg', selected: false },
  ],
}

const checkboxField: FormDataField = {
  type: FieldType.CheckboxGroup,
  label: 'Colors',
  name: 'colors',
  access: false,
  other: true,
  values: [
    { label: 'Red', value: 'red', selected: false },
    { label: 'Blue', value: 'blue', selected: false },
  ],
}

function lastEmitted(wrapper: VueWrapper): unknown {
  const events = wrapper.emitted('update:modelValue') ?? []
  return events[events.length - 1]?.[0]
}

function mountWithVModel(component: Component, field: FormDataField, modelValue: string[]): VueWrapper {
  const wrapper: VueWrapper = mount(component, {
    props: {
      field,
      modelValue,
      'onUpdate:modelValue': (value: string[]) => { void wrapper.setProps({ modelValue: value }) },
    },
  })
  return wrapper
}

describe('ControlRadioGroup "Other" answer', () => {
  it('stores the typed text as the answer', async () => {
    const wrapper = mountWithVModel(ControlRadioGroup, radioField, [])

    await wrapper.find('[data-qa="radio-other-input"]').setValue(true)
    expect(lastEmitted(wrapper)).toEqual([])

    await wrapper.find('[data-qa="radio-other-text"]').setValue('Medium')
    expect(lastEmitted(wrapper)).toEqual(['Medium'])
    expect(wrapper.find<HTMLInputElement>('[data-qa="radio-other-input"]').element.checked).toBe(true)
  })

  it('keeps "Other" checked while the typed text is emptied', async () => {
    const wrapper = mountWithVModel(ControlRadioGroup, radioField, ['Medium'])

    await wrapper.find('[data-qa="radio-other-text"]').setValue('')
    expect(lastEmitted(wrapper)).toEqual([])
    expect(wrapper.find('[data-qa="radio-other-text"]').exists()).toBe(true)
  })

  it('replaces the "Other" text when a regular option is picked', async () => {
    const wrapper = mountWithVModel(ControlRadioGroup, radioField, ['Medium'])

    await wrapper.findAll('[data-qa="radio-input"]')[1]?.setValue(true)
    expect(lastEmitted(wrapper)).toEqual(['lg'])
    expect(wrapper.find('[data-qa="radio-other-text"]').exists()).toBe(false)
  })

  it('restores a saved "Other" answer into the text box', () => {
    const wrapper = mount(ControlRadioGroup, { props: { field: radioField, modelValue: ['Medium'] } })

    expect(wrapper.find<HTMLInputElement>('[data-qa="radio-other-input"]').element.checked).toBe(true)
    expect(wrapper.find<HTMLInputElement>('[data-qa="radio-other-text"]').element.value).toBe('Medium')
    expect(wrapper.findAll<HTMLInputElement>('[data-qa="radio-input"]').some((r) => r.element.checked)).toBe(false)
  })

  it('unselects "Other" when the answer is reset from outside', async () => {
    const wrapper = mount(ControlRadioGroup, { props: { field: radioField, modelValue: ['Medium'] } })

    await wrapper.setProps({ modelValue: [] })
    expect(wrapper.find('[data-qa="radio-other-text"]').exists()).toBe(false)
  })

  it('unselects an empty "Other" when an option is set from outside', async () => {
    const wrapper = mount(ControlRadioGroup, { props: { field: radioField, modelValue: [] } })
    await wrapper.find('[data-qa="radio-other-input"]').setValue(true)

    await wrapper.setProps({ modelValue: ['sm'] })
    expect(wrapper.find('[data-qa="radio-other-text"]').exists()).toBe(false)
  })
})

describe('ControlCheckboxGroup "Other" answer', () => {
  it('stores the typed text next to checked options', async () => {
    const wrapper = mountWithVModel(ControlCheckboxGroup, checkboxField, [])

    await wrapper.findAll('[data-qa="checkbox-input"]')[0]?.setValue(true)
    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(true)
    expect(lastEmitted(wrapper)).toEqual(['red'])

    await wrapper.find('[data-qa="checkbox-other-text"]').setValue('Green')
    expect(lastEmitted(wrapper)).toEqual(['red', 'Green'])

    await wrapper.find('[data-qa="checkbox-other-text"]').setValue('Teal')
    expect(lastEmitted(wrapper)).toEqual(['red', 'Teal'])
  })

  it('keeps the "Other" text when options are toggled', async () => {
    const wrapper = mountWithVModel(ControlCheckboxGroup, checkboxField, ['Green'])

    await wrapper.findAll('[data-qa="checkbox-input"]')[1]?.setValue(true)
    expect(lastEmitted(wrapper)).toEqual(['blue', 'Green'])
  })

  it('drops the "Other" text when "Other" is unchecked', async () => {
    const wrapper = mountWithVModel(ControlCheckboxGroup, checkboxField, ['red', 'Green'])

    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(false)
    expect(lastEmitted(wrapper)).toEqual(['red'])
    expect(wrapper.find('[data-qa="checkbox-other-text"]').exists()).toBe(false)
  })

  it('restores a saved "Other" answer into the text box', () => {
    const wrapper = mount(ControlCheckboxGroup, { props: { field: checkboxField, modelValue: ['blue', 'Green'] } })

    expect(wrapper.find<HTMLInputElement>('[data-qa="checkbox-other-input"]').element.checked).toBe(true)
    expect(wrapper.find<HTMLInputElement>('[data-qa="checkbox-other-text"]').element.value).toBe('Green')
  })

  it('keeps an empty "Other" checked when options change from outside', async () => {
    const wrapper = mount(ControlCheckboxGroup, { props: { field: checkboxField, modelValue: [] } })
    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(true)

    await wrapper.setProps({ modelValue: ['red'] })
    expect(wrapper.find('[data-qa="checkbox-other-text"]').exists()).toBe(true)
  })

  it('treats every answer as "Other" text when the field has no options', () => {
    const field: FormDataField = { ...checkboxField }
    delete field.values
    const wrapper = mount(ControlCheckboxGroup, { props: { field, modelValue: ['Green'] } })

    expect(wrapper.find<HTMLInputElement>('[data-qa="checkbox-other-text"]').element.value).toBe('Green')
  })
})

describe('FormRenderer "Other" answers', () => {
  it('exposes typed "Other" text in userData', async () => {
    const wrapper = mount(FormRenderer, { props: { formData: [radioField, checkboxField] } })

    await wrapper.find('[data-qa="radio-other-input"]').setValue(true)
    await wrapper.find('[data-qa="radio-other-text"]').setValue('my other radio')
    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(true)
    await wrapper.find('[data-qa="checkbox-other-text"]').setValue('my other cb')

    const vm = wrapper.vm as unknown as { userData: () => { name: string; userData: string[] }[] }
    expect(vm.userData()).toEqual([
      { name: 'size', userData: ['my other radio'] },
      { name: 'colors', userData: ['my other cb'] },
    ])
  })
})
