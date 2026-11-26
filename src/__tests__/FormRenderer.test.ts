import { describe, it, expect } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'
import type { UserDataMap } from '../types/user-data'
import FormRenderer from '../components/FormRenderer.vue'
import ControlInput from '../components/controls/ControlInput.vue'
import { useFieldRegistry } from '../composables/useFieldRegistry'

interface RendererApi {
  userData: () => { name: string; userData: string[] }[]
  clear: () => void
  setData: (formData: FormDataField[]) => void
  getElement: (fieldName: string) => HTMLElement | undefined
  validate: () => Record<string, string[]>
}

const selectField: FormDataField = {
  type: FieldType.Select,
  label: 'Letters',
  name: 'letters',
  multiple: true,
  values: [
    { label: 'A', value: 'a', selected: true },
    { label: 'B', value: 'b', selected: true },
    { label: 'C', value: 'c', selected: false },
  ],
}

const checkboxGroupField: FormDataField = {
  type: FieldType.CheckboxGroup,
  label: 'Choices',
  name: 'choices',
  values: [
    { label: 'C1', value: 'c1', selected: true },
    { label: 'C2', value: 'c2', selected: false },
  ],
}

const hiddenField: FormDataField = { type: FieldType.Hidden, label: '', name: 'secret', value: 'secret-42' }

const textField: FormDataField = { type: FieldType.Text, label: 'Name', name: 'full-name', subtype: 'text' }

interface Host {
  renderer: VueWrapper
  api: Ref<RendererApi | null>
  fields: Ref<FormDataField[]>
  model: Ref<UserDataMap>
}

function mountHost(formData: FormDataField[], modelValue: UserDataMap = {}): Host {
  const fields = ref<FormDataField[]>(formData)
  const model = ref<UserDataMap>(modelValue)
  const api = ref<RendererApi | null>(null)
  const wrapper = mount(defineComponent({
    setup: () => () => h(FormRenderer, {
      ref: api,
      formData: fields.value,
      modelValue: model.value,
      'onUpdate:modelValue': (value: UserDataMap) => { model.value = value },
    }),
  }))
  return { renderer: wrapper.findComponent(FormRenderer), api, fields, model }
}

function answers(host: Host): UserDataMap {
  return Object.fromEntries((host.api.value?.userData() ?? []).map((entry) => [entry.name, entry.userData]))
}

function emitCount(host: Host): number {
  return host.renderer.emitted('update:modelValue')?.length ?? 0
}

async function setFields(host: Host, formData: FormDataField[]): Promise<void> {
  host.fields.value = formData
  await nextTick()
  await nextTick()
}

