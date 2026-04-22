import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, provide, ref, defineComponent } from 'vue'
import BuilderStage from '../components/BuilderStage.vue'
import BuilderField from '../components/BuilderField.vue'
import { BUILDER_STATE_KEY, FIELD_REGISTRY_KEY } from '../types/injection-keys'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const textField: FormDataField = {
  type: FieldType.Text,
  label: 'Name',
  name: 'name-field',
  className: 'form-control',
  access: false,
}

const numberField: FormDataField = {
  type: FieldType.Number,
  label: 'Age',
  name: 'age-field',
  className: 'form-control',
  access: false,
}

function createMockDataTransfer(): { dt: DataTransfer; store: Record<string, string> } {
  const store: Record<string, string> = {}
  const types: string[] = []
  const dt = {
    dropEffect: 'none',
    effectAllowed: 'uninitialized',
    setData(format: string, data: string) {
      if (!(format in store)) {
        types.push(format)
      }
      store[format] = data
    },
    getData(format: string) { return store[format] ?? '' },
    clearData() {
      Object.keys(store).forEach(key => { store[key] = '' })
      types.length = 0
    },
    setDragImage: () => { /* no-op mock */ },
    types,
    files: {} as FileList,
    items: {} as DataTransferItemList,
  } as DataTransfer
  return { dt, store }
}

function createWrapper(
  fields: FormDataField[] = [],
  selectedFieldId: string | null = null,
  builderStateOverride?: Record<string, unknown>,
): ReturnType<typeof mount> {
  const selectedFieldIdRef = ref<string | null>(selectedFieldId)

  const ParentComponent = defineComponent({
    setup() {
      provide(BUILDER_STATE_KEY, builderStateOverride ?? {
        fields: ref(fields),
        selectedFieldId: selectedFieldIdRef,
        fieldIdCounter: ref(0),
      })
      provide(FIELD_REGISTRY_KEY, {
        getAllTypes: () => [] as string[],
        getDefinition: () => undefined,
        resolveComponent: () => undefined,
        getDefaultAttrs: () => [] as string[],
        getSubtypes: () => [] as string[],
        isActive: () => false,
      })
    },
    render() {
      return h(BuilderStage, {
        fields,
        selectedFieldId: selectedFieldIdRef.value,
        disabledAttrs: [],
      })
    },
  })

  return mount(ParentComponent, { attachTo: document.body })
}

