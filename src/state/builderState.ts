import { inject, provide, type InjectionKey } from 'vue'
import type { BuilderState } from '../types/builder-state'

const BUILDER_STATE_KEY: InjectionKey<BuilderState> = Symbol('builder-state')

export function provideBuilderState(state: BuilderState): void {
  provide(BUILDER_STATE_KEY, state)
}

export function useBuilderState(): BuilderState | undefined {
  return inject(BUILDER_STATE_KEY, undefined)
}
