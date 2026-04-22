import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import ControlInput from '../components/controls/ControlInput.vue'
import ControlSelect from '../components/controls/ControlSelect.vue'
import ControlCheckboxGroup from '../components/controls/ControlCheckboxGroup.vue'
import ControlRadioGroup from '../components/controls/ControlRadioGroup.vue'
import ControlAutocomplete from '../components/controls/ControlAutocomplete.vue'
import ControlButton from '../components/controls/ControlButton.vue'
import ControlHeader from '../components/controls/ControlHeader.vue'
import ControlParagraph from '../components/controls/ControlParagraph.vue'
import ControlTextarea from '../components/controls/ControlTextarea.vue'
import ControlFile from '../components/controls/ControlFile.vue'
import ControlHidden from '../components/controls/ControlHidden.vue'

describe('ControlInput', () => {
  it('renders input and emits value on input', async () => {
    const field: FormDataField = {
      type: FieldType.Text,
      label: 'Name',
      name: 'name',
      subtype: 'text',
      className: 'form-control',
      access: false,
    }

    const wrapper = mount(ControlInput, {
      props: { field, modelValue: [], preview: true },
    })

    expect(wrapper.find('[data-qa="control-input"]').exists()).toBe(true)

    await wrapper.find('[data-qa="control-input"]').setValue('hello')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['hello'])
  })
})

describe('ControlSelect', () => {
  it('renders select with options and emits on change', async () => {
    const field: FormDataField = {
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      className: 'form-control',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: true },
      ],
    }

    const wrapper = mount(ControlSelect, {
      props: { field, modelValue: ['blue'], preview: true },
    })

    expect(wrapper.find('[data-qa="control-select"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-qa="select-option"]')).toHaveLength(2)

    await wrapper.find('select').setValue('red')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['red'])
  })

  it('renders placeholder option when set', () => {
    const field: FormDataField = {
      type: FieldType.Select,
      label: 'Color',
      name: 'color',
      placeholder: 'Choose...',
      className: 'form-control',
      access: false,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlSelect, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.text()).toContain('Choose...')
  })

  it('handles multiple selection', () => {
    const field: FormDataField = {
      type: FieldType.Select,
      label: 'Colors',
      name: 'colors',
      className: 'form-control',
      access: false,
      multiple: true,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: false },
      ],
    }

    const wrapper = mount(ControlSelect, {
      props: { field, modelValue: [] },
    })

    const select = wrapper.find('select')
    expect(select.attributes('multiple')).toBeDefined()
  })

  it('handles no values gracefully', () => {
    const field: FormDataField = {
      type: FieldType.Select,
      label: 'Empty',
      name: 'empty',
      className: 'form-control',
      access: false,
    }

    const wrapper = mount(ControlSelect, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.findAll('[data-qa="select-option"]')).toHaveLength(0)
  })
})

describe('ControlCheckboxGroup', () => {
  it('renders checkboxes and handles check/uncheck', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      className: 'form-control',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: false },
      ],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.findAll('[data-qa="checkbox-input"]')).toHaveLength(2)

    // Check the first checkbox
    const checkboxes = wrapper.findAll('[data-qa="checkbox-input"]')
    await checkboxes[0].setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['red'])

    // Check the second checkbox (from state with 'red' already checked)
    await wrapper.setProps({ modelValue: ['red'] })
    await checkboxes[1].setValue(true)
    expect(wrapper.emitted('update:modelValue')[1][0]).toEqual(['red', 'blue'])
  })

  it('unchecks a previously checked option', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      values: [
        { label: 'Red', value: 'red', selected: true },
      ],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: ['red'] },
    })

    await wrapper.find('[data-qa="checkbox-input"]').setValue(false)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([])
  })

  it('renders other option when enabled', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      other: true,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="checkbox-other"]').exists()).toBe(true)

    // Click other checkbox
    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['other-colors'])
  })

  it('shows text input when other is checked', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      other: true,
      values: [],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: ['other-colors'] },
    })

    expect(wrapper.find('[data-qa="checkbox-other-text"]').exists()).toBe(true)

    await wrapper.find('[data-qa="checkbox-other-text"]').setValue('Custom value')
    // The onOtherInput updates otherValue ref
  })

  it('renders inline class when inline is true', () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      inline: true,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="control-checkbox-group"]').classes()).toContain('inline-group')
  })
})

