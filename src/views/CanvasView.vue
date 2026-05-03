<template>
  <main class="page">
    <Toolbar
      :outline-open="showOutline"
      @open-settings="showSettings = true"
      @toggle-outline="showOutline = !showOutline"
    />
    <OutlinePanel v-if="showOutline" />
    <SettingsPanel v-if="showSettings" @close="showSettings = false" />
    <TaskModal v-if="modalNodeId" :node-id="modalNodeId" @close="modalNodeId = null" />

    <VueFlow
      :nodes="store.flowNodes"
      :edges="store.flowEdges"
      :node-types="nodeTypes"
      :default-viewport="{ x: 220, y: 150, zoom: 0.82 }"
      :min-zoom="0.18"
      :max-zoom="2"
      fit-view-on-init
      elevate-edges-on-select
      @connect="store.createRelationFromConnection"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @node-drag-stop="onNodeDragStop"
      @node-double-click="onNodeDoubleClick"
    >
      <Background :pattern-color="backgroundColor" :gap="24" />
      <Controls />
      <MiniMap pannable zoomable />
    </VueFlow>
  </main>
</template>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import Toolbar from '../components/Toolbar.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import OutlinePanel from '../components/OutlinePanel.vue'
import StickyNode from '../components/StickyNode.vue'
import TaskModal from '../components/TaskModal.vue'
import { useTreeStore } from '../stores/treeStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'

const store = useTreeStore()
const settings = useSettingsStore()
const showSettings = ref(false)
const showOutline = ref(true)
const modalNodeId = ref(null)
const nodeTypes = {
  task: markRaw(StickyNode),
  sticky: markRaw(StickyNode),
}
const { setCenter } = useVueFlow()

const backgroundColor = computed(() => (settings.settings.general.theme === 'dark' ? '#30343b' : '#d9d5cb'))

function focusNode(id) {
  const node = store.nodes.find((item) => item.id === id)
  if (!node) return

  setCenter(
    node.position.x + Number(node.data.width || 320) / 2,
    node.position.y + Number(node.data.height || 250) / 2,
    { zoom: 1, duration: 420 },
  )
}

function onNodeClick({ node }) {
  store.selectNode(node.id)
}

function onPaneClick() {
  store.cancelRelation()
}

function onNodeDoubleClick({ node }) {
  modalNodeId.value = node.id
}

function onNodeDragStop({ node }) {
  store.updateNodePosition(node.id, node.position)
}

function isTypingTarget(target) {
  if (!target) return false
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
}

function focusSearchInput() {
  document.querySelector('[data-search-input]')?.focus()
}

function onKeydown(event) {
  const key = event.key.toLowerCase()

  if ((event.metaKey || event.ctrlKey) && key === 'k') {
    event.preventDefault()
    focusSearchInput()
    return
  }

  if (event.key === '/' && !isTypingTarget(event.target)) {
    event.preventDefault()
    focusSearchInput()
    return
  }

  if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return

  const selectedId = store.selectedNodeId

  if (event.key === 'Escape') {
    store.cancelRelation()
    store.searchQuery = ''
    return
  }

  if (!selectedId) return

  if (key === 'a' || event.key === 'Enter') {
    event.preventDefault()
    store.quickAddChild(selectedId)
  }

  if (event.key === 'Delete') {
    event.preventDefault()
    store.deleteNode(selectedId)
  }

  if (key === 'c') {
    event.preventDefault()
    store.toggleCollapse(selectedId)
  }

  if (key === 'f') {
    event.preventDefault()
    store.toggleFocusMode()
  }
}

watch(
  () => settings.settings.general.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme || 'light'
  },
  { immediate: true },
)

watch(
  () => store.focusRequest,
  (request) => {
    if (!request?.id) return
    nextTick(() => focusNode(request.id))
  },
  { deep: true },
)

watch(
  () => store.firstSearchMatchId,
  (id) => {
    if (!id) return
    store.expandAncestors(id)
    nextTick(() => focusNode(id))
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  background: var(--canvas);
}

.vue-flow {
  width: 100%;
  height: 100%;
}
</style>