describe('FormRenderer defaults when formData changes', () => {
  it('seeds defaults for formData set after mount', async () => {
    const host = mountHost([])

    await setFields(host, [selectField, checkboxGroupField, hiddenField])

    expect(answers(host)).toEqual({ letters: ['a', 'b'], choices: ['c1'], secret: ['secret-42'] })
    expect(host.model.value).toEqual({ letters: ['a', 'b'], choices: ['c1'], secret: ['secret-42'] })
    const checkboxes = host.renderer.findAll<HTMLInputElement>('[data-qa="checkbox-input"]')
    expect(checkboxes.map((c) => c.element.checked)).toEqual([true, false])
  })

  it('keeps user answers of unchanged fields', async () => {
    const host = mountHost([textField, checkboxGroupField])
    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')
    await host.renderer.findAll('[data-qa="checkbox-input"]')[1]?.setValue(true)

    await setFields(host, [textField, checkboxGroupField, hiddenField])

    expect(answers(host)).toEqual({ 'full-name': ['Ada'], choices: ['c1', 'c2'], secret: ['secret-42'] })
  })

  it('drops answers of removed fields', async () => {
    const host = mountHost([textField, hiddenField])
    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')

    await setFields(host, [hiddenField])

    expect(answers(host)).toEqual({ secret: ['secret-42'] })
    expect(host.model.value).toEqual({ secret: ['secret-42'] })
  })

  it('follows changed defaults of fields the user has not answered', async () => {
    const host = mountHost([structuredClone(checkboxGroupField)])

    const options = host.fields.value[0]?.values ?? []
    options[0] = { label: 'C1', value: 'c1', selected: false }
    options[1] = { label: 'C2', value: 'c2', selected: true }
    await nextTick()

    expect(answers(host)).toEqual({ choices: ['c2'] })
  })

  it('removes a default the field no longer has', async () => {
    const host = mountHost([hiddenField])

    await setFields(host, [{ ...hiddenField, value: '' }])

    expect(answers(host)).toEqual({})
  })

  it('does not overwrite an answered field when its default changes', async () => {
    const host = mountHost([checkboxGroupField])
    await host.renderer.findAll('[data-qa="checkbox-input"]')[1]?.setValue(true)

    await setFields(host, [{ ...checkboxGroupField, values: [{ label: 'C1', value: 'c1', selected: false }] }])

    expect(answers(host)).toEqual({ choices: ['c1', 'c2'] })
  })

  it('treats answers replaced by the parent as user answers', async () => {
    const host = mountHost([checkboxGroupField])

    host.model.value = { choices: ['c2'] }
    await nextTick()
    await setFields(host, [{ ...checkboxGroupField, values: [{ label: 'C1', value: 'c1', selected: true }] }])

    expect(answers(host)).toEqual({ choices: ['c2'] })
  })

  it('keeps preloaded answers until their fields arrive', async () => {
    const host = mountHost([], { 'full-name': ['Ada'] })

    await setFields(host, [textField, hiddenField])

    expect(answers(host)).toEqual({ 'full-name': ['Ada'], secret: ['secret-42'] })
    expect(host.renderer.find<HTMLInputElement>('[data-qa="control-input"]').element.value).toBe('Ada')
  })

  it('does not emit when a change leaves the answers as they were', async () => {
    const host = mountHost([hiddenField])
    const before = emitCount(host)

    await setFields(host, [{ ...hiddenField, label: 'Renamed' }])

    expect(emitCount(host)).toBe(before)
  })

  it('reseeds defaults after clear when formData changes', async () => {
    const host = mountHost([hiddenField, textField])
    host.api.value?.clear()
    await nextTick()

    await setFields(host, [hiddenField])

    expect(answers(host)).toEqual({ secret: ['secret-42'] })
  })

  it('does not seed button or single checkbox values as answers', () => {
    const host = mountHost([
      { type: FieldType.Button, label: 'Go', name: 'go', subtype: 'button', value: 'go' },
      { type: FieldType.Checkbox, label: 'Agree', name: 'agree', value: 'I agree' },
    ])

    expect(answers(host)).toEqual({})
  })
})

describe('FormRenderer displayed defaults', () => {
  it('puts the values shown by range, color and single select inputs into userData', () => {
    const host = mountHost([
      { type: FieldType.Number, subtype: 'range', label: 'Range', name: 'range', min: '1', max: '5' },
      { type: FieldType.Text, subtype: 'color', label: 'Color', name: 'color' },
      {
        type: FieldType.Select,
        label: 'Select',
        name: 'select',
        values: [
          { label: 'Option 1', value: 'option-1', selected: false },
          { label: 'Option 2', value: 'option-2', selected: false },
        ],
      },
    ])

    expect(answers(host)).toEqual({ range: ['3'], color: ['#000000'], select: ['option-1'] })
    const inputs = host.renderer.findAll<HTMLInputElement>('[data-qa="control-input"]')
    expect(inputs.map((input) => input.element.value)).toEqual(['3', '#000000'])
    expect(host.renderer.find<HTMLSelectElement>('[data-qa="control-select"]').element.value).toBe('option-1')
  })
})


describe('FormRenderer reset button', () => {
  const resetButton: FormDataField = { type: FieldType.Button, label: 'Reset', name: 'reset', subtype: 'reset' }
  const plainButton: FormDataField = { type: FieldType.Button, label: 'Plain', name: 'plain', subtype: 'button' }

  it('restores default answers and drops typed ones', async () => {
    const host = mountHost([textField, checkboxGroupField, resetButton])
    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')
    await host.renderer.findAll('[data-qa="checkbox-input"]')[0]?.setValue(false)

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    host.renderer.find('[data-qa="control-button"]').element.dispatchEvent(click)
    await nextTick()

    expect(click.defaultPrevented).toBe(true)
    expect(answers(host)).toEqual({ choices: ['c1'] })
    expect(host.model.value).toEqual({ choices: ['c1'] })
    expect(host.renderer.find<HTMLInputElement>('[data-qa="control-input"]').element.value).toBe('')
  })

  it('leaves answers alone for other clicks', async () => {
    const host = mountHost([textField, plainButton])
    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')

    await host.renderer.find('[data-qa="control-button"]').trigger('click')
    await host.renderer.find('[data-qa="form-renderer"]').trigger('click')

    expect(answers(host)).toEqual({ 'full-name': ['Ada'] })
  })
})