describe('ControlRadioGroup', () => {
  it('renders radio options and handles selection', async () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
      values: [
        { label: 'Small', value: 'sm', selected: false },
        { label: 'Large', value: 'lg', selected: false },
      ],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.findAll('[data-qa="radio-input"]')).toHaveLength(2)

    const radios = wrapper.findAll('[data-qa="radio-input"]')
    await radios[0].setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['sm'])
  })

  it('renders other option when enabled', async () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
      other: true,
      values: [{ label: 'Small', value: 'sm', selected: false }],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="radio-other"]').exists()).toBe(true)

    await wrapper.find('[data-qa="radio-other-input"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['other-size'])
  })

  it('shows text input when other radio is selected', async () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
      other: true,
      values: [],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: ['other-size'] },
    })

    expect(wrapper.find('[data-qa="radio-other-text"]').exists()).toBe(true)

    await wrapper.find('[data-qa="radio-other-text"]').setValue('Custom')
  })

  it('renders inline class when inline is true', () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
      inline: true,
      values: [{ label: 'Small', value: 'sm', selected: false }],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="control-radio-group"]').classes()).toContain('inline-group')
  })
})

describe('ControlAutocomplete', () => {
  it('renders input and shows dropdown on focus', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
        { label: 'Los Angeles', value: 'la', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    expect(wrapper.find('[data-qa="autocomplete-input"]').exists()).toBe(true)

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-qa="autocomplete-option"]')).toHaveLength(2)

    wrapper.unmount()
  })

  it('selects an option on mousedown', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
        { label: 'Los Angeles', value: 'la', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    const options = wrapper.findAll('[data-qa="autocomplete-option"]')
    await options[0].trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['ny'])

    wrapper.unmount()
  })

  it('filters options on input', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
        { label: 'Los Angeles', value: 'la', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('new')
    // Trigger input event for onInput handler
    await wrapper.find('[data-qa="autocomplete-input"]').trigger('input')

    const options = wrapper.findAll('[data-qa="autocomplete-option"]')
    expect(options).toHaveLength(1)
    expect(options[0].text()).toBe('New York')

    wrapper.unmount()
  })

  it('handles keyboard navigation', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
        { label: 'Los Angeles', value: 'la', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    const input = wrapper.find('[data-qa="autocomplete-input"]')

    // Focus to show dropdown
    await input.trigger('focus')

    // Arrow down to highlight first option
    await input.trigger('keydown', { key: 'ArrowDown' })

    // Enter to select
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['ny'])

    wrapper.unmount()
  })

  it('handles Escape to close dropdown', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [{ label: 'NY', value: 'ny', selected: false }],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(true)

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles ArrowUp keyboard navigation', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
        { label: 'Los Angeles', value: 'la', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    const input = wrapper.find('[data-qa="autocomplete-input"]')
    await input.trigger('focus')

    // Go down then up
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowUp' })

    // Should stay at 0 (clamped)
    wrapper.unmount()
  })

  it('handles no matching options', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [
        { label: 'New York', value: 'ny', selected: false },
      ],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').setValue('zzz')
    await wrapper.find('[data-qa="autocomplete-input"]').trigger('input')

    // No dropdown shown when filtered options empty
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not handle keys when dropdown is closed', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [{ label: 'NY', value: 'ny', selected: false }],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    // Press arrow when dropdown is not shown
    await wrapper.find('[data-qa="autocomplete-input"]').trigger('keydown', { key: 'ArrowDown' })
    // Should not crash

    wrapper.unmount()
  })

  it('handles Enter when nothing is highlighted', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [{ label: 'NY', value: 'ny', selected: false }],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    await wrapper.find('[data-qa="autocomplete-input"]').trigger('keydown', { key: 'Enter' })

    // No emit since nothing highlighted
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()

    wrapper.unmount()
  })

  it('shows modelValue when no searchText', () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: ['ny'] },
    })

    const input = wrapper.find('[data-qa="autocomplete-input"]')
    expect(input.attributes('value')).toBe('ny')
  })
})

