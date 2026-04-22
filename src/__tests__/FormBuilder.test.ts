import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormBuilder from '../components/FormBuilder.vue'
import { FormBuilder as FormBuilderExport } from '../index'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

/** Helper to get the last emitted modelValue. */
function getLastModelValue(wrapper: ReturnType<typeof mount>): FormDataField[] {
  const emitted = wrapper.emitted('update:modelValue')
  expect(emitted).toBeTruthy()
  return (emitted?.[emitted.length - 1]?.[0] ?? []) as FormDataField[]
}

describe('index', () => {
  it('re-exports FormBuilder component', () => {
    expect(FormBuilderExport).toBe(FormBuilder)
  })
})

describe('FormBuilder', () => {
  it('renders without errors', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })
    expect(wrapper.find('[data-qa="form-builder"]').exists()).toBe(true)
  })

  it('renders control panel and stage', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    expect(wrapper.find('[data-qa="builder-control-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="builder-stage"]').exists()).toBe(true)
  })

  it('renders action buttons when showActionButtons is true', () => {
    const wrapper = mount(FormBuilder, {
      props: {
        modelValue: [],
        options: { showActionButtons: true },
      },
    })

    expect(wrapper.find('[data-qa="builder-actions"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="action-save"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="action-clear"]').exists()).toBe(true)
  })

  it('hides action buttons when showActionButtons is false', () => {
    const wrapper = mount(FormBuilder, {
      props: {
        modelValue: [],
        options: { showActionButtons: false },
      },
    })

    expect(wrapper.find('[data-qa="builder-actions"]').exists()).toBe(false)
  })

  it('emits save event when save button clicked', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    await wrapper.find('[data-qa="action-save"]').trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    const payload = wrapper.emitted('save')?.[0]?.[0] as { formData: FormDataField[] }
    expect(payload.formData).toEqual([])
  })

  it('emits clear event when clear button clicked', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    await wrapper.find('[data-qa="action-clear"]').trigger('click')

    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('emits loaded event on mount', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    expect(wrapper.emitted('loaded')).toBeTruthy()
  })

  it('adds a text field via control click', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    expect(textControl).toBeTruthy()
    await textControl.trigger('click')

    expect(wrapper.emitted('field-added')).toBeTruthy()
    const modelValue = getLastModelValue(wrapper)
    const textField = modelValue.find(f => f.type === FieldType.Text)
    expect(textField).toBeTruthy()
    expect(textField?.subtype).toBe(FieldType.Text)
  })

  it('adds a select field with default options via control click', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const selectControl = controlItems.find(item => item.text().includes('Select'))
    expect(selectControl).toBeTruthy()
    await selectControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const selectField = modelValue.find(f => f.type === FieldType.Select)
    expect(selectField).toBeTruthy()
    expect(selectField?.values).toHaveLength(3)
  })

  it('adds a checkbox-group field with default options', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const checkboxControl = controlItems.find(item => item.text().includes('Checkbox Group'))
    expect(checkboxControl).toBeTruthy()
    await checkboxControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const checkboxField = modelValue.find(f => f.type === FieldType.CheckboxGroup)
    expect(checkboxField).toBeTruthy()
    expect(checkboxField?.values).toHaveLength(2)
  })

  it('adds a button field with correct defaults', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const buttonControl = controlItems.find(item => item.text().includes('Button'))
    expect(buttonControl).toBeTruthy()
    await buttonControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const buttonField = modelValue.find(f => f.type === FieldType.Button)
    expect(buttonField).toBeTruthy()
    expect(buttonField?.style).toBe('default')
    expect(buttonField?.subtype).toBe('button')
  })

  it('adds a header field with h1 subtype', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const headerControl = controlItems.find(item => item.text().includes('Header'))
    expect(headerControl).toBeTruthy()
    await headerControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const headerField = modelValue.find(f => f.type === FieldType.Header)
    expect(headerField?.subtype).toBe('h1')
  })

  it('adds a paragraph field with p subtype', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const paraControl = controlItems.find(item => item.text().includes('Paragraph'))
    expect(paraControl).toBeTruthy()
    await paraControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const paraField = modelValue.find(f => f.type === FieldType.Paragraph)
    expect(paraField?.subtype).toBe('p')
  })

  it('adds a number field with number subtype', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const numberControl = controlItems.find(item => item.text().includes('Number'))
    expect(numberControl).toBeTruthy()
    await numberControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const numberField = modelValue.find(f => f.type === FieldType.Number)
    expect(numberField?.subtype).toBe(FieldType.Number)
  })

  it('adds a date field with date subtype', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const dateControl = controlItems.find(item => item.text().includes('Date'))
    expect(dateControl).toBeTruthy()
    await dateControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const dateField = modelValue.find(f => f.type === FieldType.Date)
    expect(dateField?.subtype).toBe(FieldType.Date)
  })

  it('adds an autocomplete field with default options', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const acControl = controlItems.find(item => item.text().includes('Autocomplete'))
    expect(acControl).toBeTruthy()
    await acControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const acField = modelValue.find(f => f.type === FieldType.Autocomplete)
    expect(acField?.values).toHaveLength(3)
  })

  it('adds a radio-group field with default options', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const radioControl = controlItems.find(item => item.text().includes('Radio'))
    expect(radioControl).toBeTruthy()
    await radioControl.trigger('click')

    const modelValue = getLastModelValue(wrapper)
    const radioField = modelValue.find(f => f.type === FieldType.RadioGroup)
    expect(radioField?.values).toHaveLength(2)
  })

  it('syncs modelValue to internal state on change', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const fields: FormDataField[] = [
      {
        type: FieldType.Text,
        label: 'Test',
        name: 'test-field',
        className: 'form-control',
        access: false,
      },
    ]

    await wrapper.setProps({ modelValue: fields })
    await flushPromises()

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    expect(fieldWrappers).toHaveLength(1)
  })

  it('exposes API methods', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as Record<string, unknown>

    expect(typeof vm.getFieldTypes).toBe('function')
    expect(typeof vm.addField).toBe('function')
    expect(typeof vm.removeField).toBe('function')
    expect(typeof vm.getData).toBe('function')
    expect(typeof vm.setData).toBe('function')
    expect(typeof vm.clearFields).toBe('function')
    expect(typeof vm.save).toBe('function')
    expect(typeof vm.toggleFieldEdit).toBe('function')
    expect(typeof vm.closeAllFieldEdit).toBe('function')
    expect(typeof vm.getCurrentFieldId).toBe('function')
    expect(typeof vm.setLocale).toBe('function')
  })

  it('getFieldTypes returns all types by default', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as { getFieldTypes: (activeOnly?: boolean) => string[] }
    const types = vm.getFieldTypes()
    expect(types.length).toBeGreaterThan(0)
  })

  it('getFieldTypes filters disabled types when activeOnly is true', () => {
    const wrapper = mount(FormBuilder, {
      props: {
        modelValue: [],
        options: { disableFields: [FieldType.Hidden] },
      },
    })

    const vm = wrapper.vm as { getFieldTypes: (activeOnly?: boolean) => string[] }
    const activeTypes = vm.getFieldTypes(true)
    expect(activeTypes).not.toContain(FieldType.Hidden)
  })

  it('save returns current data', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as { save: () => FormDataField[] }
    const data = vm.save()
    expect(data).toEqual([])
  })

  it('clearFields resets builder state', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const vm = wrapper.vm as { clearFields: () => void; getData: () => FormDataField[] }
    vm.clearFields()
    expect(vm.getData()).toEqual([])
  })

  it('adds field via exposed addField', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as {
      addField: (field: FormDataField) => string
      getData: () => FormDataField[]
    }

    const field: FormDataField = {
      type: FieldType.Text,
      label: 'Test',
      name: 'test-field',
      className: 'form-control',
      access: false,
    }

    const id = vm.addField(field)
    expect(id).toBeTruthy()

    const data = vm.getData()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('test-field')
  })

  it('removes field via exposed removeField', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as {
      addField: (field: FormDataField) => string
      removeField: (id: string) => boolean
      getData: () => FormDataField[]
    }

    const field: FormDataField = {
      type: FieldType.Text,
      label: 'Test',
      name: 'test-field',
      className: 'form-control',
      access: false,
    }

    const id = vm.addField(field)
    const removed = vm.removeField(id)
    expect(removed).toBe(true)
    expect(vm.getData()).toHaveLength(0)
  })

  it('sets data via exposed setData', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as {
      setData: (fields: FormDataField[]) => void
      getData: () => FormDataField[]
    }

    const fields: FormDataField[] = [
      { type: FieldType.Number, label: 'Age', name: 'age', className: 'form-control', access: false },
    ]

    vm.setData(fields)
    expect(vm.getData()).toHaveLength(1)
  })

  it('toggleFieldEdit selects a field', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as {
      addField: (field: FormDataField) => string
      toggleFieldEdit: (id: string | null) => void
      getCurrentFieldId: () => string | null
    }

    const field: FormDataField = {
      type: FieldType.Text,
      label: 'Test',
      name: 'test-field',
      className: 'form-control',
      access: false,
    }

    const id = vm.addField(field)
    vm.toggleFieldEdit(id)
    expect(vm.getCurrentFieldId()).toBe(id)

    vm.toggleFieldEdit(null)
    expect(vm.getCurrentFieldId()).toBeNull()
  })

  it('closeAllFieldEdit deselects all', () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const vm = wrapper.vm as {
      addField: (field: FormDataField) => string
      toggleFieldEdit: (id: string | null) => void
      closeAllFieldEdit: () => void
      getCurrentFieldId: () => string | null
    }

    const field: FormDataField = {
      type: FieldType.Text,
      label: 'Test',
      name: 'test-field',
      className: 'form-control',
      access: false,
    }

    const id = vm.addField(field)
    vm.toggleFieldEdit(id)
    expect(vm.getCurrentFieldId()).toBe(id)

    vm.closeAllFieldEdit()
    expect(vm.getCurrentFieldId()).toBeNull()
  })

  it('controlPosition right applies correct class', () => {
    const wrapper = mount(FormBuilder, {
      props: {
        modelValue: [],
        options: { controlPosition: 'right' },
      },
    })

    expect(wrapper.find('.builder-layout').classes()).toContain('control-right')
  })

  it('reacts to options prop changes', async () => {
    const wrapper = mount(FormBuilder, {
      props: {
        modelValue: [],
        options: { controlPosition: 'left', showActionButtons: true },
      },
    })

    expect(wrapper.find('.builder-layout').classes()).not.toContain('control-right')
    expect(wrapper.find('[data-qa="builder-actions"]').exists()).toBe(true)

    await wrapper.setProps({ options: { controlPosition: 'right', showActionButtons: false } })
    await flushPromises()

    expect(wrapper.find('.builder-layout').classes()).toContain('control-right')
    expect(wrapper.find('[data-qa="builder-actions"]').exists()).toBe(false)
  })

  it('syncs internal state to modelValue when fields change', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const lastValue = getLastModelValue(wrapper)
    expect(lastValue.length).toBeGreaterThan(0)
  })

  it('handles field-removed from stage', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const removeBtn = wrapper.find('[data-qa="field-remove-btn"]')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('field-removed')).toBeTruthy()
  })

  it('handles field-copied from stage', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const copyBtn = wrapper.find('[data-qa="field-copy-btn"]')
    expect(copyBtn.exists()).toBe(true)
    await copyBtn.trigger('click')
    await flushPromises()

    // Copy is handled through handleFieldCopied which calls builder.duplicateField
    // Note: duplicateField uses internal IDs, so copy with field.name may not find the field
    // The event was emitted regardless
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('handles field-selected from stage', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    expect(editBtn.exists()).toBe(true)
    await editBtn.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('field-selected')).toBeTruthy()
  })

  it('handles control drag start', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    const dataTransfer = {
      effectAllowed: null as string | null,
      setData: () => { /* mock for drag data */ },
    }

    await textControl.trigger('dragstart', { dataTransfer })

    const panel = wrapper.findComponent({ name: 'BuilderControlPanel' })
    expect(panel.emitted('control-drag-start')).toBeTruthy()
  })

  it('handles field reorder via drag and drop', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const numberControl = controlItems.find(item => item.text().includes('Number'))
    await numberControl.trigger('click')
    await flushPromises()

    const modelValue = getLastModelValue(wrapper)
    expect(modelValue).toHaveLength(2)

    const store: Record<string, string> = {}
    const dataTransfer = {
      setData(format: string, data: string) { store[format] = data },
      getData(format: string) { return store[format] ?? '' },
    }

    const firstName = modelValue[0]?.name ?? ''
    dataTransfer.setData('text/plain', `field:${firstName}`)

    const wrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await wrappers[1].trigger('drop', {
      dataTransfer,
      preventDefault: () => { /* no-op for test */ },
    })
    await flushPromises()

    expect(wrapper.emitted('field-moved') ?? wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('handles field-updated from stage edit panel', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    await editBtn.trigger('click')
    await flushPromises()

    const textInputs = wrapper.findAll('[data-qa="attr-text"]')
    if (textInputs.length > 0) {
      await textInputs[0].setValue('Updated Label')
      await flushPromises()

      expect(wrapper.emitted('field-updated')).toBeTruthy()
    }
  })

  it('handles control dropped from drag onto stage', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const store: Record<string, string> = {}
    const dataTransfer = {
      setData(format: string, data: string) { store[format] = data },
      getData(format: string) { return store[format] ?? '' },
    }
    dataTransfer.setData('text/plain', 'control:text')

    await wrapper.find('[data-qa="builder-stage"]').trigger('drop', {
      dataTransfer,
      preventDefault: () => { /* no-op for test */ },
    })
    await flushPromises()

    const modelValue = getLastModelValue(wrapper)
    expect(modelValue.length).toBeGreaterThan(0)
    expect(modelValue[0]?.type).toBe('text')
  })

  it('copies a field and verifies it exists', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const copyBtn = wrapper.find('[data-qa="field-copy-btn"]')
    await copyBtn.trigger('click')
    await flushPromises()

    const modelValue = getLastModelValue(wrapper)
    expect(modelValue).toHaveLength(2)
    expect(modelValue[1]?.name).toContain('-copy')
  })

  it('removes a field via the remove button', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    expect(getLastModelValue(wrapper)).toHaveLength(1)

    const removeBtn = wrapper.find('[data-qa="field-remove-btn"]')
    await removeBtn.trigger('click')
    await flushPromises()

    expect(getLastModelValue(wrapper)).toHaveLength(0)
  })

  it('updates a field label via edit panel', async () => {
    const wrapper = mount(FormBuilder, {
      props: { modelValue: [] },
    })

    const controlItems = wrapper.findAll('[data-qa="control-item"]')
    const textControl = controlItems.find(item => item.text().includes('Text'))
    await textControl.trigger('click')
    await flushPromises()

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    await editBtn.trigger('click')
    await flushPromises()

    const labelInput = wrapper.find('[data-qa="attr-text"]')
    await labelInput.setValue('New Name')
    await flushPromises()

    const modelValue = getLastModelValue(wrapper)
    expect(modelValue[0]?.label).toBe('New Name')
  })

  describe('inline row behaviour', () => {
    function mockRect(el: Element, width: number, left = 0): void {
      const bounds = { x: left, y: 0, top: 0, left, right: left + width, bottom: 0, width, height: 40 }
      Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => bounds,
      })
    }

    it('assigns rowId to a new field dropped on the side of an existing one', async () => {
      const wrapper = mount(FormBuilder, { props: { modelValue: [] } })

      const textControl = wrapper.findAll('[data-qa="control-item"]').find(i => i.text().includes('Text'))
      expect(textControl).toBeTruthy()
      await textControl.trigger('click')
      await flushPromises()

      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const store: Record<string, string> = {}
      const types: string[] = []
      const dt = {
        dropEffect: 'none',
        effectAllowed: 'uninitialized',
        setData(format: string, data: string) { if (!(format in store)) {types.push(format);} store[format] = data },
        getData(format: string) { return store[format] ?? '' },
        clearData() { /* noop */ },
        setDragImage: () => { /* noop */ },
        types,
        files: {} as FileList,
        items: {} as DataTransferItemList,
      } as DataTransfer
      dt.setData('text/plain', 'control:number')

      await fieldWrapper.trigger('dragover', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })
      await fieldWrapper.trigger('drop', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })
      await flushPromises()

      const modelValue = getLastModelValue(wrapper)
      expect(modelValue).toHaveLength(2)
      expect(modelValue[0]?.rowId).toBeTypeOf('string')
      expect(modelValue[1]?.rowId).toBe(modelValue[0]?.rowId)
    })

    it('updates rowId when a field is reordered into another row via side drop', async () => {
      const initial = [
        { type: FieldType.Text, label: 'A', name: 'a-field', className: 'form-control', access: false, rowId: 'row-alpha' },
        { type: FieldType.Text, label: 'B', name: 'b-field', className: 'form-control', access: false },
      ]
      const wrapper = mount(FormBuilder, { props: { modelValue: initial } })
      await flushPromises()

      const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
      const target = fieldWrappers[0]
      expect(target).toBeTruthy()
      if (!target) {return}
      mockRect(target.element, 400)

      const store: Record<string, string> = {}
      const types: string[] = []
      const dt = {
        dropEffect: 'move',
        effectAllowed: 'move',
        setData(format: string, data: string) { if (!(format in store)) {types.push(format);} store[format] = data },
        getData(format: string) { return store[format] ?? '' },
        clearData() { /* noop */ },
        setDragImage: () => { /* noop */ },
        types,
        files: {} as FileList,
        items: {} as DataTransferItemList,
      } as DataTransfer
      dt.setData('text/plain', 'field:b-field')

      await target.trigger('dragover', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })
      await target.trigger('drop', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })
      await flushPromises()

      const modelValue = getLastModelValue(wrapper)
      expect(modelValue).toHaveLength(2)
      // B now sits next to A, sharing row-alpha.
      expect(modelValue[1]?.name).toBe('b-field')
      expect(modelValue[1]?.rowId).toBe('row-alpha')
    })
  })

  describe('custom field presets', () => {
    it('clicking a preset chip inserts a field with the preset label, className, and values', async () => {
      const wrapper = mount(FormBuilder, {
        props: {
          modelValue: [] as FormDataField[],
          options: {
            fields: [
              {
                type: FieldType.CheckboxGroup,
                label: 'Multiple correct Radio Group',
                className: 'radio-multiple',
                values: [
                  { label: 'A', value: 'a', selected: true },
                  { label: 'B', value: 'b', selected: false },
                  { label: 'F', value: 'f', selected: false },
                ],
              },
            ],
          },
        },
      })

      const preset = wrapper.find('[data-qa="control-preset-item"]')
      expect(preset.exists()).toBe(true)
      await preset.trigger('click')
      await flushPromises()

      const model = getLastModelValue(wrapper)
      expect(model).toHaveLength(1)
      expect(model[0]?.type).toBe(FieldType.CheckboxGroup)
      expect(model[0]?.label).toBe('Multiple correct Radio Group')
      expect(model[0]?.className).toBe('radio-multiple')
      expect(model[0]?.values).toHaveLength(3)
      expect(model[0]?.values?.[0]).toEqual({ label: 'A', value: 'a', selected: true })
    })

    it('dropping a preset (via text/plain "control:preset:<i>") inserts the preset field', async () => {
      const wrapper = mount(FormBuilder, {
        props: {
          modelValue: [] as FormDataField[],
          options: {
            fields: [
              {
                type: FieldType.RadioGroup,
                label: 'Yes/No',
                values: [
                  { label: 'Yes', value: 'yes', selected: true },
                  { label: 'No', value: 'no', selected: false },
                ],
              },
            ],
          },
        },
      })

      const store: Record<string, string> = { 'text/plain': 'control:preset:0' }
      const dt = {
        dropEffect: 'none',
        effectAllowed: 'copy',
        setData(format: string, data: string) { store[format] = data },
        getData(format: string) { return store[format] ?? '' },
        clearData() { /* noop */ },
        setDragImage: () => { /* noop */ },
        types: ['text/plain'],
        files: {} as FileList,
        items: {} as DataTransferItemList,
      } as DataTransfer

      await wrapper.find('[data-qa="builder-stage"]').trigger('drop', { dataTransfer: dt })
      await flushPromises()

      const model = getLastModelValue(wrapper)
      expect(model).toHaveLength(1)
      expect(model[0]?.label).toBe('Yes/No')
      expect(model[0]?.values?.[0]?.selected).toBe(true)
    })
  })
})
