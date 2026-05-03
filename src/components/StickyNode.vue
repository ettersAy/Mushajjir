<template>
  <article
    class="task-node"
    :class="{
      busy,
      selected: store.selectedNodeId === id,
      dimmed: data.dimmed,
      matched: data.searchMatch,
      collapsed: data.collapsed,
    }"
    :style="nodeStyle"
    @click.stop="store.selectNode(id)"
  >
    <Handle type="target" :position="Position.Top" />

    <header class="node-header">
      <span class="status-dot" :class="`status-${data.taskStatus}`" />
      <input
        class="title nodrag"
        :value="data.title"
        placeholder="Task title"
        @input="update({ title: $event.target.value })"
      />
      <button
        class="icon-button nodrag"
        :title="data.collapsed ? 'Expand' : 'Collapse'"
        @click="store.toggleCollapse(id)"
      >
        {{ data.collapsed ? '+' : '-' }}
      </button>
      <button class="expand-btn nodrag" title="Open in modal" @click="openModal">↔</button>
    </header>

    <textarea
      class="content nodrag"
      :value="data.content"
      placeholder="Describe the task..."
      @input="update({ content: $event.target.value })"
    />

    <div class="status-row">
      <select
        class="status-select nodrag"
        :value="data.taskStatus"
        @change="update({ taskStatus: $event.target.value })"
      >
        <option v-for="status in store.statusOptions" :key="status.id" :value="status.id">
          {{ status.label }}
        </option>
      </select>
      <div class="progress" :title="`${data.progress}% complete`">
        <span :style="{ width: `${data.progress}%` }" />
      </div>
      <strong>{{ data.progress }}%</strong>
    </div>

    <div class="tags">
      <span v-for="tag in data.tags" :key="tag" class="tag" :style="tagStyle(tag)">
        {{ tag }}
        <button class="tag-remove nodrag" @click="store.removeTag(id, tag)">x</button>
      </span>
      <input
        v-model="newTag"
        class="tag-input nodrag"
        placeholder="+ tag"
        @keydown.enter.prevent="commitTag"
        @blur="commitTag"
      />
    </div>

    <section class="notes">
      <button class="notes-toggle nodrag" @click="update({ notesOpen: !data.notesOpen })">Notes</button>
      <div v-if="data.notesOpen" class="notes-body">
        <textarea
          class="notes-input nodrag"
          :value="data.notes"
          placeholder="Markdown notes..."
          @input="update({ notes: $event.target.value })"
        />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="data.notes" class="markdown-preview" v-html="notesHtml" />
      </div>
    </section>

    <div v-if="data.collapsed && data.hiddenDescendantCount" class="hidden-count">
      {{ data.hiddenDescendantCount }} hidden
    </div>

    <p v-if="data.systemMessage" class="system-message">{{ data.systemMessage }}</p>

    <footer class="actions">
      <label class="child-count nodrag" title="Leave empty for AI to decide">
        Children
        <input
          type="number"
          min="1"
          max="12"
          :value="data.childCount"
          :placeholder="data.childCount == null ? 'auto' : ''"
          @input="onChildCountInput"
        />
      </label>
      <button class="nodrag" :disabled="busy" @click="store.quickAddChild(id)">+ Child</button>
      <button class="nodrag" :disabled="busy" @click="store.aiDivide(id)">AI</button>
      <button class="nodrag secondary" :disabled="busy" @click="store.aiReformulate(id)">Refine</button>
      <button class="nodrag secondary" :disabled="busy" @click="store.duplicateNode(id)">Duplicate</button>
      <button v-if="canCompleteRelation" class="nodrag relation" @click="completeRelation">Connect</button>
      <button v-else class="nodrag relation" :class="{ active: isRelationSource }" @click="store.beginRelation(id)">
        {{ isRelationSource ? 'Cancel link' : 'Link' }}
      </button>
      <button v-if="id !== 'root'" class="nodrag danger" :disabled="busy" @click="store.deleteNode(id)">Delete</button>
    </footer>

    <button class="resizer nodrag" title="Resize" @pointerdown.stop.prevent="startResize" />

    <Handle type="source" :position="Position.Bottom" />
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useTreeStore } from '../stores/treeStore.js'
import { clamp, getTagColor } from '../utils/treeUtils.js'
import { renderMarkdown } from '../utils/markdown.js'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
})

const emit = defineEmits(['open-modal'])

const store = useTreeStore()
const newTag = ref('')
const busy = computed(() => store.loadingNodeIds.includes(props.id))
const isRelationSource = computed(() => props.data.relationDraftSourceId === props.id)
const canCompleteRelation = computed(
  () => props.data.relationDraftSourceId && props.data.relationDraftSourceId !== props.id,
)
const notesHtml = computed(() => renderMarkdown(props.data.notes))
const nodeStyle = computed(() => ({
  width: `${props.data.width || 320}px`,
  minHeight: `${props.data.height || 250}px`,
}))

let resizeStart = null

function update(patch) {
  store.updateNodeData(props.id, patch)
}

function tagStyle(tag) {
  const color = getTagColor(tag)
  return {
    '--tag-bg': color.background,
    '--tag-text': color.color,
  }
}

function commitTag() {
  const value = newTag.value.trim()
  if (!value) return
  store.addTag(props.id, value)
  newTag.value = ''
}

