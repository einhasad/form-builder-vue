import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { FieldType } from '../types/field-types'

/** Composable for managing drag-and-drop state in the builder. */
export function useDragDrop(): {
  draggedType: Ref<FieldType | null>
  draggedFieldId: Ref<string | null>
  dropTargetIndex: Ref<number | null>
  isDragging: ComputedRef<boolean>
  onControlDragStart: (type: FieldType, event: DragEvent) => void
  onControlDragEnd: () => void
  onFieldDragStart: (fieldId: string, event: DragEvent) => void
  onStageDragOver: (index: number, event: DragEvent) => void
  onStageDrop: (index: number, event: DragEvent) => void
  onFieldReorder: (fieldId: string, newIndex: number) => void
} {
  const draggedType = ref<FieldType | null>(null)
  const draggedFieldId = ref<string | null>(null)
  const dropTargetIndex = ref<number | null>(null)

  /** Whether a drag operation is in progress. */
  const isDragging = computed(
    () => draggedType.value !== null || draggedFieldId.value !== null,
  )

  /**
   * Handle drag start from the control panel.
   * @param type - The field type being dragged.
   * @param event - The drag event.
   */
  function onControlDragStart(type: FieldType, event: DragEvent): void {
    draggedType.value = type
    draggedFieldId.value = null
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData('text/plain', `control:${type}`)
    }
  }

  /**
   * Handle drag end.
   */
  function onControlDragEnd(): void {
    draggedType.value = null
    draggedFieldId.value = null
    dropTargetIndex.value = null
  }

  /**
   * Handle drag start from an existing field on the stage.
   * @param fieldId - The internal ID of the field being dragged.
   * @param event - The drag event.
   */
  function onFieldDragStart(fieldId: string, event: DragEvent): void {
    draggedFieldId.value = fieldId
    draggedType.value = null
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', `field:${fieldId}`)
    }
  }

  /**
   * Handle drag over a position on the stage.
   * @param index - The target index.
   * @param event - The drag event.
   */
  function onStageDragOver(index: number, event: DragEvent): void {
    event.preventDefault()
    dropTargetIndex.value = index
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = draggedType.value ? 'copy' : 'move'
    }
  }

  /**
   * Handle drop on the stage.
   * @param index - The target index.
   * @param event - The drag event.
   */
  function onStageDrop(index: number, event: DragEvent): void {
    void index
    event.preventDefault()
    dropTargetIndex.value = null
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'none'
    }
  }

  /**
   * Handle field reorder via drag.
   * @param fieldId - The field ID being moved.
   * @param newIndex - The new index.
   */
  function onFieldReorder(fieldId: string, newIndex: number): void {
    void fieldId
    void newIndex
    draggedFieldId.value = null
    dropTargetIndex.value = null
  }

  return {
    draggedType,
    draggedFieldId,
    dropTargetIndex,
    isDragging,
    onControlDragStart,
    onControlDragEnd,
    onFieldDragStart,
    onStageDragOver,
    onStageDrop,
    onFieldReorder,
  }
}
