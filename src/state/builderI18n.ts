import { inject, provide, type InjectionKey } from 'vue'

/**
 * Translator surface exposed through provide/inject. Host components create
 * the instance via `useI18n()`, pick the `t` function, and publish it using
 * {@link provideBuilderI18n}; descendants read the context through
 * {@link useBuilderI18n}.
 */
export interface BuilderI18nContext {
  t: (key: string) => string
}

const BUILDER_I18N_KEY: InjectionKey<BuilderI18nContext> = Symbol('builder-i18n')

export function provideBuilderI18n(i18n: BuilderI18nContext): void {
  provide(BUILDER_I18N_KEY, i18n)
}

export function useBuilderI18n(): BuilderI18nContext | undefined {
  return inject(BUILDER_I18N_KEY, undefined)
}
