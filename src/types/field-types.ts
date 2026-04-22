/** Supported form field types. */
export enum FieldType {
  Autocomplete = 'autocomplete',
  Button = 'button',
  CheckboxGroup = 'checkbox-group',
  Checkbox = 'checkbox',
  Date = 'date',
  File = 'file',
  Header = 'header',
  Hidden = 'hidden',
  Number = 'number',
  Paragraph = 'paragraph',
  RadioGroup = 'radio-group',
  Select = 'select',
  Text = 'text',
  Textarea = 'textarea',
}

/** Subtype union for text inputs. */
export type TextSubtype = 'text' | 'password' | 'email' | 'color' | 'tel'

/** Subtype union for date inputs. */
export type DateSubtype = 'date' | 'time' | 'datetime-local'

/** Subtype union for number inputs. */
export type NumberSubtype = 'number' | 'range'

/** Subtype union for header elements. */
export type HeaderSubtype = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/** Subtype union for paragraph elements. */
export type ParagraphSubtype = 'p' | 'address' | 'blockquote' | 'canvas' | 'output'

/** Subtype union for button elements. */
export type ButtonSubtype = 'button' | 'submit' | 'reset'

/** Subtype union for textarea elements. */
export type TextareaSubtype = 'textarea' | 'quill'

/** Mapping from field type to available subtypes. */
export const SUBTYPE_MAP: Record<FieldType, string[]> = {
  [FieldType.Autocomplete]: [],
  [FieldType.Button]: ['button', 'submit', 'reset'] as ButtonSubtype[],
  [FieldType.CheckboxGroup]: [],
  [FieldType.Checkbox]: [],
  [FieldType.Date]: ['date', 'time', 'datetime-local'] as DateSubtype[],
  [FieldType.File]: [],
  [FieldType.Header]: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as HeaderSubtype[],
  [FieldType.Hidden]: [],
  [FieldType.Number]: ['number', 'range'] as NumberSubtype[],
  [FieldType.Paragraph]: ['p', 'address', 'blockquote', 'canvas', 'output'] as ParagraphSubtype[],
  [FieldType.RadioGroup]: [],
  [FieldType.Select]: [],
  [FieldType.Text]: ['text', 'password', 'email', 'color', 'tel'] as TextSubtype[],
  [FieldType.Textarea]: ['textarea', 'quill'] as TextareaSubtype[],
}