describe('BuilderStage', () => {
  it('shows empty state when no fields', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('[data-qa="stage-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-qa="stage-empty"]').text()).toContain('Drag a field')
  })

  it('hides empty state when fields exist', () => {
    const wrapper = createWrapper([textField])

    expect(wrapper.find('[data-qa="stage-empty"]').exists()).toBe(false)
  })

  it('renders field wrappers for each field', () => {
    const wrapper = createWrapper([textField, numberField])

    const wrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    expect(wrappers).toHaveLength(2)
  })

  it('emits field-removed when BuilderField emits remove', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)

    const removeBtn = wrapper.find('[data-qa="field-remove-btn"]')
    await removeBtn.trigger('click')

    expect(stage.emitted('field-removed')).toBeTruthy()
    const payload = stage.emitted('field-removed')[0][0] as { fieldId: string; field: FormDataField }
    expect(payload.fieldId).toBe('name-field')
    expect(payload.field).toEqual(textField)
  })

  it('emits field-copied when BuilderField emits copy', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)

    const copyBtn = wrapper.find('[data-qa="field-copy-btn"]')
    await copyBtn.trigger('click')

    expect(stage.emitted('field-copied')).toBeTruthy()
    expect(stage.emitted('field-copied')[0][0]).toEqual({ fieldId: 'name-field' })
  })

  it('emits field-selected when BuilderField emits edit', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    await editBtn.trigger('click')

    expect(stage.emitted('field-selected')).toBeTruthy()
    expect(stage.emitted('field-selected')[0][0]).toEqual({ fieldId: 'name-field' })
  })

  it('emits field-updated when BuilderField emits update:field', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    await editBtn.trigger('click')
    await flushPromises()

    const input = wrapper.find('input[data-qa="attr-label"]')
    if (input.exists()) {
      await input.setValue('New Label')
      await flushPromises()

      expect(stage.emitted('field-updated')).toBeTruthy()
    }
  })

  it('emits field-reorder on drop with field: data', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'field:name-field')

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('field-reorder')).toBeTruthy()
    const payload = stage.emitted('field-reorder')[0][0] as { fromIndex: number; toIndex: number }
    expect(payload.fromIndex).toBe(0)
    expect(payload.toIndex).toBe(1)
  })

  it('emits control-dropped on drop with control: data', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('control-dropped')).toBeTruthy()
    const payload = stage.emitted('control-dropped')[0][0] as { type: string; index: number }
    expect(payload.type).toBe('text')
    expect(payload.index).toBe(1)
  })

  it('emits control-dropped when dropping on empty stage', async () => {
    const wrapper = createWrapper()
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await wrapper.find('[data-qa="builder-stage"]').trigger('drop', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('control-dropped')).toBeTruthy()
    const payload = stage.emitted('control-dropped')[0][0] as { type: string; index: number }
    expect(payload.type).toBe('text')
    expect(payload.index).toBe(0)
  })

  it('does not emit when dropped field not found', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'field:nonexistent-field')

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('field-reorder')).toBeFalsy()
  })

  it('ignores drop of an out-of-range preset index', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    // preset index 99 does not exist — parseControlData should hit its
    // `return null` branch and the stage should NOT emit control-dropped.
    dt.setData('text/plain', 'control:preset:99')

    await wrapper.find('[data-qa="builder-stage"]').trigger('drop', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('control-dropped')).toBeFalsy()
  })

  it('does not emit on drop with no data', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: {
        getData: () => '',
      },
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('field-reorder')).toBeFalsy()
    expect(stage.emitted('control-dropped')).toBeFalsy()
  })

  it('handles field dragover event with field data', async () => {
    const wrapper = createWrapper([textField, numberField])

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'field:name-field')

    await fieldWrappers[0].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(dt.dropEffect).toBe('move')
  })

  it('handles field dragover event with control data', async () => {
    const wrapper = createWrapper([textField, numberField])

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await fieldWrappers[0].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(dt.dropEffect).toBe('copy')
  })

  it('detects control drag via custom MIME type when text/plain is unreadable', async () => {
    // Simulates real-browser behavior where getData returns '' during dragover
    // but types remains readable.
    const wrapper = createWrapper([textField, numberField])

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    // Set the custom MIME but don't store text/plain content (simulating browser security)
    dt.setData('application/x-formbuilder-control', 'text')

    await fieldWrappers[0].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(dt.dropEffect).toBe('copy')
  })

  it('handles control dragover on stage', async () => {
    const wrapper = createWrapper()

    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await wrapper.find('[data-qa="builder-stage"]').trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(dt.dropEffect).toBe('copy')
  })

  it('isFieldSelected uses builderState when available', () => {
    const selectedFieldIdRef = ref<string | null>('name-field')

    const wrapper = createWrapper(
      [textField],
      null,
      {
        fields: ref([textField]),
        selectedFieldId: selectedFieldIdRef,
        fieldIdCounter: ref(0),
      },
    )

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    expect(fieldEl.classes()).toContain('selected')
  })

  it('isFieldSelected uses props when builderState is not available', () => {
    const ParentComponent = defineComponent({
      setup() {
        provide(FIELD_REGISTRY_KEY, {
          getAllTypes: () => [] as string[],
          getDefinition: () => undefined,
          resolveComponent: () => undefined,
          getDefaultAttrs: () => [] as string[],
          getSubtypes: () => [] as string[],
          isActive: () => false,
        })
      },
      render() {
        return h(BuilderStage, {
          fields: [textField],
          selectedFieldId: 'name-field',
          disabledAttrs: [],
        })
      },
    })

    const wrapper = mount(ParentComponent)
    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    expect(fieldEl.classes()).toContain('selected')
  })

  it('handles field dragstart event from BuilderField', async () => {
    const wrapper = createWrapper([textField])
    const { dt } = createMockDataTransfer()

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    await fieldEl.trigger('dragstart', { dataTransfer: dt })

    expect(dt.effectAllowed).toBe('move')
    expect(dt.getData('text/plain')).toBe('field:name-field')
  })

  it('handles field dragstart with null dataTransfer', async () => {
    const wrapper = createWrapper([textField])

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    await fieldEl.trigger('dragstart', { dataTransfer: null })
  })

  it('handles field dragend event', async () => {
    const wrapper = createWrapper([textField])

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    await fieldEl.trigger('dragend')
  })

  it('emits field-removed when a field is dragged out of the stage', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.dropEffect = 'none'

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    await fieldEl.trigger('dragstart', { dataTransfer: dt })
    await fieldEl.trigger('dragend', { dataTransfer: dt })

    expect(stage.emitted('field-removed')).toBeTruthy()
    const payload = stage.emitted('field-removed')[0][0] as { fieldId: string; field: FormDataField }
    expect(payload.fieldId).toBe('name-field')
    expect(payload.field).toEqual(textField)
  })

  it('does not emit field-removed when drop succeeded on the stage', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)
    const { dt } = createMockDataTransfer()
    dt.dropEffect = 'move'

    const fieldEl = wrapper.findAll('[data-qa="builder-field"]')[0]
    await fieldEl.trigger('dragstart', { dataTransfer: dt })
    await fieldEl.trigger('dragend', { dataTransfer: dt })

    expect(stage.emitted('field-removed')).toBeFalsy()
  })

  it('does not emit field-removed when drag-out fieldId no longer exists', () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.findComponent(BuilderStage)

    // Simulate the dragend emission coming from a BuilderField whose fieldId
    // is no longer in the stage's fields array (stale state race condition).
    const field = wrapper.findComponent(BuilderField)
    const fieldVm = field.vm as unknown as { $emit: (event: string, payload: unknown) => void }
    fieldVm.$emit('dragend', {
      fieldId: 'ghost-field',
      event: { dataTransfer: { dropEffect: 'none' } as DataTransfer } as DragEvent,
    })

    expect(stage.emitted('field-removed')).toBeFalsy()
  })

  it('does nothing on stage drop with no data', async () => {
    const wrapper = createWrapper()
    const stage = wrapper.findComponent(BuilderStage)

    await wrapper.find('[data-qa="builder-stage"]').trigger('drop', {
      dataTransfer: { getData: () => '' },
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('control-dropped')).toBeFalsy()
    expect(stage.emitted('field-reorder')).toBeFalsy()
  })

  it('does nothing on stage drop with null dataTransfer', async () => {
    const wrapper = createWrapper()
    const stage = wrapper.findComponent(BuilderStage)

    await wrapper.find('[data-qa="builder-stage"]').trigger('drop', {
      dataTransfer: null,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('control-dropped')).toBeFalsy()
    expect(stage.emitted('field-reorder')).toBeFalsy()
  })

  it('does nothing on field drop with no data', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: { getData: () => '' },
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('field-reorder')).toBeFalsy()
    expect(stage.emitted('control-dropped')).toBeFalsy()
  })

  it('does nothing on field drop with null dataTransfer', async () => {
    const wrapper = createWrapper([textField, numberField])
    const stage = wrapper.findComponent(BuilderStage)

    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    await fieldWrappers[1].trigger('drop', {
      dataTransfer: null,
      preventDefault: () => { /* no-op for test */ },
    })

    expect(stage.emitted('field-reorder')).toBeFalsy()
    expect(stage.emitted('control-dropped')).toBeFalsy()
  })

  it('marks stage as drag-over on stage dragover from outside', async () => {
    const wrapper = createWrapper()
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    const stage = wrapper.find('[data-qa="builder-stage"]')
    await stage.trigger('dragover', { dataTransfer: dt, preventDefault: () => { /* noop */ } })

    expect(stage.classes()).toContain('drag-over')
    expect(stage.classes()).toContain('drag-active')
  })

  it('sets dropEffect to move when dragging a field over the stage', async () => {
    const wrapper = createWrapper([textField])
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'field:name-field')

    await wrapper.find('[data-qa="builder-stage"]').trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* noop */ },
    })

    expect(dt.dropEffect).toBe('move')
  })

  it('clears drag state on stage dragleave to outside', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.find('[data-qa="builder-stage"]')

    // Enter stage first
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')
    await stage.trigger('dragover', { dataTransfer: dt, preventDefault: () => { /* noop */ } })
    expect(stage.classes()).toContain('drag-over')

    // Leave to an unrelated target (null)
    await stage.trigger('dragleave', { relatedTarget: null })
    expect(stage.classes()).not.toContain('drag-over')
    expect(stage.classes()).not.toContain('drag-active')
  })

  it('does not clear drag state on stage dragleave to an inner child', async () => {
    const wrapper = createWrapper([textField])
    const stage = wrapper.find('[data-qa="builder-stage"]')

    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')
    await stage.trigger('dragover', { dataTransfer: dt, preventDefault: () => { /* noop */ } })
    expect(stage.classes()).toContain('drag-over')

    const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]').element
    await stage.trigger('dragleave', { relatedTarget: fieldWrapper })

    expect(stage.classes()).toContain('drag-active')
  })

  it('shows drop-before indicator on the hovered field wrapper', async () => {
    const wrapper = createWrapper([textField, numberField])
    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await fieldWrappers[1].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* noop */ },
    })

    expect(fieldWrappers[1].classes()).toContain('drop-before')
    expect(fieldWrappers[0].classes()).not.toContain('drop-before')
  })

  it('clears drop-before on field dragleave to outside the wrapper', async () => {
    const wrapper = createWrapper([textField, numberField])
    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await fieldWrappers[1].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* noop */ },
    })
    expect(fieldWrappers[1].classes()).toContain('drop-before')

    await fieldWrappers[1].trigger('dragleave', { relatedTarget: null })
    expect(fieldWrappers[1].classes()).not.toContain('drop-before')
  })

  it('does not clear drop-before on field dragleave to an inner child', async () => {
    const wrapper = createWrapper([textField])
    const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    await fieldWrappers[0].trigger('dragover', {
      dataTransfer: dt,
      preventDefault: () => { /* noop */ },
    })
    expect(fieldWrappers[0].classes()).toContain('drop-before')

    // relatedTarget is a child of the wrapper (the field itself)
    const innerField = fieldWrappers[0].find('[data-qa="builder-field"]').element
    await fieldWrappers[0].trigger('dragleave', { relatedTarget: innerField })

    expect(fieldWrappers[0].classes()).toContain('drop-before')
  })

  it('marks the dragged field with is-dragging class', async () => {
    const wrapper = createWrapper([textField])
    const { dt } = createMockDataTransfer()

    const fieldEl = wrapper.find('[data-qa="builder-field"]')
    await fieldEl.trigger('dragstart', { dataTransfer: dt })

    const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
    expect(fieldWrapper.classes()).toContain('is-dragging')

    await fieldEl.trigger('dragend')
    expect(fieldWrapper.classes()).not.toContain('is-dragging')
  })

  it('shows tail drop zone when drag is active and fields exist', async () => {
    const wrapper = createWrapper([textField])
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    const stage = wrapper.find('[data-qa="builder-stage"]')
    await stage.trigger('dragover', { dataTransfer: dt, preventDefault: () => { /* noop */ } })

    expect(wrapper.find('.stage-tail-drop').exists()).toBe(true)
    expect(wrapper.find('.stage-tail-drop').classes()).toContain('drop-target')
  })

  it('hides tail drop zone after drop completes', async () => {
    const wrapper = createWrapper([textField])
    const { dt } = createMockDataTransfer()
    dt.setData('text/plain', 'control:text')

    const stage = wrapper.find('[data-qa="builder-stage"]')
    await stage.trigger('dragover', { dataTransfer: dt, preventDefault: () => { /* noop */ } })
    expect(wrapper.find('.stage-tail-drop').exists()).toBe(true)

    await stage.trigger('drop', { dataTransfer: dt, preventDefault: () => { /* noop */ } })
    expect(wrapper.find('.stage-tail-drop').exists()).toBe(false)
  })

  it('deselects field when edit clicked on already selected field', async () => {
    const selectedFieldIdRef = ref<string | null>('name-field')

    const wrapper = createWrapper(
      [textField],
      null,
      {
        fields: ref([textField]),
        selectedFieldId: selectedFieldIdRef,
        fieldIdCounter: ref(0),
      },
    )

    const editBtn = wrapper.find('[data-qa="field-edit-btn"]')
    await editBtn.trigger('click')

    // Since 'name-field' was already selected, clicking edit should deselect
    expect(selectedFieldIdRef.value).toBeNull()
  })

  describe('inline row grouping', () => {
    const rowField1: FormDataField = {
      type: FieldType.Text,
      label: 'A',
      name: 'a-field',
      className: 'form-control',
      access: false,
      rowId: 'row-1',
    }
    const rowField2: FormDataField = {
      type: FieldType.Text,
      label: 'B',
      name: 'b-field',
      className: 'form-control',
      access: false,
      rowId: 'row-1',
    }
    const rowField3: FormDataField = {
      type: FieldType.Text,
      label: 'C',
      name: 'c-field',
      className: 'form-control',
      access: false,
      rowId: 'row-1',
    }
    const rowField4: FormDataField = {
      type: FieldType.Text,
      label: 'D',
      name: 'd-field',
      className: 'form-control',
      access: false,
      rowId: 'row-1',
    }

    function mockRect(el: Element, width: number, left = 0): void {
      const bounds = { x: left, y: 0, top: 0, left, right: left + width, bottom: 0, width, height: 40 }
      Object.defineProperty(el, 'getBoundingClientRect', {
        configurable: true,
        value: () => bounds,
      })
    }

    it('renders one stage row per group of fields with the same rowId', () => {
      const wrapper = createWrapper([rowField1, rowField2, textField])

      const stageRows = wrapper.findAll('[data-qa="stage-row"]')
      expect(stageRows).toHaveLength(2)
      expect(stageRows[0]?.attributes('data-row-size')).toBe('2')
      expect(stageRows[1]?.attributes('data-row-size')).toBe('1')
    })

    it('caps a row at 3 members even when rowId matches', () => {
      const wrapper = createWrapper([rowField1, rowField2, rowField3, rowField4])
      const stageRows = wrapper.findAll('[data-qa="stage-row"]')
      expect(stageRows).toHaveLength(2)
      expect(stageRows[0]?.attributes('data-row-size')).toBe('3')
      expect(stageRows[1]?.attributes('data-row-size')).toBe('1')
    })

    it('emits control-dropped with rowId when dropping on the left edge of a standalone field', async () => {
      const wrapper = createWrapper([textField])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')

      await fieldWrapper.trigger('dragover', {
        dataTransfer: dt,
        clientX: 20,
        preventDefault: () => { /* noop */ },
      })
      expect(fieldWrapper.classes()).toContain('drop-left')

      await fieldWrapper.trigger('drop', {
        dataTransfer: dt,
        clientX: 20,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('control-dropped')?.[0]?.[0] as { type: string; index: number; rowId?: string }
      expect(payload.type).toBe('text')
      expect(payload.index).toBe(0)
      expect(payload.rowId).toBeTypeOf('string')
    })

    it('emits control-dropped with target rowId and index+1 when dropping on the right edge', async () => {
      const wrapper = createWrapper([rowField1])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')

      await fieldWrapper.trigger('dragover', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })
      expect(fieldWrapper.classes()).toContain('drop-right')

      await fieldWrapper.trigger('drop', {
        dataTransfer: dt,
        clientX: 380,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('control-dropped')?.[0]?.[0] as { type: string; index: number; rowId?: string }
      expect(payload.index).toBe(1)
      expect(payload.rowId).toBe('row-1')
    })

    it('emits control-dropped without rowId when the center zone is targeted', async () => {
      const wrapper = createWrapper([textField])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')

      await fieldWrapper.trigger('dragover', {
        dataTransfer: dt,
        clientX: 200,
        preventDefault: () => { /* noop */ },
      })
      expect(fieldWrapper.classes()).toContain('drop-before')

      await fieldWrapper.trigger('drop', {
        dataTransfer: dt,
        clientX: 200,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('control-dropped')?.[0]?.[0] as { type: string; index: number; rowId?: string }
      expect(payload.rowId).toBeUndefined()
    })

    it('falls back to "above" drop when the wrapper has zero width', async () => {
      const wrapper = createWrapper([textField])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      // jsdom default rect has width 0; no mock needed.

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')
      await fieldWrapper.trigger('drop', {
        dataTransfer: dt,
        clientX: 50,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('control-dropped')?.[0]?.[0] as { type: string; index: number; rowId?: string }
      expect(payload.rowId).toBeUndefined()
    })

    it('disables side-join when the target row already has 3 members', async () => {
      const wrapper = createWrapper([rowField1, rowField2, rowField3])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
      const target = fieldWrappers[0]
      expect(target).toBeTruthy()
      if (!target) {return}
      mockRect(target.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')

      await target.trigger('dragover', {
        dataTransfer: dt,
        clientX: 10,
        preventDefault: () => { /* noop */ },
      })
      expect(target.classes()).not.toContain('drop-left')
      expect(target.classes()).toContain('drop-before')

      await target.trigger('drop', {
        dataTransfer: dt,
        clientX: 10,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('control-dropped')?.[0]?.[0] as { type: string; index: number; rowId?: string }
      expect(payload.rowId).toBeUndefined()
    })

    it('emits field-reorder with rowId when a field is dropped on the right edge of another', async () => {
      const wrapper = createWrapper([textField, rowField1])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
      const target = fieldWrappers[1]
      expect(target).toBeTruthy()
      if (!target) {return}
      mockRect(target.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'field:name-field')

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

      const payload = stage.emitted('field-reorder')?.[0]?.[0] as {
        fromIndex: number
        toIndex: number
        rowId?: string
      }
      expect(payload.fromIndex).toBe(0)
      // Target index 1, inserting on right = raw index 2; from is before target so -1 = 1
      expect(payload.toIndex).toBe(1)
      expect(payload.rowId).toBe('row-1')
    })

    it('emits field-reorder with rowId when dropping before a later field (left edge)', async () => {
      const wrapper = createWrapper([rowField1, textField])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
      const target = fieldWrappers[0]
      expect(target).toBeTruthy()
      if (!target) {return}
      mockRect(target.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'field:name-field')

      await target.trigger('dragover', {
        dataTransfer: dt,
        clientX: 10,
        preventDefault: () => { /* noop */ },
      })

      await target.trigger('drop', {
        dataTransfer: dt,
        clientX: 10,
        preventDefault: () => { /* noop */ },
      })

      const payload = stage.emitted('field-reorder')?.[0]?.[0] as {
        fromIndex: number
        toIndex: number
        rowId?: string
      }
      expect(payload.fromIndex).toBe(1)
      expect(payload.toIndex).toBe(0)
      expect(payload.rowId).toBe('row-1')
    })

    it('does not emit row-join reorder when dropping a field onto itself', async () => {
      const wrapper = createWrapper([rowField1])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'field:a-field')

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

      const payload = stage.emitted('field-reorder')?.[0]?.[0] as {
        fromIndex: number
        toIndex: number
        rowId?: string
      }
      expect(payload.rowId).toBeUndefined()
    })

    it('emits field-updated to tag an un-rowed target when a field is dropped on its side', async () => {
      const wrapper = createWrapper([textField, numberField])
      const stage = wrapper.findComponent(BuilderStage)
      const fieldWrappers = wrapper.findAll('[data-qa="stage-field-wrapper"]')
      const target = fieldWrappers[0]
      expect(target).toBeTruthy()
      if (!target) {return}
      mockRect(target.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'field:age-field')

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

      const updatedPayload = stage.emitted('field-updated')?.[0]?.[0] as {
        fieldId: string
        updates: Partial<FormDataField>
      }
      expect(updatedPayload.fieldId).toBe('name-field')
      expect(updatedPayload.updates.rowId).toBeTypeOf('string')

      const reorderPayload = stage.emitted('field-reorder')?.[0]?.[0] as {
        fromIndex: number
        toIndex: number
        rowId?: string
      }
      expect(reorderPayload.rowId).toBe(updatedPayload.updates.rowId)
    })

    it('clears the side drop indicator on dragleave to outside the wrapper', async () => {
      const wrapper = createWrapper([textField])
      const fieldWrapper = wrapper.find('[data-qa="stage-field-wrapper"]')
      mockRect(fieldWrapper.element, 400)

      const { dt } = createMockDataTransfer()
      dt.setData('text/plain', 'control:text')

      await fieldWrapper.trigger('dragover', {
        dataTransfer: dt,
        clientX: 20,
        preventDefault: () => { /* noop */ },
      })
      expect(fieldWrapper.classes()).toContain('drop-left')

      await fieldWrapper.trigger('dragleave', { relatedTarget: null })
      expect(fieldWrapper.classes()).not.toContain('drop-left')
    })
  })
})
