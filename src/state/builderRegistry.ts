import { inject, provide, type InjectionKey, type DefineComponent } from 'vue'
import type { ControlDefinition } from '../types/control-definition'

/**
 * Read-only view of the field registry shared through provide/inject. Host
 * components construct this from `useFieldRegistry()` and call
 * {@link provideBuilderRegistry}; descendants read it via
 * {@link useBuilderRegistry}.
 */
export interface BuilderRegistryContext {
  getDefinition: (type: string, subtype?: string) => ControlDefinition | undefined
  getAllTypes: () => string[]
  getSubtypes: (type: string) => string[]
  isActive: (type: string) => boolean
  getDefaultAttrs: (type: string) => string[]
  resolveComponent: (type: string, subtype?: string) => DefineComponent | undefined
}

const BUILDER_REGISTRY_KEY: InjectionKey<BuilderRegistryContext> = Symbol('builder-registry')

export function provideBuilderRegistry(registry: BuilderRegistryContext): void {
  provide(BUILDER_REGISTRY_KEY, registry)
}

export function useBuilderRegistry(): BuilderRegistryContext | undefined {
  return inject(BUILDER_REGISTRY_KEY, undefined)
}
