<template>
  <header class="toolbar">
    <div>
      <h1>🌳 Mushajjir</h1>
      <p>Manual visual task decomposition tree</p>
    </div>
    <div class="buttons">
      <button @click="downloadJson">Export JSON</button>
      <label class="file-button">
        Import JSON
        <input type="file" accept="application/json" @change="importJson" />
      </label>
      <button class="secondary" @click="store.resetTree">Reset</button>
    </div>
  </header>
</template>

<script setup>
import { useTreeStore } from '../stores/treeStore'

const store = useTreeStore()

function downloadJson() {
  const blob = new Blob([store.exportTree()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mushajjir-tree-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
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
  z-index: 10;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 16px;
  border: 2px solid #1e1b16;
  border-radius: 18px;
  background: rgba(255, 250, 235, 0.94);
  box-shadow: 7px 8px 0 rgba(30, 27, 22, 0.12);
  backdrop-filter: blur(10px);
}
h1 { margin: 0; font-size: 22px; }
p { margin: 3px 0 0; color: #6f6250; font-size: 13px; }
.buttons { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
button, .file-button {
  border: 0;
  border-radius: 11px;
  padding: 9px 12px;
  background: #1e1b16;
  color: white;
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
}
.secondary { background: #6f6250; }
.file-button input { display: none; }
@media (max-width: 720px) {
  .toolbar { align-items: flex-start; flex-direction: column; }
  .buttons { justify-content: flex-start; }
}
</style>
