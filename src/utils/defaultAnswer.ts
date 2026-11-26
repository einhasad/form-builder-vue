import { FieldType } from '../types/field-types'
import type { FormDataField } from '../types/form-data'

const NON_ANSWER_TYPES = new Set<string>([FieldType.Button, FieldType.Checkbox])

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return value !== undefined && value !== '' && Number.isFinite(parsed) ? parsed : fallback
}

function rangeDefault(field: FormDataField): string {
  const min = toNumber(field.min, 0)
  const max = toNumber(field.max, 100)
  const requestedStep = toNumber(field.step, 1)
  const step = requestedStep > 0 ? requestedStep : 1
  if (max < min) {
    return String(min)
  }
  return String(min + Math.round((max - min) / 2 / step) * step)
}

function displayedDefault(field: FormDataField): string[] | undefined {
  if (field.type === FieldType.Number && field.subtype === 'range') {
    return [rangeDefault(field)]
  }
  if (field.type === FieldType.Text && field.subtype === 'color') {
    return ['#000000']
  }
  const firstOption = field.values?.[0]
  if (field.type === FieldType.Select && !field.multiple && !field.placeholder && firstOption) {
    return [firstOption.value]
  }
  return undefined
}

/**
 * Answer a rendered field starts with: its preset value(s), or what the browser shows for an empty control.
 * @param field - The field definition.
 * @returns The starting answer, or undefined when the field starts unanswered.
 */
export function defaultAnswer(field: FormDataField): string[] | undefined {
  if (NON_ANSWER_TYPES.has(field.type)) {
    return undefined
  }
  const selected = (field.values ?? []).filter((option) => option.selected).map((option) => option.value)
  if (selected.length > 0) {
    return selected
  }
  if (field.value !== undefined && field.value !== '') {
    return [field.value]
  }
  return displayedDefault(field)
}
