<template>
  <div class="sticky-node">
    <Handle type="target" :position="Position.Top" />

    <input
      class="title"
      :value="data.title"
      placeholder="Task title"
      @input="update({ title: $event.target.value })"
    />

    <textarea
      class="content"
      :value="data.content"
      placeholder="Describe the task..."
      @input="update({ content: $event.target.value })"
    />

    <div class="actions">
      <label>
        children
        <input
          type="number"
          min="1"
          max="5"
          :value="data.childCount"
          @input="update({ childCount: Number($event.target.value) })"
        />
      </label>
      <button @click="store.createChildren(id)">Create</button>
      <button v-if="id !== 'root'" class="danger" @click="store.deleteNode(id)">Delete</button>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script setup>
import { Handle, Position } from '@vue-flow/core'
import { useTreeStore } from '../stores/treeStore'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
})

const store = useTreeStore()

function update(patch) {
  store.updateNodeData(props.id, patch)
}
</script>

<style scoped>
.sticky-node {
  width: 230px;
  min-height: 185px;
  padding: 14px;
  border: 2px solid #1e1b16;
  border-radius: 14px;
  background: #ffe888;
  box-shadow: 7px 8px 0 rgba(30, 27, 22, 0.16);
}
.title {
  width: 100%;
  border: 0;
  border-bottom: 2px solid rgba(30, 27, 22, 0.2);
  outline: none;
  background: transparent;
  font-size: 16px;
  font-weight: 800;
  color: #1e1b16;
  padding-bottom: 8px;
}
.content {
  width: 100%;
  height: 72px;
  margin-top: 10px;
  resize: vertical;
  border: 0;
  outline: none;
  background: transparent;
  color: #332d22;
  line-height: 1.35;
}
.actions {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
}
label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
}
label input {
  width: 46px;
  border: 1px solid rgba(30, 27, 22, 0.35);
  border-radius: 8px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.45);
}
button {
  border: 0;
  border-radius: 9px;
  padding: 7px 9px;
  background: #1e1b16;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}
button:hover { transform: translateY(-1px); }
.danger { background: #9e2f25; }
</style>
