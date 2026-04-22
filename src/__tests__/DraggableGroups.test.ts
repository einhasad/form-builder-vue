import { describe, it, expect, vi } from 'vitest'
import { h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import DraggableGroups, { type DragItem, type DragGroup } from '../components/DraggbleGroups.vue'

interface TestItem extends DragItem {
  id: string
  name: string
  groupId: string
}

interface TestGroup extends DragGroup<TestItem> {
  id: string
  name: string
  items: TestItem[]
}

function createTestData(): TestGroup[] {
  return [
    {
      id: 'group-1',
      name: 'To Do',
      items: [
        { id: 'item-1', name: 'Task Alpha', groupId: 'group-1' },
        { id: 'item-2', name: 'Task Beta', groupId: 'group-1' },
      ],
    },
    {
      id: 'group-2',
      name: 'Done',
      items: [{ id: 'item-3', name: 'Task Gamma', groupId: 'group-2' }],
    },
  ]
}

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

describe('DraggableGroups', () => {
  describe('rendering', () => {
    it('renders all groups and items', () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      expect(wrapper.findAll('.group')).toHaveLength(2)
      expect(wrapper.findAll('.item')).toHaveLength(3)
      expect(wrapper.text()).toContain('Task Alpha')
    })

    it('renders using custom slots', () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          'group-header': (props: { group: TestGroup }) =>
            h('div', { class: 'custom-header' }, props.group.name),
          item: (props: { item: TestItem }) =>
            h('span', { class: 'custom-item' }, props.item.name),
        },
      })

      expect(wrapper.findAll('.custom-header')).toHaveLength(2)
      expect(wrapper.findAll('.custom-item')).toHaveLength(3)
      expect(wrapper.find('.custom-header').text()).toBe('To Do')
    })

    it('shows empty state when no groups', () => {
      const wrapper = mount(DraggableGroups, {
        props: { groups: [] },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      expect(wrapper.findAll('.group')).toHaveLength(0)
      expect(wrapper.findAll('.item')).toHaveLength(0)
    })
  })

  describe('drag events', () => {
    it('emits drag-start when item drag starts', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const item = wrapper.find('.item')
      const dataTransfer = createDataTransfer()

      await item.trigger('dragstart', { dataTransfer })

      expect(wrapper.emitted('drag-start')).toBeTruthy()
      const emitted = wrapper.emitted('drag-start')
      const payload = emitted?.[0]?.[0] as { item: TestItem; groupId: string }
      expect(payload.item.id).toBe('item-1')
      expect(payload.groupId).toBe('group-1')
    })

    it('emits drag-end when item drag ends', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const item = wrapper.find('.item')
      const dataTransfer = createDataTransfer()

      await item.trigger('dragstart', { dataTransfer })
      await item.trigger('dragend', { dataTransfer })

      expect(wrapper.emitted('drag-end')).toBeTruthy()
    })

    it('emits item-drop when item is dropped on another item', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      // Start dragging first item
      await items[0].trigger('dragstart', { dataTransfer })

      // Drop on second item
      await items[1].trigger('dragover', { dataTransfer })
      await items[1].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      })

      await flushPromises()

      expect(wrapper.emitted('item-drop')).toBeTruthy()
      const emitted = wrapper.emitted('item-drop')
      const payload = emitted?.[0]?.[0] as {
        item: TestItem
        targetItem: TestItem
        targetGroupId: string
      }
      expect(payload.item.id).toBe('item-1')
      expect(payload.targetItem.id).toBe('item-2')
    })

    it('emits group-drop when item is dropped on group', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      // Start dragging item from group-1
      await items[0].trigger('dragstart', { dataTransfer })

      // Drop on group-2
      await groupsEl[1].trigger('dragover', { dataTransfer })
      await groupsEl[1].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
      })

      await flushPromises()

      expect(wrapper.emitted('group-drop')).toBeTruthy()
      const emitted = wrapper.emitted('group-drop')
      const payload = emitted?.[0]?.[0] as {
        item: TestItem
        targetGroupId: string
      }
      expect(payload.item.id).toBe('item-1')
      expect(payload.targetGroupId).toBe('group-2')
    })

    it('emits change event with updated groups', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      // Drag item from group-1 to group-2
      await items[0].trigger('dragstart', { dataTransfer })
      await groupsEl[1].trigger('dragover', { dataTransfer })
      await groupsEl[1].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
      })

      await flushPromises()

      expect(wrapper.emitted('change')).toBeTruthy()
      const emitted = wrapper.emitted('change')
      const payload = emitted?.[0]?.[0] as {
        groups: TestGroup[]
      }
      expect(payload.groups[0].items).toHaveLength(1)
      expect(payload.groups[1].items).toHaveLength(2)
    })
  })

  describe('event payloads', () => {
    it('drag-start payload includes correct structure', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const item = wrapper.find('.item')
      const dataTransfer = createDataTransfer()

      await item.trigger('dragstart', { dataTransfer })

      const emitted = wrapper.emitted('drag-start')
      const payload = emitted?.[0]?.[0] as {
        item: TestItem
        groupId: string
        event: DragEvent
      }

      expect(payload).toHaveProperty('item')
      expect(payload).toHaveProperty('groupId')
      expect(payload).toHaveProperty('event')
      expect(payload.item.id).toBe('item-1')
      expect(payload.groupId).toBe('group-1')
    })

    it('item-drop payload includes correct structure', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await items[1].trigger('dragover', { dataTransfer })
      await items[1].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      })

      await flushPromises()

      const emitted = wrapper.emitted('item-drop')
      const payload = emitted?.[0]?.[0] as {
        item: TestItem
        targetItem: TestItem
        targetGroupId: string
      }

      expect(payload).toHaveProperty('item')
      expect(payload).toHaveProperty('targetItem')
      expect(payload).toHaveProperty('targetGroupId')
    })

    it('group-drop payload includes correct structure', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await groupsEl[1].trigger('dragover', { dataTransfer })
      await groupsEl[1].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
      })

      await flushPromises()

      const emitted = wrapper.emitted('group-drop')
      const payload = emitted?.[0]?.[0] as {
        item: TestItem
        targetGroupId: string
      }

      expect(payload).toHaveProperty('item')
      expect(payload).toHaveProperty('targetGroupId')
      expect(payload.item.id).toBe('item-1')
      expect(payload.targetGroupId).toBe('group-2')
    })
  })

  describe('props', () => {
    it('uses custom itemKey prop correctly', () => {
      interface CustomItem extends DragItem {
        customId: string
        name: string
        groupId: string
        id: string
      }

      interface CustomGroup extends DragGroup<CustomItem> {
        id: string
        items: CustomItem[]
      }

      const customGroups: CustomGroup[] = [
        {
          id: 'g1',
          items: [
            { customId: 'c1', id: 'c1', name: 'Item 1', groupId: 'g1' },
          ],
        },
      ]

      const wrapper = mount(DraggableGroups, {
        props: {
          groups: customGroups,
          itemKey: 'customId',
        },
        slots: {
          item: (props: { item: CustomItem }) => h('span', props.item.name),
        },
      })

      const item = wrapper.find('.item')
      expect(item.attributes('draggable')).toBe('true')
    })
  })

  describe('visual state', () => {
    it('adds dragging class when item is being dragged', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const item = wrapper.find('.item')
      const dataTransfer = createDataTransfer()

      await item.trigger('dragstart', { dataTransfer })

      expect(item.classes()).toContain('dragging')
    })

    it('adds drag-over class when dragging over an item', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await items[1].trigger('dragover', { dataTransfer })

      expect(items[1].classes()).toContain('drag-over')
    })

    it('adds drag-over class to group when dragging over it', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await groupsEl[1].trigger('dragover', { dataTransfer })

      expect(groupsEl[1].classes()).toContain('drag-over')
    })
  })

  describe('Drag leave edge cases', () => {
    it('removes drag-over class on group drag leave', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await groupsEl[1].trigger('dragover', { dataTransfer })
      expect(groupsEl[1].classes()).toContain('drag-over')

      await groupsEl[1].trigger('dragleave', {
        relatedTarget: null,
        currentTarget: groupsEl[1].element,
      })
      expect(groupsEl[1].classes()).not.toContain('drag-over')
    })
  })

  describe('Drop edge cases', () => {
    it('does not emit group-drop when no item dragged', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const groupsEl = wrapper.findAll('.group')
      await groupsEl[1].trigger('drop', {
        dataTransfer: createDataTransfer(),
        preventDefault: () => { /* no-op for test */ },
      })

      await flushPromises()
      expect(wrapper.emitted('group-drop')).toBeFalsy()
    })

    it('does not emit group-drop when dropping on same group', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const groupsEl = wrapper.findAll('.group')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await groupsEl[0].trigger('drop', {
        dataTransfer,
        preventDefault: () => { /* no-op for test */ },
      })

      await flushPromises()
      expect(wrapper.emitted('group-drop')).toBeFalsy()
    })

    it('does not emit item-drop when no item dragged', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      await items[1].trigger('drop', {
        dataTransfer: createDataTransfer(),
        preventDefault: () => { /* no-op for test */ },
        stopPropagation: () => { /* no-op for test */ },
      })

      await flushPromises()
      expect(wrapper.emitted('item-drop')).toBeFalsy()
    })
  })

  describe('Item drag leave', () => {
    it('removes drag-over class on item drag leave', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      await items[0].trigger('dragstart', { dataTransfer })
      await items[1].trigger('dragover', { dataTransfer })
      expect(items[1].classes()).toContain('drag-over')

      await items[1].trigger('dragleave')
      expect(items[1].classes()).not.toContain('drag-over')
    })
  })

  describe('OtherGroups item events', () => {
    it('triggers drag events on otherGroups items', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      // items[2] is in otherGroups (group-2)
      // Trigger dragstart on otherGroups item
      await items[2].trigger('dragstart', { dataTransfer })
      expect(wrapper.emitted('drag-start')).toBeTruthy()
      const dragStartEvents = wrapper.emitted('drag-start')
      const payload = dragStartEvents?.[0]?.[0] as { item: TestItem; groupId: string }
      expect(payload.item.id).toBe('item-3')
      expect(payload.groupId).toBe('group-2')

      // Trigger dragover on otherGroups item
      await items[2].trigger('dragover', { dataTransfer })
      expect(items[2].classes()).toContain('drag-over')

      // Trigger dragend on otherGroups item
      await items[2].trigger('dragend', { dataTransfer })
      expect(wrapper.emitted('drag-end')).toBeTruthy()
    })

    it('drops on otherGroups item', async () => {
      const groups = createTestData()

      const wrapper = mount(DraggableGroups, {
        props: { groups },
        slots: {
          item: (props: { item: TestItem }) => h('span', props.item.name),
        },
      })

      const items = wrapper.findAll('.item')
      const dataTransfer = createDataTransfer()

      // Start drag on firstGroup item
      await items[0].trigger('dragstart', { dataTransfer })

      // Drop on otherGroups item (items[2])
      await items[2].trigger('dragover', { dataTransfer })
      await items[2].trigger('drop', {
        dataTransfer,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      })

      await flushPromises()

      expect(wrapper.emitted('item-drop')).toBeTruthy()
      const dropEvents = wrapper.emitted('item-drop')
      const payload = dropEvents?.[0]?.[0] as {
        item: TestItem
        targetItem: TestItem
        targetGroupId: string
      }
      expect(payload.item.id).toBe('item-1')
      expect(payload.targetItem.id).toBe('item-3')
      expect(payload.targetGroupId).toBe('group-2')
    })
  })
})
