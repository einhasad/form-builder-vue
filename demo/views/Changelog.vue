<script setup lang="ts">
import { computed } from 'vue'
import changelogRaw from '../../CHANGELOG.md?raw'

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'ul' | 'hr'
  text?: string
  items?: string[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(text: string): string {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
    const safe = url.replace(/"/g, '&quot;')
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })
  return out
}

function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const flushList = (): void => {
    if (list.length > 0) {
      blocks.push({ kind: 'ul', items: list })
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line === '') {
      flushParagraph()
      flushList()
      continue
    }
    if (line.startsWith('# ')) {
      flushParagraph(); flushList()
      blocks.push({ kind: 'h1', text: line.slice(2) })
      continue
    }
    if (line.startsWith('## ')) {
      flushParagraph(); flushList()
      blocks.push({ kind: 'h2', text: line.slice(3) })
      continue
    }
    if (line.startsWith('### ')) {
      flushParagraph(); flushList()
      blocks.push({ kind: 'h3', text: line.slice(4) })
      continue
    }
    if (line.startsWith('#### ')) {
      flushParagraph(); flushList()
      blocks.push({ kind: 'h4', text: line.slice(5) })
      continue
    }
    const listMatch = /^(\s*)-\s+(.+)$/.exec(line)
    if (listMatch) {
      flushParagraph()
      list.push(listMatch[2] ?? '')
      continue
    }
    flushList()
    paragraph.push(line.trim())
  }
  flushParagraph()
  flushList()
  return blocks
}

const blocks = computed(() => parseMarkdown(changelogRaw))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="changelog" data-qa="changelog">
    <template v-for="(block, idx) in blocks" :key="idx">
      <h2 v-if="block.kind === 'h2'" class="cl-release" v-html="renderInline(block.text ?? '')" />
      <h3 v-else-if="block.kind === 'h3'" class="cl-section" v-html="renderInline(block.text ?? '')" />
      <h4 v-else-if="block.kind === 'h4'" class="cl-sub" v-html="renderInline(block.text ?? '')" />
      <p v-else-if="block.kind === 'p'" class="cl-p" v-html="renderInline(block.text ?? '')" />
      <ul v-else-if="block.kind === 'ul'" class="cl-list">
        <li v-for="(item, i) in block.items" :key="i" v-html="renderInline(item)" />
      </ul>
    </template>
  </div>
  <!-- eslint-enable vue/no-v-html -->
</template>

<style scoped>
.changelog {
  line-height: var(--lh-body, 1.6);
  color: var(--ink-2, #3a3a3a);
}

.cl-release {
  margin: 32px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--line, #e8e4db);
  font-size: 20px;
  color: var(--ink, #111);
}

.cl-release:first-child { margin-top: 0; }

.cl-section {
  margin: 18px 0 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3, #6e6a63);
}

.cl-sub {
  margin: 12px 0 6px;
  font-size: 14px;
  color: var(--ink, #111);
}

.cl-p { margin: 8px 0; }

.cl-list {
  margin: 4px 0 12px;
  padding-left: 20px;
}

.cl-list li { margin: 4px 0; }

.cl-list :deep(code),
.cl-p :deep(code) {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12.5px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--surface-sunk, #f3f0e8);
  border: 1px solid var(--line, #e8e4db);
  color: var(--ink, #111);
}

.cl-list :deep(a),
.cl-p :deep(a) {
  color: var(--ink, #111);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
