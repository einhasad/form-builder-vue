import { ref, type Ref } from 'vue'
import type { FormDataField } from '../types/form-data'
import type { UserDataMap } from '../types/user-data'
import { FieldType } from '../types/field-types'
import { useI18n } from './useI18n'

type Translate = (key: string) => string

function isBlank(answer: string[]): boolean {
  return answer.every((value) => value === '')
}

function format(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => params[name] ?? placeholder)
}

function rangeErrors(field: FormDataField, text: string, t: Translate): string[] {
  const value = Number(text)
  const errors: string[] = []
  if (field.min !== undefined && field.min !== '' && value < Number(field.min)) {
    errors.push(format(t('validationMin'), { label: field.label, min: field.min }))
  }
  if (field.max !== undefined && field.max !== '' && value > Number(field.max)) {
    errors.push(format(t('validationMax'), { label: field.label, max: field.max }))
  }
  return errors
}

function answerErrors(field: FormDataField, answer: string[], t: Translate): string[] {
  if (isBlank(answer)) {
    return field.required ? [format(t('validationRequired'), { label: field.label })] : []
  }
  const text = answer.join('')
  const errors: string[] = []
  if (field.maxlength && text.length > Number(field.maxlength)) {
    errors.push(format(t('validationMaxlength'), { label: field.label, maxlength: field.maxlength }))
  }
  if (field.type === FieldType.Number) {
    errors.push(...rangeErrors(field, text, t))
  }
  return errors
}

/**
 * Composable for managing form renderer state and user answers.
 * @param t - Translator for validation messages; defaults to the built-in English messages.
 */
export function useFormRenderer(t: Translate = useI18n().t): {
  localData: Ref<UserDataMap>
  errors: Ref<Record<string, string[]>>
  setAnswer: (fieldName: string, value: string[]) => void
  getAnswer: (fieldName: string) => string[]
  getAllAnswers: () => UserDataMap
  clearAnswers: () => void
  validate: (formFields: FormDataField[]) => boolean
  mergeUserData: (formFields: FormDataField[]) => FormDataField[]
  setAnswers: (data: UserDataMap) => void
} {
  const localData = ref<UserDataMap>({})
  const errors = ref<Record<string, string[]>>({})

  /**
   * Set the answer for a field.
   * @param fieldName - The field name.
   * @param value - The array of values.
   */
  function setAnswer(fieldName: string, value: string[]): void {
    localData.value = { ...localData.value, [fieldName]: value }
  }

  /**
   * Get the answer for a field.
   * @param fieldName - The field name.
   * @returns The array of values or empty array.
   */
  function getAnswer(fieldName: string): string[] {
    return localData.value[fieldName] ?? []
  }

  /**
   * Get all answers.
   * @returns The full UserDataMap.
   */
  function getAllAnswers(): UserDataMap {
    return { ...localData.value }
  }

  /**
   * Clear all answers.
   */
  function clearAnswers(): void {
    localData.value = {}
    errors.value = {}
  }

  /**
   * Validate all fields against their definitions.
   * @param formFields - The field definitions to validate against.
   * @returns True if all fields are valid.
   */
  function validate(formFields: FormDataField[]): boolean {
    const newErrors: Record<string, string[]> = {}
    let isValid = true

    for (const field of formFields) {
      const fieldName = field.name
      if (!fieldName) {
        continue
      }

      const answer = localData.value[fieldName] ?? []
      const fieldErrors = answerErrors(field, answer, t)

      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors
        isValid = false
      }
    }

    errors.value = newErrors
    return isValid
  }

  /**
   * Merge user data into form field definitions.
   * @param formFields - The field definitions.
   * @returns Fields with userData merged in.
   */
  function mergeUserData(formFields: FormDataField[]): FormDataField[] {
    return formFields.map((field) => {
      if (!field.name) {
        return { ...field }
      }
      const userData = localData.value[field.name]
      return { ...field, userData }
    })
  }

  /**
   * Set answers from an external source.
   * @param data - The user data map to load.
   */
  function setAnswers(data: UserDataMap): void {
    localData.value = { ...data }
  }

  return {
    localData,
    errors,
    setAnswer,
    getAnswer,
    getAllAnswers,
    clearAnswers,
    validate,
    mergeUserData,
    setAnswers,
  }
}
