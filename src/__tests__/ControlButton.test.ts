import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlButton from '../components/controls/ControlButton.vue'

function buttonField(subtype?: string): FormDataField {
  return { type: FieldType.Button, label: 'Go', name: 'go', value: 'go-value', subtype }
}

describe('ControlButton', () => {
  it('is not an answer: clicking emits nothing', async () => {
    const wrapper = mount(ControlButton, { props: { field: buttonField('button'), modelValue: [] } })

    await wrapper.find('[data-qa="control-button"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders type button when no subtype is set', () => {
    const wrapper = mount(ControlButton, { props: { field: buttonField(), modelValue: [] } })

    expect(wrapper.find('[data-qa="control-button"]').attributes('type')).toBe('button')
  })

  it('submits the enclosing form when it is a submit button', () => {
    const form = document.createElement('form')
    document.body.appendChild(form)
    const onSubmit = vi.fn((event: Event) => { event.preventDefault() })
    form.addEventListener('submit', onSubmit)
    const wrapper = mount(ControlButton, {
      props: { field: buttonField('submit'), modelValue: [] },
      attachTo: form,
    })

    wrapper.find<HTMLButtonElement>('[data-qa="control-button"]').element.click()

    expect(onSubmit).toHaveBeenCalledOnce()
    wrapper.unmount()
    form.remove()
  })
})
