<script setup lang="ts">
import type { FormDataField } from '../../types/form-data'

/** The form field definition. */
const props = defineProps<{
  /** The form field definition. */
  field: FormDataField
  /** Current answer value(s). */
  modelValue: string[]
  /** Whether the control is in builder preview mode. */
  preview?: boolean
  /** Whether the control is disabled. */
  disabled?: boolean
}>()

const emit = defineEmits<(e: 'update:modelValue', value: string[]) => void>()

void props.modelValue
void props.preview

const ALLOWED_STYLES = new Set(['default', 'danger', 'info', 'primary', 'success', 'warning'])

function onClick(): void {
  emit('update:modelValue', [props.field.value ?? 'clicked'])
}

function getStyle(): string {
  const style = props.field.style ?? 'default'
  return ALLOWED_STYLES.has(style) ? style : 'default'
}

function getButtonClass(): string {
  const userClass = props.field.className ?? ''
  return `fbv-btn ${userClass}`.trim()
}
</script>

<template>
  <button
    :type="(props.field.subtype as 'button' | 'submit' | 'reset') ?? 'button'"
    :class="getButtonClass()"
    :data-style="getStyle()"
    :name="props.field.name"
    :disabled="props.disabled"
    data-qa="control-button"
    @click.prevent="onClick"
  >
    {{ props.field.label }}
  </button>
</template>

<style scoped>
.fbv-btn {
  display: inline-block;
  padding: 7px 14px;
  font: inherit;
  font-size: 13px;
  line-height: 1.4;
  border: 1px solid var(--line-2, #d3cec1);
  border-radius: 4px;
  background: var(--surface, #fff);
  color: var(--ink, #111);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.fbv-btn:hover:not(:disabled) {
  border-color: var(--ink, #111);
}

.fbv-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 200, 51, 0.35);
}

.fbv-btn:disabled {
  background: var(--surface-sunk, #f3f0e8);
  color: var(--ink-3, #6e6a63);
  cursor: not-allowed;
}

.fbv-btn[data-style="primary"] {
  background: #0d6efd;
  border-color: #0d6efd;
  color: #fff;
}
.fbv-btn[data-style="primary"]:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.fbv-btn[data-style="danger"] {
  background: #dc3545;
  border-color: #dc3545;
  color: #fff;
}
.fbv-btn[data-style="danger"]:hover:not(:disabled) {
  background: #bb2d3b;
  border-color: #b02a37;
}

.fbv-btn[data-style="success"] {
  background: #198754;
  border-color: #198754;
  color: #fff;
}
.fbv-btn[data-style="success"]:hover:not(:disabled) {
  background: #157347;
  border-color: #146c43;
}

.fbv-btn[data-style="info"] {
  background: #0dcaf0;
  border-color: #0dcaf0;
  color: #000;
}
.fbv-btn[data-style="info"]:hover:not(:disabled) {
  background: #31d2f2;
  border-color: #25cff2;
}

.fbv-btn[data-style="warning"] {
  background: #ffc107;
  border-color: #ffc107;
  color: #000;
}
.fbv-btn[data-style="warning"]:hover:not(:disabled) {
  background: #ffca2c;
  border-color: #ffc720;
}
</style>
