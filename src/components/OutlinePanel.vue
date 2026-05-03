<template>
  <aside class="outline-panel">
    <header>
      <strong>Outline</strong>
      <span>{{ store.outlineRows.length }}</span>
    </header>

    <nav class="outline-list">
      <button
        v-for="row in store.outlineRows"
        :key="row.id"
        class="outline-row"
        :class="{ selected: store.selectedNodeId === row.id }"
        :style="{ paddingLeft: `${10 + row.depth * 18}px` }"
        @click="store.requestFocusNode(row.id)"
      >
        <span
          class="toggle"
          :class="{ empty: !row.hasChildren }"
          @click.stop="row.hasChildren && store.toggleOutlineCollapsed(row.id)"
        >
          {{ row.hasChildren ? (row.collapsed ? '+' : '-') : '' }}
        </span>
        <span class="status-dot" :class="`status-${row.node.data.taskStatus}`" />
        <span class="title">{{ row.node.data.title }}</span>
        <span class="progress">{{ row.progress }}%</span>
      </button>
    </nav>
  </aside>
</template>

<script setup>
import { useTreeStore } from '../stores/treeStore.js'

const store = useTreeStore()
</script>

<style scoped>
.outline-panel {
  position: fixed;
  z-index: 15;
  top: 92px;
  left: 14px;
  width: min(360px, calc(100vw - 28px));
  max-height: calc(100vh - 112px);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  border-bottom: 1px solid var(--panel-border);
}

header span {
  color: var(--muted);
  font-size: 12px;
}

.outline-list {
  overflow: auto;
  padding: 6px;
}

.outline-row {
  width: 100%;
  display: grid;
  grid-template-columns: 18px 10px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 7px;
  padding-block: 7px;
  padding-right: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.outline-row:hover,
.outline-row.selected {
  background: var(--field);
}

.toggle {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  border-radius: 5px;
  color: var(--muted-strong);
  font-weight: 780;
}

.toggle:not(.empty) {
  background: var(--preview);
}

.status-dot {
  width: 8px;
  height: 8px;
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

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 680;
}

.progress {
  color: var(--muted);
  font-size: 11px;
  text-align: right;
}

@media (max-width: 700px) {
  .outline-panel {
    top: 154px;
    max-height: calc(100vh - 170px);
  }
}
</style>
