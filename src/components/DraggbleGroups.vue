<script setup lang="ts" generic="T extends DragItem, G extends DragGroup<T>">
import { ref, computed } from "vue"

// Types
export interface DragItem {
  id: string
  groupId: string
}

export interface DragGroup<T extends DragItem = DragItem> {
  id: string
  items: T[]
}

export interface ItemSlotProps<T extends DragItem> {
  item: T
  group: DragGroup<T>
  index: number
}

export interface GroupHeaderSlotProps<T extends DragItem> {
  group: DragGroup<T>
  index: number
}

// Props
const props = withDefaults(
  defineProps<{
    /** Array of drag groups to render. */
    groups: G[]
    /** Property name to use as the key for items. */
    itemKey?: string
  }>(),
  {
    itemKey: "id",
  },
)

// Slots
defineSlots<{
  item(props: ItemSlotProps<T>): void
  "group-header"(props: GroupHeaderSlotProps<T>): void
}>()

// Emits
const emit = defineEmits<{
  "drag-start": [payload: { item: T; groupId: string; event: DragEvent }]
  "drag-end": [payload: { event: DragEvent }]
  "item-drop": [payload: { item: T; targetItem: T; targetGroupId: string }]
  "group-drop": [payload: { item: T; targetGroupId: string }]
  change: [payload: { groups: G[] }]
}>()

// Drag state
const draggedItem = ref<T | null>(null)
const draggedFromGroup = ref<string | null>(null)
const dragOverGroupId = ref<string | null>(null)
const dragOverItemId = ref<string | null>(null)

// Computed
const draggedItemId = computed((): string | undefined => draggedItem.value?.id)
const firstGroup = computed((): G | undefined => props.groups[0])
const otherGroups = computed((): G[] => props.groups.slice(1))

// Item Events
function onItemDragStart(item: T, groupId: string, event: DragEvent): void {
  draggedItem.value = item
  draggedFromGroup.value = groupId
  ;(event.target as HTMLElement).classList.add("dragging")

  emit("drag-start", { item, groupId, event })

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", item.id)
  }
}

function onItemDragEnd(event: DragEvent): void {
  ;(event.target as HTMLElement).classList.remove("dragging")
  emit("drag-end", { event })
  draggedItem.value = null
  draggedFromGroup.value = null
  dragOverItemId.value = null
}

function onItemDragOver(item: T, event: DragEvent): void {
  event.preventDefault()
  dragOverItemId.value = item.id

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move"
  }
}

function onItemDragLeave(): void {
  dragOverItemId.value = null
}

function onItemDrop(targetItem: T, targetGroupId: string, event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()

  if (!draggedItem.value || draggedItem.value.id === targetItem.id) {
    return
  }

  const fromGroupId = draggedFromGroup.value

  emit("item-drop", {
    item: draggedItem.value,
    targetItem,
    targetGroupId,
  })

  // Remove from source
  const sourceGroup = props.groups.find((g) => g.id === fromGroupId)
  if (sourceGroup) {
    const sourceIndex = sourceGroup.items.findIndex(
      (i) => i.id === draggedItem.value?.id,
    )
    if (sourceIndex > -1) {
      sourceGroup.items.splice(sourceIndex, 1)
    }
  }

  // Add to target at position
  const targetGroup = props.groups.find((g) => g.id === targetGroupId)
  if (targetGroup) {
    const targetIndex = targetGroup.items.findIndex(
      (i) => i.id === targetItem.id,
    )
    draggedItem.value.groupId = targetGroupId
    targetGroup.items.splice(targetIndex, 0, draggedItem.value)
  }

  dragOverItemId.value = null
  emit("change", { groups: props.groups })
}

// Group Events
function onGroupDragOver(groupId: string, event: DragEvent): void {
  event.preventDefault()
  dragOverGroupId.value = groupId

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move"
  }
}

function onGroupDragLeave(groupId: string, event: DragEvent): void {
  void groupId
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement

  if (!currentTarget.contains(relatedTarget)) {
    dragOverGroupId.value = null
  }
}

