import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadTree, saveTree, clearTree } from '../services/storageService'
import { useTreeLayout } from '../composables/useTreeLayout'

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function defaultTree() {
  return {
    nodes: [
      {
        id: 'root',
        type: 'sticky',
        position: { x: 120, y: 120 },
        data: {
          title: 'Implement user management',
          content: 'Break this feature into API, Vue UI, PHPUnit tests, and Playwright tests.',
          childCount: 4,
          parentId: null,
        },
      },
    ],
    edges: [],
  }
}

export const useTreeStore = defineStore('tree', () => {
  const saved = loadTree() || defaultTree()
  const nodes = ref(saved.nodes)
  const edges = ref(saved.edges)
  const { childPositions } = useTreeLayout()

  watch([nodes, edges], () => {
    saveTree({ nodes: nodes.value, edges: edges.value })
  }, { deep: true })

  function updateNodeData(id, patch) {
    const node = nodes.value.find((item) => item.id === id)
    if (!node) return
    node.data = { ...node.data, ...patch }
  }

  function updateNodePosition(id, position) {
    const node = nodes.value.find((item) => item.id === id)
    if (!node) return
    node.position = position
  }

  function createChildren(parentId) {
    const parent = nodes.value.find((node) => node.id === parentId)
    if (!parent) return

    const count = Math.min(5, Math.max(1, Number(parent.data.childCount || 3)))
    const positions = childPositions(parent.position, count)

    const newNodes = positions.map((position, index) => {
      const id = makeId('node')
      return {
        id,
        type: 'sticky',
        position,
        data: {
          title: `Child task ${index + 1}`,
          content: '',
          childCount: 3,
          parentId,
        },
      }
    })

    const newEdges = newNodes.map((child) => ({
      id: makeId('edge'),
      source: parentId,
      target: child.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#111', strokeWidth: 2.5 },
    }))

    nodes.value = [...nodes.value, ...newNodes]
    edges.value = [...edges.value, ...newEdges]
  }

  function descendantIds(id) {
    const directChildren = edges.value
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target)

    return directChildren.flatMap((childId) => [childId, ...descendantIds(childId)])
  }

  function deleteNode(id) {
    if (id === 'root') return
    const idsToDelete = [id, ...descendantIds(id)]
    nodes.value = nodes.value.filter((node) => !idsToDelete.includes(node.id))
    edges.value = edges.value.filter((edge) => !idsToDelete.includes(edge.source) && !idsToDelete.includes(edge.target))
  }

  function resetTree() {
    clearTree()
    const fresh = defaultTree()
    nodes.value = fresh.nodes
    edges.value = fresh.edges
  }

  function importTree(payload) {
    if (!payload?.nodes || !payload?.edges) throw new Error('Invalid Mushajjir JSON file')
    nodes.value = payload.nodes
    edges.value = payload.edges
  }

  function exportTree() {
    return JSON.stringify({ nodes: nodes.value, edges: edges.value }, null, 2)
  }

  return {
    nodes,
    edges,
    updateNodeData,
    updateNodePosition,
    createChildren,
    deleteNode,
    resetTree,
    importTree,
    exportTree,
  }
})
