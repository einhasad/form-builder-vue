import { describe, it, expect } from 'vitest'
import { useDragDrop } from '../composables/useDragDrop'
import { FieldType } from '../types/field-types'

function createDataTransfer(): DataTransfer {
  const store: Record<string, string> = {}
  return {
    dropEffect: 'none',
    effectAllowed: 'uninitialized',
    setData(format: string, data: string) { store[format] = data },
    getData(format: string) { return store[format] ?? '' },
    clearData() { Object.keys(store).forEach(key => { store[key] = '' }) },
    setDragImage: () => { /* no-op mock */ },
    types: [],
    files: {} as FileList,
    items: {} as DataTransferItemList,
  } as DataTransfer
}

describe('useDragDrop', () => {
  it('initial state has no drag in progress', () => {
    const dd = useDragDrop()

    expect(dd.draggedType.value).toBeNull()
    expect(dd.draggedFieldId.value).toBeNull()
    expect(dd.dropTargetIndex.value).toBeNull()
    expect(dd.isDragging.value).toBe(false)
  })

  it('onControlDragStart sets draggedType', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onControlDragStart(FieldType.Text, { dataTransfer } as DragEvent)

    expect(dd.draggedType.value).toBe(FieldType.Text)
    expect(dd.draggedFieldId.value).toBeNull()
    expect(dd.isDragging.value).toBe(true)
  })

  it('onControlDragStart sets data transfer data', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onControlDragStart(FieldType.Select, { dataTransfer } as DragEvent)

    expect(dataTransfer.effectAllowed).toBe('copy')
    expect(dataTransfer.getData('text/plain')).toBe('control:select')
  })

  it('onControlDragStart handles null dataTransfer', () => {
    const dd = useDragDrop()

    dd.onControlDragStart(FieldType.Text, { dataTransfer: null } as unknown as DragEvent)

    expect(dd.draggedType.value).toBe(FieldType.Text)
    expect(dd.isDragging.value).toBe(true)
  })

  it('onControlDragEnd resets all drag state', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onControlDragStart(FieldType.Text, { dataTransfer } as DragEvent)
    expect(dd.isDragging.value).toBe(true)

    dd.onControlDragEnd()

    expect(dd.draggedType.value).toBeNull()
    expect(dd.draggedFieldId.value).toBeNull()
    expect(dd.dropTargetIndex.value).toBeNull()
    expect(dd.isDragging.value).toBe(false)
  })

  it('onFieldDragStart sets draggedFieldId', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onFieldDragStart('field-123', { dataTransfer } as DragEvent)

    expect(dd.draggedFieldId.value).toBe('field-123')
    expect(dd.draggedType.value).toBeNull()
    expect(dd.isDragging.value).toBe(true)
  })

  it('onFieldDragStart sets move effectAllowed', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onFieldDragStart('field-456', { dataTransfer } as DragEvent)

    expect(dataTransfer.effectAllowed).toBe('move')
    expect(dataTransfer.getData('text/plain')).toBe('field:field-456')
  })

  it('onFieldDragStart handles null dataTransfer', () => {
    const dd = useDragDrop()

    dd.onFieldDragStart('field-789', { dataTransfer: null } as unknown as DragEvent)

    expect(dd.draggedFieldId.value).toBe('field-789')
  })

  it('onStageDragOver sets dropTargetIndex and prevents default', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()
    const event = { preventDefault: () => { /* no-op for test */ }, dataTransfer } as DragEvent

    dd.onControlDragStart(FieldType.Text, { dataTransfer: createDataTransfer() } as DragEvent)
    dd.onStageDragOver(3, event)

    expect(dd.dropTargetIndex.value).toBe(3)
  })

  it('onStageDragOver sets copy effect when dragging control type', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onControlDragStart(FieldType.Text, { dataTransfer: createDataTransfer() } as DragEvent)
    dd.onStageDragOver(0, { preventDefault: () => { /* no-op for test */ }, dataTransfer } as DragEvent)

    expect(dataTransfer.dropEffect).toBe('copy')
  })

  it('onStageDragOver sets move effect when dragging field', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onFieldDragStart('field-1', { dataTransfer: createDataTransfer() } as DragEvent)
    dd.onStageDragOver(2, { preventDefault: () => { /* no-op for test */ }, dataTransfer } as DragEvent)

    expect(dataTransfer.dropEffect).toBe('move')
  })

  it('onStageDragOver handles null dataTransfer', () => {
    const dd = useDragDrop()

    dd.onStageDragOver(5, { preventDefault: () => { /* no-op for test */ }, dataTransfer: null } as unknown as DragEvent)

    expect(dd.dropTargetIndex.value).toBe(5)
  })

  it('onStageDrop resets drop target and sets effect to none', () => {
    const dd = useDragDrop()
    const dataTransfer = createDataTransfer()

    dd.onStageDragOver(3, { preventDefault: () => { /* no-op for test */ }, dataTransfer } as DragEvent)
    dd.onStageDrop(3, { preventDefault: () => { /* no-op for test */ }, dataTransfer } as DragEvent)

    expect(dd.dropTargetIndex.value).toBeNull()
    expect(dataTransfer.dropEffect).toBe('none')
  })

  it('onStageDrop handles null dataTransfer', () => {
    const dd = useDragDrop()

    dd.onStageDrop(0, { preventDefault: () => { /* no-op for test */ }, dataTransfer: null } as unknown as DragEvent)

    expect(dd.dropTargetIndex.value).toBeNull()
  })

  it('onFieldReorder resets drag state', () => {
    const dd = useDragDrop()

    dd.onFieldDragStart('field-1', { dataTransfer: createDataTransfer() } as DragEvent)
    expect(dd.isDragging.value).toBe(true)

    dd.onFieldReorder('field-1', 3)

    expect(dd.draggedFieldId.value).toBeNull()
    expect(dd.dropTargetIndex.value).toBeNull()
  })

  it('isDragging is true when draggedType is set', () => {
    const dd = useDragDrop()

    dd.onControlDragStart(FieldType.Text, { dataTransfer: createDataTransfer() } as DragEvent)
    expect(dd.isDragging.value).toBe(true)
  })

  it('isDragging is true when draggedFieldId is set', () => {
    const dd = useDragDrop()

    dd.onFieldDragStart('field-1', { dataTransfer: createDataTransfer() } as DragEvent)
    expect(dd.isDragging.value).toBe(true)
  })

  it('isDragging is false after drag end', () => {
    const dd = useDragDrop()

    dd.onControlDragStart(FieldType.Text, { dataTransfer: createDataTransfer() } as DragEvent)
    dd.onControlDragEnd()

    expect(dd.isDragging.value).toBe(false)
  })
})
