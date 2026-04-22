import { inject, provide, type InjectionKey } from 'vue'
import type { BuilderOptions } from '../types/builder-options'

const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('builder-options')

export function provideBuilderOptions(options: BuilderOptions): void {
  provide(BUILDER_OPTIONS_KEY, options)
}

export function useBuilderOptions(): BuilderOptions | undefined {
  return inject(BUILDER_OPTIONS_KEY, undefined)
}