function completeRelation() {
  const label = window.prompt('Optional relation label', '') || ''
  store.completeRelation(props.id, label.trim())
}

function onChildCountInput(event) {
  const value = event.target.value
  if (value === '' || value === null) {
    store.updateNodeData(props.id, { childCount: null })
  } else {
    store.updateNodeData(props.id, { childCount: Number(value) })
  }
}

function onResizeMove(event) {
  if (!resizeStart) return

  store.updateNodeSize(props.id, {
    width: clamp(resizeStart.width + event.clientX - resizeStart.x, 280, 560),
    height: clamp(resizeStart.height + event.clientY - resizeStart.y, 230, 760),
  })
}

function stopResize() {
  resizeStart = null
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', stopResize)
}

function startResize(event) {
  resizeStart = {
    x: event.clientX,
    y: event.clientY,
    width: props.data.width || 320,
    height: props.data.height || 260,
  }
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', stopResize)
}

function openModal() {
  emit('open-modal', props.id)
}

onBeforeUnmount(stopResize)
</script>

<style scoped>
.task-node {
  position: relative;
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(120, 116, 104, 0.18);
  border-radius: 8px;
  background: var(--node);
  box-shadow: var(--shadow);
  color: var(--text);
  transition:
    box-shadow 160ms ease,
    opacity 160ms ease,
    transform 160ms ease,
    border-color 160ms ease;
}

.task-node:hover {
  box-shadow: var(--shadow-strong);
}

.task-node.selected {
  border-color: var(--accent);
}

.task-node.matched {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent),
    var(--shadow-strong);
}

.task-node.dimmed {
  opacity: 0.28;
}

.task-node.busy {
  opacity: 0.78;
}

.node-header {
  display: grid;
  grid-template-columns: 10px 1fr 28px 28px;
  align-items: center;
  gap: 6px;
}

.expand-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
  opacity: 0.45;
  transition:
    opacity 140ms ease,
    background 140ms ease;
}

.expand-btn:hover {
  opacity: 1;
  background: var(--field);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--muted);
}

.status-todo {
  background: #9ca3af;
}
.status-in-progress {
  background: #2563eb;
}
.status-blocked {
  background: #dc2626;
}
.status-done {
  background: #16a34a;
}

.title,
.content,
.notes-input,
.tag-input,
.status-select,
.child-count input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
}

.title {
  min-width: 0;
  font-size: 16px;
  font-weight: 760;
}

.content {
  min-height: 68px;
  resize: vertical;
  color: var(--muted-strong);
  line-height: 1.42;
}

.icon-button,
.notes-toggle,
button {
  border: 0;
  border-radius: 7px;
  background: var(--button);
  color: var(--button-text);
  cursor: pointer;
  font-weight: 720;
}

.icon-button {
  width: 28px;
  height: 28px;
}

.status-row {
  display: grid;
  grid-template-columns: minmax(112px, 0.8fr) 1fr 38px;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}

.status-select {
  padding: 6px 8px;
  border-radius: 7px;
  background: var(--field);
  color: var(--text);
}

.progress {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--field);
}

.progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 180ms ease;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: 4px;
  padding: 4px 7px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 11px;
  font-weight: 760;
}

.tag-remove {
  padding: 0;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tag-text) 12%, transparent);
  color: var(--tag-text);
  font-size: 10px;
  line-height: 1;
}

.tag-input {
  width: 70px;
  min-width: 58px;
  padding: 4px 2px;
  color: var(--muted);
  font-size: 12px;
}

.notes {
  display: grid;
  gap: 8px;
}

.notes-toggle {
  justify-self: start;
  padding: 6px 8px;
  background: var(--field);
  color: var(--muted-strong);
  font-size: 12px;
}

.notes-body {
  display: grid;
  gap: 8px;
}

.notes-input {
  min-height: 74px;
  resize: vertical;
  padding: 8px;
  border-radius: 7px;
  background: var(--field);
  line-height: 1.4;
}

.markdown-preview {
  padding: 8px;
  border-radius: 7px;
  background: var(--preview);
  color: var(--muted-strong);
  font-size: 12px;
  line-height: 1.45;
}

.markdown-preview :deep(p),
.markdown-preview :deep(ul),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  margin: 0 0 6px;
}

.markdown-preview :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: var(--code);
}

.hidden-count,
.system-message {
  margin: 0;
  padding: 7px 8px;
  border-radius: 7px;
  background: var(--field);
  color: var(--muted-strong);
  font-size: 12px;
  font-weight: 700;
}

.system-message {
  color: var(--danger);
}

.actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.actions button {
  padding: 7px 9px;
  font-size: 12px;
}

.actions button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.secondary {
  background: var(--button-secondary);
}

.danger {
  background: var(--danger);
}

.relation {
  background: var(--relation);
}

.relation.active {
  background: var(--accent);
}

.child-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
}

.child-count input {
  width: 42px;
  padding: 6px 7px;
  border-radius: 7px;
  background: var(--field);
  color: var(--text);
}

.resizer {
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 16px;
  height: 16px;
  padding: 0;
  background:
    linear-gradient(135deg, transparent 45%, var(--muted) 46%, var(--muted) 52%, transparent 53%),
    linear-gradient(135deg, transparent 62%, var(--muted) 63%, var(--muted) 69%, transparent 70%);
  cursor: nwse-resize;
  opacity: 0.55;
}
</style>
