<template>
  <main class="page">
    <Toolbar />

    <VueFlow
      v-model:nodes="store.nodes"
      v-model:edges="store.edges"
      :node-types="nodeTypes"
      :default-viewport="{ x: 180, y: 120, zoom: 0.85 }"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      @node-drag-stop="onNodeDragStop"
    >
      <Background pattern-color="#d6cdbb" :gap="24" />
      <Controls />
      <MiniMap pannable zoomable />
    </VueFlow>
  </main>
</template>

<script setup>
import { markRaw } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import Toolbar from '../components/Toolbar.vue'
import StickyNode from '../components/StickyNode.vue'
import { useTreeStore } from '../stores/treeStore'

const store = useTreeStore()
const nodeTypes = { sticky: markRaw(StickyNode) }

function onNodeDragStop({ node }) {
  store.updateNodePosition(node.id, node.position)
}
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at top left, rgba(255, 232, 136, 0.4), transparent 28rem),
    #f8f4e8;
}
.vue-flow {
  width: 100%;
  height: 100%;
}
</style>