function onGroupDrop(groupId: string, event: DragEvent): void {
  event.preventDefault()

  if (!draggedItem.value) {
    return
  }

  const fromGroupId = draggedFromGroup.value
  if (fromGroupId === groupId) {
    dragOverGroupId.value = null
    return
  }

  emit("group-drop", {
    item: draggedItem.value,
    targetGroupId: groupId,
  })

  // Remove from source
  const sourceGroup = props.groups.find((g) => g.id === fromGroupId)
  if (sourceGroup) {
    const sourceIndex = sourceGroup.items.findIndex(
      (i) => i.id === draggedItem.value?.id,
    )
    if (sourceIndex > -1) {
      sourceGroup.items.splice(sourceIndex, 1)
    }
  }

  // Add to target group at end
  const targetGroup = props.groups.find((g) => g.id === groupId)
  if (targetGroup) {
    draggedItem.value.groupId = groupId
    targetGroup.items.push(draggedItem.value)
  }

  dragOverGroupId.value = null
  emit("change", { groups: props.groups })
}
</script>

<template>
  <div class="draggable-groups">
    <div class="groups-container">
      <div class="column">
        <div
          v-if="firstGroup"
          class="group"
          :class="{ 'drag-over': dragOverGroupId === firstGroup.id }"
          @dragover="onGroupDragOver(firstGroup.id, $event)"
          @dragleave="onGroupDragLeave(firstGroup.id, $event)"
          @drop="onGroupDrop(firstGroup.id, $event)"
        >
          <slot
            name="group-header"
            :group="firstGroup"
            :index="0"
          >
            <div class="group-header">
              <span class="group-name">{{ firstGroup.id }}</span>
              <!-- eslint-disable-next-line vue/no-bare-strings-in-template -->
              <span class="group-count">{{ firstGroup.items.length }} items</span>
            </div>
          </slot>
          <div class="group-items">
            <div
              v-for="(item, itemIndex) in firstGroup.items"
              :key="String(item[itemKey as keyof T])"
              class="item"
              :class="{
                dragging: draggedItemId === item.id,
                'drag-over': dragOverItemId === item.id,
              }"
              draggable="true"
              @dragstart="onItemDragStart(item, firstGroup.id, $event)"
              @dragend="onItemDragEnd"
              @dragover="onItemDragOver(item, $event)"
              @dragleave="onItemDragLeave"
              @drop="onItemDrop(item, firstGroup.id, $event)"
            >
              <slot
                name="item"
                :item="item"
                :group="firstGroup"
                :index="itemIndex"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="column">
        <div
          v-for="(group, groupIndex) in otherGroups"
          :key="group.id"
          class="group"
          :class="{ 'drag-over': dragOverGroupId === group.id }"
          @dragover="onGroupDragOver(group.id, $event)"
          @dragleave="onGroupDragLeave(group.id, $event)"
          @drop="onGroupDrop(group.id, $event)"
        >
          <slot
            name="group-header"
            :group="group"
            :index="groupIndex + 1"
          >
            <div class="group-header">
              <span class="group-name">{{ group.id }}</span>
              <!-- eslint-disable-next-line vue/no-bare-strings-in-template -->
              <span class="group-count">{{ group.items.length }} items</span>
            </div>
          </slot>
          <div class="group-items">
            <div
              v-for="(item, itemIndex) in group.items"
              :key="String(item[itemKey as keyof T])"
              class="item"
              :class="{
                dragging: draggedItemId === item.id,
                'drag-over': dragOverItemId === item.id,
              }"
              draggable="true"
              @dragstart="onItemDragStart(item, group.id, $event)"
              @dragend="onItemDragEnd"
              @dragover="onItemDragOver(item, $event)"
              @dragleave="onItemDragLeave"
              @drop="onItemDrop(item, group.id, $event)"
            >
              <slot
                name="item"
                :item="item"
                :group="group"
                :index="itemIndex"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-groups {
  width: 100%;
}

.groups-container {
  display: flex;
  gap: 16px;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group {
  min-width: 250px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.group.drag-over {
  border-color: #1890ff;
  background: #e6f7ff;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
  font-weight: 600;
}

.group-name {
  color: #333;
}

.group-count {
  color: #999;
  font-size: 12px;
  font-weight: normal;
}

.group-items {
  min-height: 100px;
}

.item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.item:active {
  cursor: grabbing;
}

.item.dragging {
  opacity: 0.5;
  border: 2px dashed #1890ff;
}

.item.drag-over {
  border-color: #52c41a;
  background: #f6ffed;
}
</style>
