import { ref, watch, type Ref } from 'vue'
import type { FormDataField } from '../types/form-data'

interface OtherOptionSource {
  readonly field: FormDataField
  readonly modelValue: string[]
}

/**
 * Tracks the free-text "Other" answer of a radio or checkbox group.
 * Any answer that is not one of the field's option values is treated as the "Other" text.
 * @param source - Reactive props holding the field definition and the current answers.
 * @param singleChoice - True for radio groups, where picking an option deselects "Other".
 * @returns Reactive "Other" state and helpers to build the emitted answer list.
 */
export function useOtherOption(source: OtherOptionSource, singleChoice: boolean): {
  otherSelected: Ref<boolean>
  otherValue: Ref<string>
  optionAnswers: () => string[]
  withOther: (answers: string[]) => string[]
} {
  const otherSelected = ref(false)
  const otherValue = ref('')

  function isOptionValue(value: string): boolean {
    return (source.field.values ?? []).some((option) => option.value === value)
  }

  function optionAnswers(): string[] {
    return source.modelValue.filter(isOptionValue)
  }

  function withOther(answers: string[]): string[] {
    return otherSelected.value && otherValue.value !== '' ? [...answers, otherValue.value] : answers
  }

  watch(
    () => source.modelValue,
    (answers) => {
      const otherAnswer = answers.find((value) => !isOptionValue(value))
      if (otherAnswer !== undefined) {
        otherSelected.value = true
        otherValue.value = otherAnswer
      } else if (otherValue.value !== '' || (singleChoice && answers.length > 0)) {
        otherSelected.value = false
        otherValue.value = ''
      }
    },
    { immediate: true },
  )

  return { otherSelected, otherValue, optionAnswers, withOther }
}
