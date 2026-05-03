<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="close">
      <section class="modal-panel">
        <header class="modal-header">
          <input
            class="modal-title"
            :value="node.data.title"
            placeholder="Task title"
            @input="update({ title: $event.target.value })"
          />
          <button class="icon-btn" @click="close">×</button>
        </header>

        <div class="modal-body">
          <div class="field-group">
            <label>Description</label>
            <textarea
              class="modal-textarea"
              :value="node.data.content"
              placeholder="Describe the task..."
              @input="update({ content: $event.target.value })"
            />
          </div>

          <div class="field-row">
            <div class="field-group">
              <label>Status</label>
              <select
                class="modal-select"
                :value="node.data.taskStatus"
                @change="update({ taskStatus: $event.target.value })"
              >
                <option v-for="status in store.statusOptions" :key="status.id" :value="status.id">
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="field-group">
              <label>Progress</label>
              <div class="progress-display">
                <div class="progress-bar">
                  <span :style="{ width: `${node.data.progress}%` }" />
                </div>
                <strong>{{ node.data.progress }}%</strong>
              </div>
            </div>
          </div>

          <div class="field-group">
            <label>Tags</label>
            <div class="tags-row">
              <span v-for="tag in node.data.tags" :key="tag" class="modal-tag" :style="tagStyle(tag)">
                {{ tag }}
                <button class="tag-remove" @click="store.removeTag(node.id, tag)">x</button>
              </span>
              <input
                v-model="newTag"
                class="tag-input"
                placeholder="+ tag"
                @keydown.enter.prevent="commitTag"
                @blur="commitTag"
              />
            </div>
          </div>

          <div class="field-group">
            <label>Notes</label>
            <textarea
              class="modal-textarea"
              :value="node.data.notes"
              placeholder="Markdown notes..."
              @input="update({ notes: $event.target.value })"
            />
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="node.data.notes" class="markdown-preview" v-html="notesHtml" />
          </div>

          <div v-if="node.data.systemMessage" class="system-message">
            {{ node.data.systemMessage }}
          </div>
        </div>

        <footer class="modal-footer">
          <label class="child-count" title="Leave empty for AI to decide">
            Children
            <input
              type="number"
              min="1"
              max="12"
              :value="node.data.childCount"
              :placeholder="node.data.childCount == null ? 'auto' : ''"
              @input="onChildCountInput"
            />
          </label>
          <button :disabled="busy" @click="store.quickAddChild(node.id)">+ Child</button>
          <button :disabled="busy" @click="store.aiDivide(node.id)">AI Divide</button>
          <button :disabled="busy" class="secondary" @click="store.aiReformulate(node.id)">Refine</button>
          <button :disabled="busy" class="secondary" @click="store.duplicateNode(node.id)">Duplicate</button>
          <button v-if="node.id !== 'root'" class="danger" @click="deleteNode">Delete</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useTreeStore } from '../stores/treeStore.js'
import { getTagColor } from '../utils/treeUtils.js'
import { renderMarkdown } from '../utils/markdown.js'

const props = defineProps({
  nodeId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const store = useTreeStore()
const newTag = ref('')

const node = computed(() => store.nodeById.get(props.nodeId))
const busy = computed(() => store.loadingNodeIds.includes(props.nodeId))
const notesHtml = computed(() => renderMarkdown(node.value?.data?.notes))

function update(patch) {
  store.updateNodeData(props.nodeId, patch)
}

function close() {
  emit('close')
}

function tagStyle(tag) {
  const color = getTagColor(tag)
  return { '--tag-bg': color.background, '--tag-text': color.color }
}

function commitTag() {
  const value = newTag.value.trim()
  if (!value) return
  store.addTag(props.nodeId, value)
  newTag.value = ''
}

function onChildCountInput(event) {
  const value = event.target.value
  if (value === '' || value === null) {
    store.updateNodeData(props.nodeId, { childCount: null })
  } else {
    store.updateNodeData(props.nodeId, { childCount: Number(value) })
  }
}

function deleteNode() {
  store.deleteNode(props.nodeId)
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.42);
}

.modal-panel {
  width: min(680px, 100%);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--surface);
  box-shadow: var(--shadow-strong);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--panel-border);
}

.modal-title {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 18px;
  font-weight: 760;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: var(--button);
  color: var(--button-text);
  font-size: 22px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow: auto;
  display: grid;
  gap: 16px;
  padding: 18px;
}

.field-group {
  display: grid;
  gap: 6px;
}

.field-group label {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-textarea {
  width: 100%;
  min-height: 80px;
  border: 0;
  border-radius: 7px;
  padding: 10px 11px;
  background: var(--field);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.modal-select {
  width: 100%;
  border: 0;
  border-radius: 7px;
  padding: 10px 11px;
  background: var(--field);
  color: var(--text);
}

.progress-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--field);
}

.progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 180ms ease;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.modal-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--tag-bg);
  color: var(--tag-text);
  font-size: 12px;
  font-weight: 760;
}

.tag-remove {
  padding: 0;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tag-text) 12%, transparent);
  color: var(--tag-text);
  font-size: 10px;
  cursor: pointer;
}

.tag-input {
  width: 80px;
  min-width: 60px;
  border: 0;
  outline: none;
  padding: 4px 2px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
}

.markdown-preview {
  padding: 10px;
  border-radius: 7px;
  background: var(--preview);
  color: var(--muted-strong);
  font-size: 13px;
  line-height: 1.5;
}

.system-message {
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--field);
  color: var(--danger);
  font-size: 12px;
  font-weight: 700;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  border-top: 1px solid var(--panel-border);
  flex-wrap: wrap;
}

.modal-footer button {
  border: 0;
  border-radius: 7px;
  padding: 8px 12px;
  background: var(--button);
  color: var(--button-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
}

.modal-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.modal-footer .secondary {
  background: var(--button-secondary);
}

.modal-footer .danger {
  background: var(--danger);
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
  border: 0;
  border-radius: 7px;
  background: var(--field);
  color: var(--text);
}

@media (max-width: 600px) {
  .field-row {
    grid-template-columns: 1fr;
  }
  .modal-panel {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  .modal-overlay {
    padding: 0;
  }
}
</style>
