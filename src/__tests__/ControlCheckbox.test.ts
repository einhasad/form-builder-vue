import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlCheckbox from '../components/controls/ControlCheckbox.vue'

describe('ControlCheckbox', () => {
  const agree: FormDataField = { type: FieldType.Checkbox, label: 'Agree', name: 'agree', value: 'yes' }

  it('emits its value when checked and nothing when unchecked', async () => {
    const wrapper = mount(ControlCheckbox, { props: { field: agree, modelValue: [] } })
    const input = wrapper.find('[data-qa="checkbox-single-input"]')

    await input.setValue(true)
    await input.setValue(false)

    expect(wrapper.emitted('update:modelValue')).toEqual([[['yes']], [[]]])
    expect(wrapper.find('.checkbox-single-caption').text()).toBe('yes')
  })

  it('uses "on" as value when the field has none', async () => {
    const wrapper = mount(ControlCheckbox, { props: { field: { ...agree, value: undefined }, modelValue: ['on'] } })

    expect(wrapper.find<HTMLInputElement>('[data-qa="checkbox-single-input"]').element.checked).toBe(true)
    await wrapper.find('[data-qa="checkbox-single-input"]').setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual([])
  })

  it('forwards fallthrough attributes to the input', () => {
    const wrapper = mount(ControlCheckbox, { props: { field: agree, modelValue: [] }, attrs: { id: 'x-1' } })

    expect(wrapper.find('[data-qa="checkbox-single-input"]').attributes('id')).toBe('x-1')
    expect(wrapper.find('[data-qa="control-checkbox"]').attributes('id')).toBeUndefined()
  })
})
