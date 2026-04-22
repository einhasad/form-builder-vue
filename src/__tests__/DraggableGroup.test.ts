import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DraggableGroup, { type DragItem } from '../components/DraggableGroup.vue'

const mockItems: DragItem[] = [
  { id: 'item-1', name: 'First Item' },
  { id: 'item-2', name: 'Second Item' },
  { id: 'item-3', name: 'Third Item' },
]

function createMockDataTransfer(): DataTransfer {
  const store: Record<string, string> = {}
  return {
    dropEffect: 'none',
    effectAllowed: 'uninitialized',
    setData(format: string, data: string) { store[format] = data },
    getData(format: string) { return store[format] ?? '' },
    clearData() { Object.keys(store).forEach(key => { store[key] = '' }) },
    setDragImage: () => { /* no-op mock */ },
    types: [] as string[],
    files: {} as FileList,
    items: {} as DataTransferItemList,
  } as DataTransfer
}

describe('DraggableGroup', () => {
  describe('Rendering', () => {
    it('renders group header with name', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      expect(wrapper.find('.draggable-group-name').text()).toBe('Test Group')
    })

    it('renders all items from props', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const renderedItems = wrapper.findAll('.draggable-item')
      expect(renderedItems).toHaveLength(3)

      expect(renderedItems[0].find('.draggable-item-name').text()).toBe('First Item')
      expect(renderedItems[1].find('.draggable-item-name').text()).toBe('Second Item')
      expect(renderedItems[2].find('.draggable-item-name').text()).toBe('Third Item')
    })

    it('shows item count', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      expect(wrapper.find('.draggable-group-count').text()).toBe('3 items')
    })

    it('shows correct item count for empty list', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: [],
          groupId: 'group-1',
          groupName: 'Empty Group',
        },
      })

      expect(wrapper.find('.draggable-group-count').text()).toBe('0 items')
    })

    it('renders item with correct id attribute', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const renderedItems = wrapper.findAll('.draggable-item')
      expect(renderedItems[0].find('.draggable-item-id').text()).toBe('item-1')
      expect(renderedItems[1].find('.draggable-item-id').text()).toBe('item-2')
    })
  })

  describe('Drag Events', () => {
    it('emits drag-start when item drag starts with correct payload', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      const emitted = wrapper.emitted('drag-start')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0]?.[0]).toEqual(
        expect.objectContaining({
          item: mockItems[0],
          groupId: 'group-1',
        }),
      )
    })

    it('emits drag-end when item drag ends', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')

      // Start drag first
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // End drag
      await firstItem.trigger('dragend')

      expect(wrapper.emitted('drag-end')).toHaveLength(1)
    })

    it('applies dragging class to dragged item', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      const firstItem = items[0]
      const secondItem = items[1]

      // Start drag on first item
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      expect(firstItem.classes()).toContain('dragging')
      expect(secondItem.classes()).not.toContain('dragging')
    })

    it('removes dragging class after drag ends', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')

      // Start and end drag
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })
      await firstItem.trigger('dragend')

      expect(firstItem.classes()).not.toContain('dragging')
    })
  })

  describe('Drop Events', () => {
    it('emits item-drop when dropping on another item', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      const firstItem = items[0]
      const secondItem = items[1]

      // Start drag on first item
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drag over second item
      await secondItem.trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drop on second item
      await secondItem.trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
        stopPropagation: () => { /* no-op for test */ },
      })

      const emitted = wrapper.emitted('item-drop')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0]?.[0]).toEqual(
        expect.objectContaining({
          draggedItem: mockItems[0],
          targetItem: mockItems[1],
          groupId: 'group-1',
        }),
      )
    })

    it('emits group-drop when dropping on group container', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')
      const groupContainer = wrapper.find('.draggable-group')

      // Start drag on first item
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drop on group container (not on an item)
      await groupContainer.trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
      })

      const emitted = wrapper.emitted('group-drop')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0]?.[0]).toEqual(
        expect.objectContaining({
          draggedItem: mockItems[0],
          groupId: 'group-1',
        }),
      )
    })

    it('prevents default on dragover by allowing drop behavior', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      const secondItem = items[1]

      // Start drag on first item to enable drag state
      await items[0].trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Trigger dragover - the component calls preventDefault() internally
      // which allows the drop. We verify this by checking the drag-over class is applied.
      await secondItem.trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      // If preventDefault was called, the drag-over class should be applied
      expect(secondItem.classes()).toContain('drag-over')
    })

    it('does not emit item-drop when dropping on same item', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')

      // Start drag on first item
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drop on same item
      await firstItem.trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
        stopPropagation: () => { /* no-op for test */ },
      })

      expect(wrapper.emitted('item-drop')).toBeUndefined()
    })
  })

  describe('Slot Scoped Props', () => {
    it('provides item data via scoped slot', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
        slots: {
          item: `<template #item="slotProps">
            <span class="custom-item">{{ slotProps.item.name }}</span>
          </template>`,
        },
      })

      const customItems = wrapper.findAll('.custom-item')
      expect(customItems).toHaveLength(3)
      expect(customItems[0].text()).toBe('First Item')
      expect(customItems[1].text()).toBe('Second Item')
    })

    it('provides index via scoped slot', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
        slots: {
          item: `<template #item="slotProps">
            <span class="custom-index">{{ slotProps.index }}</span>
          </template>`,
        },
      })

      const customIndices = wrapper.findAll('.custom-index')
      expect(customIndices[0].text()).toBe('0')
      expect(customIndices[1].text()).toBe('1')
      expect(customIndices[2].text()).toBe('2')
    })

    it('provides is-dragging state via scoped slot', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
        slots: {
          item: `<template #item="slotProps">
            <span class="drag-state">{{ slotProps.isDragging }}</span>
          </template>`,
        },
      })

      const dragStates = wrapper.findAll('.drag-state')
      expect(dragStates[0].text()).toBe('false')

      // Start drag on first item
      await wrapper.find('.draggable-item').trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      await flushPromises()

      // After drag starts, the first item should show isDragging as true
      expect(wrapper.findAll('.drag-state')[0].text()).toBe('true')
      expect(wrapper.findAll('.drag-state')[1].text()).toBe('false')
    })

    it('provides is-drag-over state via scoped slot', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
        slots: {
          item: `<template #item="slotProps">
            <span class="drag-over-state">{{ slotProps.isDragOver }}</span>
          </template>`,
        },
      })

      const items = wrapper.findAll('.draggable-item')

      // Start drag on first item
      await items[0].trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drag over second item
      await items[1].trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      await flushPromises()

      const dragOverStates = wrapper.findAll('.drag-over-state')
      expect(dragOverStates[1].text()).toBe('true')
      expect(dragOverStates[0].text()).toBe('false')
    })

    it('provides header slot with group data', () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
        slots: {
          header: `<template #header="slotProps">
            <span class="custom-header">{{ slotProps.groupId }} - {{ slotProps.groupName }} - {{ slotProps.itemCount }}</span>
          </template>`,
        },
      })

      expect(wrapper.find('.custom-header').text()).toBe('group-1 - Test Group - 3')
    })
  })

  describe('Visual States', () => {
    it('applies drag-over class to group when dragging over empty area', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')
      const groupContainer = wrapper.find('.draggable-group')

      // Start drag on first item
      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drag over group container (not on an item)
      await groupContainer.trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      expect(groupContainer.classes()).toContain('drag-over')
    })

    it('applies drag-over class to item when dragging over it', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')

      // Start drag on first item
      await items[0].trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drag over second item
      await items[1].trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      expect(items[1].classes()).toContain('drag-over')
    })
  })

  describe('Drop on group edge cases', () => {
    it('does not emit group-drop when no item is being dragged', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const groupContainer = wrapper.find('.draggable-group')
      await groupContainer.trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
      })

      expect(wrapper.emitted('group-drop')).toBeFalsy()
    })

    it('does not emit item-drop when dropping on same item with no drag', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      await items[0].trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
        stopPropagation: () => { /* no-op for test */ },
      })

      expect(wrapper.emitted('item-drop')).toBeFalsy()
    })
  })

  describe('Drag leave', () => {
    it('removes drag-over class on drag leave', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      await items[0].trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })
      await items[1].trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      expect(items[1].classes()).toContain('drag-over')

      await items[1].trigger('dragleave', {
        relatedTarget: null,
        currentTarget: items[1].element,
      })

      expect(items[1].classes()).not.toContain('drag-over')
    })

    it('removes group drag-over on drag leave', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const firstItem = wrapper.find('.draggable-item')
      const groupContainer = wrapper.find('.draggable-group')

      await firstItem.trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })
      await groupContainer.trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      expect(groupContainer.classes()).toContain('drag-over')

      await groupContainer.trigger('dragleave', {
        relatedTarget: null,
        currentTarget: groupContainer.element,
      })

      expect(groupContainer.classes()).not.toContain('drag-over')
    })
  })

  describe('Group drop with item drag over active', () => {
    it('does not emit group-drop when dragOverItemId is set', async () => {
      const wrapper = mount(DraggableGroup, {
        props: {
          items: mockItems,
          groupId: 'group-1',
          groupName: 'Test Group',
        },
      })

      const items = wrapper.findAll('.draggable-item')
      const groupContainer = wrapper.find('.draggable-group')

      // Start drag on first item
      await items[0].trigger('dragstart', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drag over second item (sets dragOverItemId)
      await items[1].trigger('dragover', {
        dataTransfer: createMockDataTransfer(),
      })

      // Drop on group container while item has dragOverItemId
      await groupContainer.trigger('drop', {
        preventDefault: () => { /* no-op for test */ },
      })

      // Should not emit group-drop because dragOverItemId is set
      expect(wrapper.emitted('group-drop')).toBeFalsy()
    })
  })
})