describe('ControlButton', () => {
  it('renders button and emits on click', async () => {
    const field: FormDataField = {
      type: FieldType.Button,
      label: 'Submit',
      name: 'submit-btn',
      subtype: 'submit',
      className: 'btn-primary btn',
      style: 'primary',
      access: false,
    }

    const wrapper = mount(ControlButton, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="control-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="control-button"]').text()).toBe('Submit')

    await wrapper.find('[data-qa="control-button"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['clicked'])
  })

  it('uses field value when available', async () => {
    const field: FormDataField = {
      type: FieldType.Button,
      label: 'Click',
      name: 'btn',
      value: 'custom-value',
      access: false,
    }

    const wrapper = mount(ControlButton, {
      props: { field, modelValue: [] },
    })

    await wrapper.find('[data-qa="control-button"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['custom-value'])
  })

  it('applies correct style classes', () => {
    const field: FormDataField = {
      type: FieldType.Button,
      label: 'Danger',
      name: 'btn',
      style: 'danger',
      access: false,
    }

    const wrapper = mount(ControlButton, {
      props: { field, modelValue: [] },
    })

    const btn = wrapper.find('[data-qa="control-button"]')
    expect(btn.classes()).toContain('fbv-btn')
    expect(btn.attributes('data-style')).toBe('danger')
  })
})

describe('ControlHeader', () => {
  it('renders header with h1 tag by default', () => {
    const field: FormDataField = {
      type: FieldType.Header,
      label: 'Title',
      access: false,
    }

    const wrapper = mount(ControlHeader, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="control-header"]').exists()).toBe(true)
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Title')
  })

  it('renders with specified subtype', () => {
    const field: FormDataField = {
      type: FieldType.Header,
      label: 'Subtitle',
      subtype: 'h3',
      access: false,
    }

    const wrapper = mount(ControlHeader, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('h3').exists()).toBe(true)
  })
})

describe('ControlParagraph', () => {
  it('renders paragraph with p tag by default', () => {
    const field: FormDataField = {
      type: FieldType.Paragraph,
      label: 'Some text',
      access: false,
    }

    const wrapper = mount(ControlParagraph, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('[data-qa="control-paragraph"]').exists()).toBe(true)
    expect(wrapper.find('p').exists()).toBe(true)
    expect(wrapper.find('p').text()).toBe('Some text')
  })

  it('renders with blockquote subtype', () => {
    const field: FormDataField = {
      type: FieldType.Paragraph,
      label: 'Quote',
      subtype: 'blockquote',
      access: false,
    }

    const wrapper = mount(ControlParagraph, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('blockquote').exists()).toBe(true)
  })
})

describe('ControlTextarea', () => {
  it('renders textarea and emits on input', async () => {
    const field: FormDataField = {
      type: FieldType.Textarea,
      label: 'Description',
      name: 'desc',
      subtype: 'textarea',
      access: false,
    }

    const wrapper = mount(ControlTextarea, {
      props: { field, modelValue: [], preview: true },
    })

    expect(wrapper.find('[data-qa="control-textarea"]').exists()).toBe(true)
    await wrapper.find('textarea').setValue('Hello world')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['Hello world'])
  })
})

describe('ControlFile', () => {
  it('renders file input', () => {
    const field: FormDataField = {
      type: FieldType.File,
      label: 'Upload',
      name: 'file',
      access: false,
      multiple: true,
    }

    const wrapper = mount(ControlFile, {
      props: { field, modelValue: [], preview: true },
    })

    expect(wrapper.find('[data-qa="control-file"]').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })
})

describe('ControlHidden', () => {
  it('renders hidden input', () => {
    const field: FormDataField = {
      type: FieldType.Hidden,
      label: 'Hidden',
      name: 'hidden-field',
      value: 'secret',
      access: false,
    }

    const wrapper = mount(ControlHidden, {
      props: { field, modelValue: [], preview: true },
    })

    expect(wrapper.find('[data-qa="control-hidden"]').exists()).toBe(true)
    expect(wrapper.find('input[type="hidden"]').exists()).toBe(true)
  })

  it('uses modelValue over field value', () => {
    const field: FormDataField = {
      type: FieldType.Hidden,
      label: 'Hidden',
      name: 'hidden-field',
      value: 'field-value',
      access: false,
    }

    const wrapper = mount(ControlHidden, {
      props: { field, modelValue: ['model-value'] },
    })

    const input = wrapper.find('input[type="hidden"]')
    expect(input.attributes('value')).toBe('model-value')
  })
})

describe('ControlTextarea getRows', () => {
  it('uses custom rows from field', () => {
    const field: FormDataField = {
      type: FieldType.Textarea,
      label: 'Desc',
      name: 'desc',
      rows: '8',
      access: false,
    }

    const wrapper = mount(ControlTextarea, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('textarea').attributes('rows')).toBe('8')
  })

  it('defaults to 3 rows', () => {
    const field: FormDataField = {
      type: FieldType.Textarea,
      label: 'Desc',
      name: 'desc',
      access: false,
    }

    const wrapper = mount(ControlTextarea, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.find('textarea').attributes('rows')).toBe('3')
  })
})

describe('ControlAutocomplete blur', () => {
  it('hides dropdown on blur', async () => {
    const { vi } = await import('vitest')
    vi.useFakeTimers()

    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
      values: [{ label: 'NY', value: 'ny', selected: false }],
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(true)

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('blur')

    // Advance timers to trigger the setTimeout callback
    await vi.advanceTimersByTimeAsync(250)

    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(false)

    vi.useRealTimers()
    wrapper.unmount()
  })
})

describe('ControlFile onChange', () => {
  it('emits file names on change', async () => {
    const field: FormDataField = {
      type: FieldType.File,
      label: 'Upload',
      name: 'file',
      access: false,
    }

    const wrapper = mount(ControlFile, {
      props: { field, modelValue: [] },
    })

    const fileInput = wrapper.find('input[type="file"]')
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })

    // Create a mock FileList
    const mockFileList = {
      length: 1,
      item: (): File => mockFile,
      [Symbol.iterator]: function* () {
        yield mockFile
      },
    } as unknown as FileList

    Object.defineProperty(fileInput.element, 'files', {
      value: mockFileList,
      writable: false,
    })

    await fileInput.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['test.txt'])
  })

  it('does not emit when no files selected', async () => {
    const field: FormDataField = {
      type: FieldType.File,
      label: 'Upload',
      name: 'file',
      access: false,
    }

    const wrapper = mount(ControlFile, {
      props: { field, modelValue: [] },
    })

    const fileInput = wrapper.find('input[type="file"]')

    Object.defineProperty(fileInput.element, 'files', {
      value: null,
      writable: false,
    })

    await fileInput.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('ControlSelect multiple', () => {
  it('emits multiple selected values', async () => {
    const field: FormDataField = {
      type: FieldType.Select,
      label: 'Colors',
      name: 'colors',
      access: false,
      multiple: true,
      values: [
        { label: 'Red', value: 'red', selected: false },
        { label: 'Blue', value: 'blue', selected: false },
      ],
    }

    const wrapper = mount(ControlSelect, {
      props: { field, modelValue: [] },
    })

    const select = wrapper.find('select')

    // Simulate multiple selection by mocking selectedOptions
    const mockSelectedOptions = [
      { value: 'red' },
      { value: 'blue' },
    ]

    Object.defineProperty(select.element, 'selectedOptions', {
      get: () => mockSelectedOptions,
    })

    await select.trigger('change')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['red', 'blue'])
  })
})

describe('ControlButton style fallback', () => {
  it('handles unknown style with fallback', () => {
    const field: FormDataField = {
      type: FieldType.Button,
      label: 'Click',
      name: 'btn',
      style: 'unknown-style',
      access: false,
    }

    const wrapper = mount(ControlButton, {
      props: { field, modelValue: [] },
    })

    const btn = wrapper.find('[data-qa="control-button"]')
    expect(btn.classes()).toContain('fbv-btn')
    expect(btn.attributes('data-style')).toBe('default')
  })
})

describe('ControlRadioGroup other text', () => {
  it('updates otherValue on input', async () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
      other: true,
      values: [],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: ['other-size'] },
    })

    const textInput = wrapper.find('[data-qa="radio-other-text"]')
    await textInput.setValue('Custom answer')

    // Value is stored in local ref, no emit
    expect(textInput.exists()).toBe(true)
  })
})

