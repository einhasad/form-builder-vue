import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, provide, defineComponent } from 'vue'
import BuilderControlPanel from '../components/BuilderControlPanel.vue'
import { FIELD_REGISTRY_KEY, I18N_KEY, BUILDER_OPTIONS_KEY } from '../types/injection-keys'
import { FieldType } from '../types/field-types'
import type { ControlDefinition } from '../types/control-definition'
import type { BuilderOptions } from '../types/builder-options'

const fullRegistry = {
  getAllTypes: () => [FieldType.Text, FieldType.Select, FieldType.Number],
  getDefinition: (type: string) => {
    const defs: Record<string, ControlDefinition> = {
      [FieldType.Text]: {
        type: FieldType.Text, subtypes: [], label: 'Text Field', icon: 'T',
        inactive: [], defaultAttrs: [], disabledAttrs: [], layout: 'default',
      },
      [FieldType.Select]: {
        type: FieldType.Select, subtypes: [], label: 'Select', icon: '▾',
        inactive: [], defaultAttrs: [], disabledAttrs: [], layout: 'default',
      },
      [FieldType.Number]: {
        type: FieldType.Number, subtypes: [], label: 'Number', icon: '#',
        inactive: [], defaultAttrs: [], disabledAttrs: [], layout: 'default',
      },
    }
    return defs[type]
  },
  getSubtypes: () => [] as string[],
  isActive: () => true,
  getDefaultAttrs: () => [] as string[],
  resolveComponent: () => undefined,
}

const defaultOptions: BuilderOptions = {
  controlOrder: [FieldType.Text, FieldType.Select],
  controlPosition: 'left',
  defaultFields: [],
  disabledAttrs: [],
  disabledFieldButtons: {},
  disabledSubtypes: {},
  disableFields: [],
  disableHTMLLabels: false,
  editOnAdd: false,
  fields: [],
  fieldRemoveWarn: false,
  inputSets: [],
  roles: {},
  scrollToFieldOnAdd: false,
  sortableControls: false,
  showActionButtons: true,
  actionButtons: [],
  disabledActionButtons: [],
  typeUserAttrs: {},
  typeUserDisabledAttrs: {},
  typeUserEvents: {},
}

function createWrapper(
  disabledTypes: string[] = [],
  providedRegistry?: typeof fullRegistry,
  providedI18n?: { t: (key: string) => string },
  providedOptions?: BuilderOptions,
): ReturnType<typeof mount> {
  const ParentComponent = defineComponent({
    setup() {
      provide(FIELD_REGISTRY_KEY, providedRegistry ?? fullRegistry)
      provide(I18N_KEY, providedI18n ?? { t: (key: string) => key })
      provide(BUILDER_OPTIONS_KEY, providedOptions ?? defaultOptions)
    },
    render() {
      return h(BuilderControlPanel, { disabledTypes })
    },
  })

  return mount(ParentComponent, { attachTo: document.body })
}

