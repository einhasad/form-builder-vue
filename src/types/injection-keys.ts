import type { InjectionKey, DefineComponent } from 'vue'
import type { BuilderOptions } from './builder-options'
import type { ControlDefinition } from './control-definition'
import type { BuilderState } from './builder-state'

/** Injection key for builder options. */
export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('builder-options')

/** Injection key for field registry lookup function. */
export const FIELD_REGISTRY_KEY: InjectionKey<{
  getDefinition: (type: string, subtype?: string) => ControlDefinition | undefined
  getAllTypes: () => string[]
  getSubtypes: (type: string) => string[]
  isActive: (type: string) => boolean
  getDefaultAttrs: (type: string) => string[]
  resolveComponent: (type: string, subtype?: string) => DefineComponent | undefined
}> = Symbol('field-registry')

/** Injection key for i18n translation function. */
export const I18N_KEY: InjectionKey<{ t: (key: string) => string }> = Symbol('i18n')

/** Injection key for builder state. */
export const BUILDER_STATE_KEY: InjectionKey<BuilderState> = Symbol('builder-state')