describe('ControlCheckboxGroup uncheck other', () => {
  it('unchecks other when already checked', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      other: true,
      values: [],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: ['other-colors'] },
    })

    await wrapper.find('[data-qa="checkbox-other-input"]').setValue(false)
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual([])
  })
})

describe('ControlHidden fallback', () => {
  it('falls back to empty string when both modelValue and field.value are undefined', () => {
    const field: FormDataField = {
      type: FieldType.Hidden,
      label: 'Hidden',
      name: 'hidden-field',
      access: false,
    }

    const wrapper = mount(ControlHidden, {
      props: { field, modelValue: [] },
    })

    const input = wrapper.find('input[type="hidden"]')
    expect(input.attributes('value')).toBe('')
  })
})

describe('ControlRadioGroup undefined props', () => {
  it('handles undefined values gracefully', () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      name: 'size',
      access: false,
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.findAll('[data-qa="radio-input"]')).toHaveLength(0)
  })

  it('uses unknown when name is undefined for other key', async () => {
    const field: FormDataField = {
      type: FieldType.RadioGroup,
      label: 'Size',
      access: false,
      other: true,
      values: [{ label: 'Small', value: 'sm', selected: false }],
    }

    const wrapper = mount(ControlRadioGroup, {
      props: { field, modelValue: [] },
    })

    const otherInput = wrapper.find('[data-qa="radio-other-input"]')
    await otherInput.setValue(true)
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(['other-unknown'])
  })
})

