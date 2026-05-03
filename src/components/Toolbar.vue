<template>
  <header class="toolbar">
    <div class="brand">
      <strong>{{ settings.settings.general.appName }}</strong>
      <span>{{ store.nodes.length }} nodes</span>
    </div>

    <input
      v-model="store.searchQuery"
      class="search"
      data-search-input
      type="search"
      placeholder="Search tasks, notes, tags"
    />

    <div v-if="store.availableTags.length" class="tag-filters">
      <button
        v-for="tag in store.availableTags"
        :key="tag"
        class="tag-filter"
        :class="{ active: store.activeTagFilters.includes(tag) }"
        :style="tagStyle(tag)"
        @click="store.toggleTagFilter(tag)"
      >
        {{ tag }}
      </button>
      <button v-if="store.activeTagFilters.length" class="plain" @click="store.clearTagFilters">Clear</button>
    </div>

    <div class="actions">
      <button :class="{ active: outlineOpen }" @click="$emit('toggle-outline')">Outline</button>
      <button :class="{ active: store.focusMode }" @click="store.toggleFocusMode">Focus</button>
      <button @click="store.autoLayout('root')">Layout</button>
      <button @click="downloadMarkdown">Export MD</button>
      <button @click="downloadJson">Export JSON</button>
      <label class="file-button">
        Import
        <input type="file" accept="application/json" @change="importJson" />
      </label>
      <button @click="settings.toggleTheme">{{ themeLabel }}</button>
      <button @click="$emit('open-settings')">Settings</button>
      <button class="danger" @click="store.resetTree">Reset</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useTreeStore } from '../stores/treeStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { getTagColor } from '../utils/treeUtils.js'

defineProps({
  outlineOpen: { type: Boolean, default: true },
})

defineEmits(['open-settings', 'toggle-outline'])

const store = useTreeStore()
const settings = useSettingsStore()

const themeLabel = computed(() => (settings.settings.general.theme === 'dark' ? 'Light' : 'Dark'))

function tagStyle(tag) {
  const color = getTagColor(tag)
  return {
    '--tag-bg': color.background,
    '--tag-text': color.color,
  }
}

function downloadFile(content, extension, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mushajjir-tree-${new Date().toISOString().slice(0, 10)}.${extension}`
  link.click()
  URL.revokeObjectURL(url)
}

function downloadMarkdown() {
  downloadFile(store.exportMarkdown(), 'md', 'text/markdown')
}

function downloadJson() {
  downloadFile(store.exportTree(), 'json', 'application/json')
}

function importJson(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      store.importTree(JSON.parse(reader.result))
    } catch (error) {
      alert(error.message)
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>

<style scoped>
.toolbar {
  position: fixed;
  z-index: 20;
  top: 14px;
  left: 14px;
  right: 14px;
  display: grid;
  grid-template-columns: auto minmax(220px, 360px) minmax(160px, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.brand {
  display: grid;
  gap: 2px;
  min-width: 120px;
}

.brand strong {
  font-size: 15px;
  letter-spacing: 0;
}

.brand span {
  color: var(--muted);
  font-size: 12px;
}

.search {
  width: 100%;
  min-width: 0;
  border: 0;
  border-radius: 7px;
  outline: none;
  padding: 9px 11px;
  background: var(--field);
  color: var(--text);
}

.tag-filters,
.actions {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.tag-filters {
  overflow-x: auto;
  padding-bottom: 1px;
}

button,
.file-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 7px;
  padding: 8px 10px;
  background: var(--button);
  color: var(--button-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 760;
  white-space: nowrap;
}

button.active {
  background: var(--accent);
}

.plain {
  background: var(--field);
  color: var(--muted-strong);
}

.danger {
  background: var(--danger);
}

.tag-filter {
  background: var(--tag-bg);
  color: var(--tag-text);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tag-text) 14%, transparent);
}

.tag-filter.active {
  box-shadow: inset 0 0 0 2px var(--tag-text);
}

.file-button input {
  display: none;
}

@media (max-width: 1120px) {
  .toolbar {
    grid-template-columns: auto minmax(180px, 1fr);
  }

  .tag-filters,
  .actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 700px) {
  .toolbar {
    left: 10px;
    right: 10px;
    grid-template-columns: 1fr;
  }

  .brand {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }
}
</style>
