import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import ControlParagraph from '../components/controls/ControlParagraph.vue'
import ControlTextarea from '../components/controls/ControlTextarea.vue'

describe('legacy rich subtypes', () => {
  it('renders a canvas paragraph as visible text', () => {
    const wrapper = mount(ControlParagraph, {
      props: { field: { type: FieldType.Paragraph, subtype: 'canvas', label: 'Canvas label text' }, modelValue: [] },
    })
    const paragraph = wrapper.find('[data-qa="control-paragraph"]')

    expect(paragraph.element.tagName).toBe('P')
    expect(paragraph.text()).toBe('Canvas label text')
    expect(paragraph.attributes('data-subtype')).toBe('canvas')
  })

  it('renders a quill textarea as a plain textarea that still emits answers', async () => {
    const wrapper = mount(ControlTextarea, {
      props: { field: { type: FieldType.Textarea, subtype: 'quill', label: 'Notes', name: 'notes' }, modelValue: [] },
    })

    await wrapper.find('textarea[data-qa="control-textarea"]').setValue('rich')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(['rich'])
  })
})