function rendererApi(host: Host): RendererApi {
  const value = host.api.value
  if (!value) {
    throw new Error('renderer not mounted')
  }
  return value
}

describe('FormRenderer setData', () => {
  it('replaces the rendered fields and applies their defaults', async () => {
    const host = mountHost([textField])

    rendererApi(host).setData([checkboxGroupField, hiddenField])
    await nextTick()
    await nextTick()

    expect(host.renderer.find('[data-qa="control-input"]').exists()).toBe(false)
    expect(host.renderer.findAll('[data-qa="checkbox-input"]')).toHaveLength(2)
    expect(host.model.value).toEqual({ choices: ['c1'], secret: ['secret-42'] })
  })

  it('is replaced again when the formData prop changes', async () => {
    const host = mountHost([textField])
    rendererApi(host).setData([checkboxGroupField])
    await nextTick()

    await setFields(host, [hiddenField])

    expect(host.renderer.findAll('[data-qa="checkbox-input"]')).toHaveLength(0)
    expect(answers(host)).toEqual({ secret: ['secret-42'] })
  })
})

describe('FormRenderer getElement', () => {
  it('returns the control element of a field by name', () => {
    const host = mountHost([{ type: FieldType.Header, label: 'Title', subtype: 'h1' }, textField, hiddenField])

    expect(rendererApi(host).getElement('full-name')).toBe(host.renderer.find('[data-qa="control-input"]').element)
    expect(rendererApi(host).getElement('secret')).toBe(host.renderer.find('[data-qa="control-hidden"]').element)
  })

  it('returns undefined for unknown names', () => {
    expect(rendererApi(mountHost([textField])).getElement('nope')).toBeUndefined()
    expect(rendererApi(mountHost([])).getElement('nope')).toBeUndefined()
  })

  it('returns undefined when a field slot replaces the control', () => {
    const api = ref<RendererApi | null>(null)
    mount(defineComponent({
      setup: () => () => h(FormRenderer, { ref: api, formData: [textField] }, {
        field: () => h('input', { 'data-qa': 'custom' }),
      }),
    }))

    expect(api.value?.getElement('full-name')).toBeUndefined()
  })
})

describe('FormRenderer validate', () => {
  const required: FormDataField = { ...textField, required: true }
  const requiredGroup: FormDataField = {
    ...checkboxGroupField,
    required: true,
    values: [{ label: 'C1', value: 'c1', selected: false }],
  }

  it('returns errors and shows them on invalid fields', async () => {
    const host = mountHost([required, requiredGroup, { type: FieldType.Header, label: 'Title', subtype: 'h1' }])

    const errors = rendererApi(host).validate()
    await nextTick()

    expect(errors).toEqual({ 'full-name': ['Name is required'], choices: ['Choices is required'] })
    const input = host.renderer.find('[data-qa="control-input"]')
    const messages = host.renderer.findAll('[data-qa="field-error"]')
    expect(messages.map((m) => m.text())).toEqual(['Name is required', 'Choices is required'])
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(messages[0]?.attributes('id'))
    const group = host.renderer.findAll('[data-qa="renderer-field"]')[1]
    expect(group?.attributes('aria-invalid')).toBe('true')
    expect(group?.attributes('aria-describedby')).toBe(messages[1]?.attributes('id'))
  })

  it('returns no errors for a valid form', async () => {
    const host = mountHost([required])
    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')

    expect(rendererApi(host).validate()).toEqual({})
    await nextTick()
    expect(host.renderer.find('[data-qa="field-error"]').exists()).toBe(false)
    expect(host.renderer.find('[data-qa="control-input"]').attributes('aria-invalid')).toBeUndefined()
  })

  it('clears the error of a field once it is edited', async () => {
    const host = mountHost([required, requiredGroup])
    rendererApi(host).validate()
    await nextTick()

    await host.renderer.find('[data-qa="control-input"]').setValue('Ada')

    expect(host.renderer.findAll('[data-qa="field-error"]').map((m) => m.text())).toEqual(['Choices is required'])
  })

  it('drops errors on clear, reset and field removal', async () => {
    const resetButton: FormDataField = { type: FieldType.Button, label: 'Reset', name: 'reset', subtype: 'reset' }
    const host = mountHost([required, requiredGroup, resetButton])

    rendererApi(host).validate()
    rendererApi(host).clear()
    await nextTick()
    expect(host.renderer.findAll('[data-qa="field-error"]')).toHaveLength(0)

    rendererApi(host).validate()
    await host.renderer.find('[data-qa="control-button"]').trigger('click')
    expect(host.renderer.findAll('[data-qa="field-error"]')).toHaveLength(0)

    rendererApi(host).validate()
    await setFields(host, [requiredGroup])
    expect(host.renderer.findAll('[data-qa="field-error"]').map((m) => m.text())).toEqual(['Choices is required'])
  })

  it('passes native constraint attributes to the inputs', () => {
    const host = mountHost([
      { type: FieldType.Number, subtype: 'number', label: 'Age', name: 'age', required: true, min: '1', max: '9', step: '2' },
      { type: FieldType.Text, subtype: 'text', label: 'Nick', name: 'nick', maxlength: '5' },
      { type: FieldType.Textarea, label: 'Bio', name: 'bio', required: true, maxlength: '50' },
    ])
    const [age, nick] = host.renderer.findAll('[data-qa="control-input"]')
    const bio = host.renderer.find('[data-qa="control-textarea"]')

    expect(age?.attributes()).toMatchObject({ required: '', min: '1', max: '9', step: '2' })
    expect(nick?.attributes('maxlength')).toBe('5')
    expect(bio.attributes()).toMatchObject({ required: '', maxlength: '50' })
  })
})

