<script setup lang="ts">
import { ref, computed } from "vue"

export interface DragItem {
  id: string
  name: string
  [key: string]: unknown
}

/** Items to display in the group. */
const props = defineProps<{
  /** Items to display in the group. */
  items: DragItem[]
  /** Unique identifier for the group. */
  groupId: string
  /** Display name for the group header. */
  groupName: string
}>()

const emit = defineEmits<{
  (e: "drag-start", payload: { item: DragItem; groupId: string }): void
  (e: "drag-end"): void
  (e: "item-drop", payload: { draggedItem: DragItem; targetItem: DragItem; groupId: string }): void
  (e: "group-drop", payload: { draggedItem: DragItem; groupId: string }): void
}>()

defineSlots<{
  header(props: { groupId: string; groupName: string; itemCount: number }): void
  item(props: { item: DragItem; index: number; isDragging: boolean; isDragOver: boolean }): void
}>()

const draggedItem = ref<DragItem | null>(null)
const dragOverItemId = ref<string | null>(null)
const isGroupDragOver = ref(false)

const draggedItemId = computed((): string | undefined => draggedItem.value?.id)

function onItemDragStart(item: DragItem, event: DragEvent): void {
  draggedItem.value = item
  ;(event.target as HTMLElement).classList.add("dragging")

  emit("drag-start", { item, groupId: props.groupId })

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", item.id)
  }
}

function onItemDragEnd(event: DragEvent): void {
  ;(event.target as HTMLElement).classList.remove("dragging")
  draggedItem.value = null
  dragOverItemId.value = null
  isGroupDragOver.value = false

  emit("drag-end")
}

function onItemDragOver(item: DragItem, event: DragEvent): void {
  event.preventDefault()
  dragOverItemId.value = item.id
  isGroupDragOver.value = false

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move"
  }
}

function onItemDragLeave(): void {
  dragOverItemId.value = null
}

function onItemDrop(targetItem: DragItem, event: DragEvent): void {
  event.preventDefault()
  event.stopPropagation()

  if (!draggedItem.value || draggedItem.value.id === targetItem.id) {
    return
  }

  emit("item-drop", {
    draggedItem: draggedItem.value,
    targetItem,
    groupId: props.groupId,
  })

  dragOverItemId.value = null
}

function onGroupDragOver(event: DragEvent): void {
  if (dragOverItemId.value) {
    return
  }

  event.preventDefault()
  isGroupDragOver.value = true

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move"
  }
}

function onGroupDragLeave(event: DragEvent): void {
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement

  if (!currentTarget.contains(relatedTarget)) {
    isGroupDragOver.value = false
  }
}

function onGroupDrop(event: DragEvent): void {
  event.preventDefault()

  if (!draggedItem.value) {
    return
  }

  if (dragOverItemId.value) {
    return
  }

  emit("group-drop", {
    draggedItem: draggedItem.value,
    groupId: props.groupId,
  })

  isGroupDragOver.value = false
}
</script>

<template>
  <div
    class="draggable-group"
    :class="{
      'drag-over': isGroupDragOver,
    }"
    @dragover="onGroupDragOver"
    @dragleave="onGroupDragLeave"
    @drop="onGroupDrop"
  >
    <div class="draggable-group-header">
      <slot
        name="header"
        :group-id="groupId"
        :group-name="groupName"
        :item-count="items.length"
      >
        <span class="draggable-group-name">{{ groupName }}</span>
        <!-- eslint-disable-next-line vue/no-bare-strings-in-template -->
        <span class="draggable-group-count">{{ items.length }} items</span>
      </slot>
    </div>

    <div class="draggable-group-items">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="draggable-item"
        :class="{
          dragging: draggedItemId === item.id,
          'drag-over': dragOverItemId === item.id,
        }"
        draggable="true"
        @dragstart="onItemDragStart(item, $event)"
        @dragend="onItemDragEnd"
        @dragover="onItemDragOver(item, $event)"
        @dragleave="onItemDragLeave"
        @drop="onItemDrop(item, $event)"
      >
        <slot
          name="item"
          :item="item"
          :index="index"
          :is-dragging="draggedItemId === item.id"
          :is-drag-over="dragOverItemId === item.id"
        >
          <span class="draggable-item-drag-handle">=</span>
          <span class="draggable-item-name">{{ item.name }}</span>
          <span class="draggable-item-id">{{ item.id }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draggable-group {
  flex: 1;
  min-width: 250px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.draggable-group.drag-over {
  border-color: #1890ff;
  background: #e6f7ff;
}

.draggable-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
  font-weight: 600;
}

.draggable-group-name {
  color: #333;
}

.draggable-group-count {
  color: #999;
  font-size: 12px;
  font-weight: normal;
}

.draggable-group-items {
  min-height: 100px;
}

.draggable-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.draggable-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.draggable-item:active {
  cursor: grabbing;
}

.draggable-item.dragging {
  opacity: 0.5;
  border: 2px dashed #1890ff;
}

.draggable-item.drag-over {
  border-color: #52c41a;
  background: #f6ffed;
}

.draggable-item-drag-handle {
  color: #999;
  font-size: 16px;
  cursor: grab;
}

.draggable-item-name {
  flex: 1;
  color: #333;
}

.draggable-item-id {
  color: #999;
  font-size: 11px;
  font-family: monospace;
}
</style>