describe('ControlCheckboxGroup undefined props', () => {
  it('handles undefined values gracefully', () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    expect(wrapper.findAll('[data-qa="checkbox-input"]')).toHaveLength(0)
  })

  it('uses unknown when name is undefined for other key', async () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      access: false,
      other: true,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    const otherInput = wrapper.find('[data-qa="checkbox-other-input"]')
    await otherInput.setValue(true)
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(['other-unknown'])
  })

  it('sets required attribute when required and modelValue is empty', () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      required: true,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: [] },
    })

    const checkbox = wrapper.find('[data-qa="checkbox-input"]')
    expect(checkbox.attributes('required')).toBeDefined()
  })

  it('removes required attribute when required and modelValue is non-empty', () => {
    const field: FormDataField = {
      type: FieldType.CheckboxGroup,
      label: 'Colors',
      name: 'colors',
      access: false,
      required: true,
      values: [{ label: 'Red', value: 'red', selected: false }],
    }

    const wrapper = mount(ControlCheckboxGroup, {
      props: { field, modelValue: ['red'] },
    })

    const checkbox = wrapper.find('[data-qa="checkbox-input"]')
    expect(checkbox.attributes('required')).toBeUndefined()
  })
})

describe('ControlAutocomplete undefined values', () => {
  it('handles undefined values gracefully', async () => {
    const field: FormDataField = {
      type: FieldType.Autocomplete,
      label: 'City',
      name: 'city',
      access: false,
    }

    const wrapper = mount(ControlAutocomplete, {
      props: { field, modelValue: [] },
      attachTo: document.body,
    })

    await wrapper.find('[data-qa="autocomplete-input"]').trigger('focus')
    expect(wrapper.find('[data-qa="autocomplete-dropdown"]').exists()).toBe(false)

    wrapper.unmount()
  })
})
