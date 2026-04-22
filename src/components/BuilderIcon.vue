<script setup lang="ts">
import { computed } from 'vue'

/** Field-type identifier used to look up the SVG. */
const props = withDefaults(defineProps<{
  /** Field-type identifier used to look up the SVG. */
  type: string
  /** Rendered width/height in pixels. Defaults to 14. */
  size?: number
}>(), {
  size: 14,
})

interface IconDef {
  /** Array of SVG path `d` strings (each renders as a separate `<path>`). */
  paths?: string[]
  /** Rect primitives (`<rect>`). */
  rects?: { x: number; y: number; w: number; h: number; rx?: number }[]
  /** Circle primitives (`<circle>`). `fill` set to `currentColor` renders a filled dot. */
  circles?: { cx: number; cy: number; r: number; fill?: boolean }[]
}

const ICONS: Record<string, IconDef> = {
  text: {
    paths: ['M4 6V5h12v1', 'M10 5v10', 'M8 15h4'],
  },
  number: {
    paths: ['M7 4L5.5 16', 'M14.5 4L13 16', 'M4 8h13', 'M3 12h13'],
  },
  date: {
    paths: ['M7 3v3', 'M13 3v3', 'M3 9h14'],
    rects: [{ x: 3, y: 5, w: 14, h: 12, rx: 1.5 }],
  },
  select: {
    paths: ['M8 9l2 2 2-2'],
    rects: [{ x: 3, y: 5, w: 14, h: 10, rx: 1.5 }],
  },
  'checkbox-group': {
    paths: ['M4.5 6l1.2 1.2L7.5 5.2', 'M11 5h6', 'M11 14h6'],
    rects: [
      { x: 3, y: 3, w: 6, h: 6, rx: 1 },
      { x: 3, y: 11, w: 6, h: 6, rx: 1 },
    ],
  },
  'radio-group': {
    paths: ['M11 5h6', 'M11 14h6'],
    circles: [
      { cx: 6, cy: 6, r: 3 },
      { cx: 6, cy: 6, r: 1.2, fill: true },
      { cx: 6, cy: 14, r: 3 },
    ],
  },
  checkbox: {
    paths: ['M6.5 10l2.5 2.5 5-5'],
    rects: [{ x: 4, y: 4, w: 12, h: 12, rx: 1.5 }],
  },
  textarea: {
    paths: ['M6 8h8', 'M6 11h8', 'M6 14h4'],
    rects: [{ x: 3, y: 4, w: 14, h: 12, rx: 1.5 }],
  },
  file: {
    paths: [
      'M6 3h5l4 4v9a1.5 1.5 0 01-1.5 1.5h-7.5A1.5 1.5 0 014.5 16V4.5A1.5 1.5 0 016 3z',
      'M11 3v4h4',
    ],
  },
  autocomplete: {
    paths: ['M13 13l3 3', 'M7 9h4'],
    circles: [{ cx: 9, cy: 9, r: 5 }],
  },
  button: {
    paths: ['M7 10h6'],
    rects: [{ x: 3, y: 6, w: 14, h: 8, rx: 2 }],
  },
  header: {
    paths: ['M5 4v12', 'M12 4v12', 'M5 10h7', 'M15 7l1.5-1v10'],
  },
  paragraph: {
    paths: ['M4 5h12', 'M4 9h12', 'M4 13h12', 'M4 17h8'],
  },
  hidden: {
    paths: [
      'M3 10s2.5-5 7-5c1.5 0 2.8.5 3.9 1.2',
      'M17 10s-2.5 5-7 5c-1.5 0-2.8-.5-3.9-1.2',
      'M3 3l14 14',
    ],
    circles: [{ cx: 10, cy: 10, r: 2 }],
  },
}

const icon = computed<IconDef | null>(() => ICONS[props.type] ?? null)
</script>

<template>
  <svg
    v-if="icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    data-qa="builder-icon"
  >
    <rect
      v-for="(r, i) in icon.rects"
      :key="`r-${i}`"
      :x="r.x"
      :y="r.y"
      :width="r.w"
      :height="r.h"
      :rx="r.rx"
    />
    <path
      v-for="(d, i) in icon.paths"
      :key="`p-${i}`"
      :d="d"
    />
    <circle
      v-for="(c, i) in icon.circles"
      :key="`c-${i}`"
      :cx="c.cx"
      :cy="c.cy"
      :r="c.r"
      :fill="c.fill ? 'currentColor' : 'none'"
      :stroke="c.fill ? 'none' : 'currentColor'"
    />
  </svg>
</template>
