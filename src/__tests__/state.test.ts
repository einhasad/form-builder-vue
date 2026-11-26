import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import {
  provideBuilderI18n,
  provideBuilderOptions,
  provideBuilderRegistry,
  provideBuilderState,
  useBuilderI18n,
  useBuilderOptions,
  useBuilderRegistry,
  useBuilderState,
  type BuilderI18nContext,
  type BuilderRegistryContext,
} from '../state'
import type { BuilderOptions } from '../types/builder-options'
import type { BuilderState } from '../types/builder-state'

interface Injected {
  options: BuilderOptions | undefined
  state: BuilderState | undefined
  registry: BuilderRegistryContext | undefined
  i18n: BuilderI18nContext | undefined
}

function injectAll(provider?: () => void): Injected {
  const injected: Injected = { options: undefined, state: undefined, registry: undefined, i18n: undefined }
  const Child = defineComponent({
    setup() {
      injected.options = useBuilderOptions()
      injected.state = useBuilderState()
      injected.registry = useBuilderRegistry()
      injected.i18n = useBuilderI18n()
      return () => h('div')
    },
  })
  const Parent = defineComponent({
    setup() {
      provider?.()
      return () => h(Child)
    },
  })
  mount(Parent)
  return injected
}

describe('state provide/inject helpers', () => {
  it('returns undefined for every context when nothing is provided', () => {
    const injected = injectAll()

    expect(injected.options).toBeUndefined()
    expect(injected.state).toBeUndefined()
    expect(injected.registry).toBeUndefined()
    expect(injected.i18n).toBeUndefined()
  })

  it('delivers each provided context to descendants', () => {
    const options = { controlPosition: 'left' } as BuilderOptions
    const state: BuilderState = { fields: ref([]), selectedFieldId: ref<string | null>(null), fieldIdCounter: ref(0) }
    const registry: BuilderRegistryContext = {
      getDefinition: () => undefined,
      getAllTypes: () => ['text'],
      getSubtypes: () => [],
      isActive: () => true,
      getDefaultAttrs: () => [],
      resolveComponent: () => undefined,
    }
    const i18n: BuilderI18nContext = { t: (key: string) => `t:${key}` }

    const injected = injectAll(() => {
      provideBuilderOptions(options)
      provideBuilderState(state)
      provideBuilderRegistry(registry)
      provideBuilderI18n(i18n)
    })

    expect(injected.options).toBe(options)
    expect(injected.state).toBe(state)
    expect(injected.registry).toBe(registry)
    expect(injected.i18n?.t('label')).toBe('t:label')
  })
})
