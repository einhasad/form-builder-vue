import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlAutocomplete from '../components/controls/ControlAutocomplete.vue'

const fruitField: FormDataField = {
  type: FieldType.Autocomplete,
  label: 'Fruit',
  name: 'fruit',
  access: false,
  requireValidOption: false,
  values: [
    { label: 'Apple', value: 'apple', selected: false },
    { label: 'Banana', value: 'banana', selected: true },
    { label: 'Cherry', value: 'cherry', selected: false },
  ],
}

function mountWithVModel(field: FormDataField, modelValue: string[]): VueWrapper {
  const wrapper: VueWrapper = mount(ControlAutocomplete, {
    props: {
      field,
      modelValue,
      'onUpdate:modelValue': (value: string[]) => { void wrapper.setProps({ modelValue: value }) },
    },
  })
  return wrapper
}

function lastEmitted(wrapper: VueWrapper): unknown {
  const events = wrapper.emitted('update:modelValue') ?? []
  return events[events.length - 1]?.[0]
}

function input(wrapper: VueWrapper): HTMLInputElement {
  return wrapper.find<HTMLInputElement>('[data-qa="autocomplete-input"]').element
}

describe('ControlAutocomplete answers', () => {
  it('stores free text when requireValidOption is false', async () => {
    const wrapper = mountWithVModel(fruitField, [])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('zzz')
    expect(lastEmitted(wrapper)).toEqual(['zzz'])

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('blur')
    expect(input(wrapper).value).toBe('zzz')
  })

  it('replaces a selected option when the text is edited', async () => {
    const wrapper = mountWithVModel(fruitField, ['banana'])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('Banxx')
    expect(lastEmitted(wrapper)).toEqual(['Banxx'])
  })

  it('clears the answer when the text is emptied', async () => {
    const wrapper = mountWithVModel(fruitField, ['banana'])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('')
    expect(lastEmitted(wrapper)).toEqual([])
    expect(input(wrapper).value).toBe('')
  })

  it('maps text equal to an option label to the option value', async () => {
    const wrapper = mountWithVModel(fruitField, [])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('cherry')
    expect(lastEmitted(wrapper)).toEqual(['cherry'])

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('blur')
    expect(input(wrapper).value).toBe('Cherry')
  })

  it('shows the option label for a preset value', () => {
    const wrapper = mount(ControlAutocomplete, { props: { field: fruitField, modelValue: ['banana'] } })

    expect(input(wrapper).value).toBe('Banana')
  })

  it('shows the label after picking an option', async () => {
    const wrapper = mountWithVModel(fruitField, [])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('an')
    await wrapper.findAll('[data-qa="autocomplete-option"]')[0]?.trigger('mousedown')
    expect(lastEmitted(wrapper)).toEqual(['banana'])
    expect(input(wrapper).value).toBe('Banana')
  })

  it('drops the typed text when the answer is reset from outside', async () => {
    const wrapper = mountWithVModel(fruitField, [])
    await wrapper.find('[data-qa="autocomplete-input"]').setValue('zzz')

    await wrapper.setProps({ modelValue: [] })
    expect(input(wrapper).value).toBe('')
  })
})

describe('ControlAutocomplete requireValidOption', () => {
  const strictField: FormDataField = { ...fruitField, requireValidOption: true }

  it('does not store text that matches no option and flags it invalid', async () => {
    const wrapper = mountWithVModel(strictField, ['banana'])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('zzz')
    expect(lastEmitted(wrapper)).toEqual([])
    expect(input(wrapper).getAttribute('aria-invalid')).toBe('true')
  })

  it('clears invalid text on blur', async () => {
    const wrapper = mountWithVModel(strictField, [])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('zzz')
    await wrapper.find('[data-qa="autocomplete-input"]').trigger('blur')
    expect(input(wrapper).value).toBe('')
    expect(input(wrapper).hasAttribute('aria-invalid')).toBe(false)
  })

  it('accepts text equal to an option label', async () => {
    const wrapper = mountWithVModel(strictField, [])

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('Apple')
    expect(lastEmitted(wrapper)).toEqual(['apple'])
    expect(input(wrapper).hasAttribute('aria-invalid')).toBe(false)
  })
})
