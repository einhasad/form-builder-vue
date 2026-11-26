import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlSelect from '../components/controls/ControlSelect.vue'

function selectField(multiple: boolean): FormDataField {
  return {
    type: FieldType.Select,
    label: 'Pick',
    name: 'pick',
    placeholder: 'Pick one',
    multiple,
    values: [
      { label: 'A', value: 'a', selected: false },
      { label: 'B', value: 'b', selected: false },
    ],
  }
}

describe('ControlSelect placeholder', () => {
  it('is neither selected nor selectable in a multiple select', async () => {
    const wrapper = mount(ControlSelect, { props: { field: selectField(true), modelValue: [] } })
    const select = wrapper.find<HTMLSelectElement>('[data-qa="control-select"]')
    const placeholder = wrapper.find<HTMLOptionElement>('[data-qa="select-placeholder"]')

    expect(placeholder.element.disabled).toBe(true)
    expect(Array.from(select.element.selectedOptions)).toEqual([])

    const options = wrapper.findAll<HTMLOptionElement>('[data-qa="select-option"]')
    options.forEach((option) => { option.element.selected = true })
    await select.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['a', 'b'])
  })

  it('is shown selected in an unanswered single select', () => {
    const wrapper = mount(ControlSelect, { props: { field: selectField(false), modelValue: [] } })
    const placeholder = wrapper.find<HTMLOptionElement>('[data-qa="select-placeholder"]')

    expect(placeholder.element.disabled).toBe(false)
    expect(wrapper.find<HTMLSelectElement>('[data-qa="control-select"]').element.value).toBe('')
  })
})