describe('BuilderControlPanel', () => {
  it('renders all controls from registry', () => {
    const wrapper = createWrapper()

    const items = wrapper.findAll('[data-qa="control-item"]')
    expect(items).toHaveLength(3)
    expect(items[0].text()).toContain('text')
    expect(items[1].text()).toContain('select')
    expect(items[2].text()).toContain('number')
  })

  it('hides disabled types', () => {
    const wrapper = createWrapper([FieldType.Select])

    const items = wrapper.findAll('[data-qa="control-item"]')
    expect(items).toHaveLength(2)
    expect(items.every(item => !item.text().includes('select'))).toBe(true)
  })

  it('emits control-click when clicking a control', async () => {
    const wrapper = createWrapper()

    const panel = wrapper.findComponent(BuilderControlPanel)
    const items = wrapper.findAll('[data-qa="control-item"]')
    await items[0].trigger('click')

    expect(panel.emitted('control-click')).toBeTruthy()
    expect(panel.emitted('control-click')[0][0]).toEqual({ type: FieldType.Text })
  })

  it('emits control-drag-start when dragging a control', async () => {
    const wrapper = createWrapper()

    const panel = wrapper.findComponent(BuilderControlPanel)
    const items = wrapper.findAll('[data-qa="control-item"]')
    const dataTransfer = {
      effectAllowed: null as string | null,
      setData: () => { /* mock for drag data */ },
    }

    await items[0].trigger('dragstart', { dataTransfer })

    expect(panel.emitted('control-drag-start')).toBeTruthy()
    expect(panel.emitted('control-drag-start')[0][0]).toEqual({ type: FieldType.Text })
  })

  it('renders panel title', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('.panel-title').text()).toBe('Add fields')
  })

  it('uses i18n for labels when available', () => {
    const wrapper = createWrapper(undefined, undefined, {
      t: (key: string) => `[${key}]`,
    })

    const items = wrapper.findAll('[data-qa="control-item"]')
    expect(items[0].text()).toContain('[text]')
  })

  it('shows no controls when registry is not provided', () => {
    const ParentComponent = defineComponent({
      render() {
        return h(BuilderControlPanel, { disabledTypes: [] })
      },
    })

    const wrapper = mount(ParentComponent)

    expect(wrapper.findAll('[data-qa="control-item"]')).toHaveLength(0)
  })

  it('falls back to key when i18n is not provided', () => {
    const ParentComponent = defineComponent({
      setup() {
        provide(FIELD_REGISTRY_KEY, {
          ...fullRegistry,
          getAllTypes: () => [FieldType.Text],
          getDefinition: () => ({
            type: FieldType.Text, subtypes: [], label: 'Text', icon: 'T',
            inactive: [], defaultAttrs: [], disabledAttrs: [], layout: 'default',
          }),
        })
        provide(BUILDER_OPTIONS_KEY, defaultOptions)
      },
      render() {
        return h(BuilderControlPanel, { disabledTypes: [] })
      },
    })

    const wrapper = mount(ParentComponent)
    const items = wrapper.findAll('[data-qa="control-item"]')
    expect(items[0].text()).toContain('text')
  })

  it('renders an SVG icon for each registered control', () => {
    const wrapper = createWrapper()

    const icons = wrapper.findAll('.control-icon')
    expect(icons).toHaveLength(3)
    for (const icon of icons) {
      expect(icon.element.tagName.toLowerCase()).toBe('svg')
      expect(icon.attributes('data-qa')).toBe('builder-icon')
    }
  })

  it('handles missing BUILDER_OPTIONS_KEY injection', () => {
    const ParentComponent = defineComponent({
      setup() {
        provide(FIELD_REGISTRY_KEY, fullRegistry)
        provide(I18N_KEY, { t: (key: string) => key })
        // Intentionally NOT providing BUILDER_OPTIONS_KEY
      },
      render() {
        return h(BuilderControlPanel, { disabledTypes: [] })
      },
    })

    const wrapper = mount(ParentComponent)

    const items = wrapper.findAll('[data-qa="control-item"]')
    expect(items).toHaveLength(3)
  })

  it('renders custom field presets after built-in chips', () => {
    const wrapper = createWrapper(undefined, undefined, undefined, {
      ...defaultOptions,
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
    })

    const presets = wrapper.findAll('[data-qa="control-preset-item"]')
    expect(presets).toHaveLength(1)
    expect(presets[0].text()).toContain('Yes/No')
  })

  it('falls back to the type label when a preset has no custom label', () => {
    const wrapper = createWrapper(undefined, undefined, { t: (k) => `[${k}]` }, {
      ...defaultOptions,
      fields: [{ type: FieldType.Text }],
    })

    const presets = wrapper.findAll('[data-qa="control-preset-item"]')
    expect(presets[0].text()).toContain('[text]')
  })

  it('emits control-click with the preset payload on preset click', async () => {
    const preset = {
      type: FieldType.CheckboxGroup,
      label: 'ABF',
      values: [{ label: 'A', value: 'a', selected: true }],
    }
    const wrapper = createWrapper(undefined, undefined, undefined, {
      ...defaultOptions,
      fields: [preset],
    })

    const panel = wrapper.findComponent(BuilderControlPanel)
    await wrapper.findAll('[data-qa="control-preset-item"]')[0].trigger('click')

    expect(panel.emitted('control-click')).toBeTruthy()
    expect(panel.emitted('control-click')[0][0]).toEqual({ type: FieldType.CheckboxGroup, preset })
  })

  it('sets a preset-indexed text/plain payload on preset dragstart', async () => {
    const wrapper = createWrapper(undefined, undefined, undefined, {
      ...defaultOptions,
      fields: [{ type: FieldType.RadioGroup, label: 'Yes/No' }],
    })

    const panel = wrapper.findComponent(BuilderControlPanel)
    let plain = ''
    let control = ''
    const dataTransfer = {
      effectAllowed: null as string | null,
      setData: (format: string, value: string) => {
        if (format === 'text/plain') {
          plain = value
        }
        if (format === 'application/x-formbuilder-control') {
          control = value
        }
      },
    }

    await wrapper.findAll('[data-qa="control-preset-item"]')[0].trigger('dragstart', { dataTransfer })

    expect(plain).toBe('control:preset:0')
    expect(control).toBe(FieldType.RadioGroup)
    expect(panel.emitted('control-drag-start')[0][0]).toMatchObject({ type: FieldType.RadioGroup })
  })
})