describe('FormRenderer layout and nameless fields', () => {
  it('groups consecutive fields sharing a rowId, at most three per row', () => {
    const cell = (name: string, rowId?: string): FormDataField => ({ type: FieldType.Text, subtype: 'text', label: name, name, rowId })
    const host = mountHost([cell('a', 'r1'), cell('b', 'r1'), cell('c', 'r1'), cell('d', 'r1'), cell('e'), cell('f', 'r2')])

    const sizes = host.renderer.findAll('[data-qa="form-renderer-row"]').map((row) => row.attributes('data-row-size'))
    expect(sizes).toEqual(['3', '1', '1', '1'])
  })

  it('does not store answers of fields without a name', async () => {
    const host = mountHost([{ type: FieldType.Text, subtype: 'text', label: 'Anonymous' }])

    await host.renderer.find('[data-qa="control-input"]').setValue('typed')

    expect(answers(host)).toEqual({})
    expect(host.renderer.find<HTMLInputElement>('[data-qa="control-input"]').element.value).toBe('typed')
  })
})

describe('FormRenderer field registry', () => {
  it('keeps a built-in override registered before mount', () => {
    const registry = useFieldRegistry()
    const builtin = registry.getDefinition(FieldType.Text)
    if (!builtin) {
      throw new Error('text control not registered')
    }
    const custom = defineComponent({ setup: () => () => h('output', { 'data-qa': 'custom-text' }) })
    registry.register({ ...builtin, label: 'Custom text' }, custom as unknown as Parameters<typeof registry.register>[1])
    try {
      const host = mountHost([textField])

      expect(host.renderer.find('[data-qa="custom-text"]').exists()).toBe(true)
      expect(host.renderer.find('[data-qa="control-input"]').exists()).toBe(false)
      expect(registry.getDefinition(FieldType.Text)?.label).toBe('Custom text')
    } finally {
      registry.register(builtin, ControlInput as unknown as Parameters<typeof registry.register>[1])
    }
  })
})

describe('FormRenderer mount sync', () => {
  it('emits seeded defaults on mount when they differ from modelValue', () => {
    const host = mountHost([hiddenField], { secret: undefined } as unknown as UserDataMap)

    expect(host.renderer.emitted('update:modelValue')?.[0]?.[0]).toEqual({ secret: ['secret-42'] })
  })

  it('does not emit on mount when modelValue already holds the answers', () => {
    const host = mountHost([hiddenField], { secret: ['secret-42'] })

    expect(host.renderer.emitted('update:modelValue')).toBeUndefined()
    expect(host.renderer.emitted('render')).toHaveLength(1)
  })
})

