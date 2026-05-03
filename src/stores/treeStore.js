import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { loadTree, saveTree, saveTreeNow, clearTree } from '../services/storageService.js'
import { layoutTree } from '../composables/useTreeLayout.js'
import { divideTask, reformulateTask } from '../services/aiService.js'
import { useSettingsStore } from './settingsStore.js'
import {
  DEFAULT_TAGS,
  TASK_STATUSES,
  ancestorIds,
  buildChildrenByParent,
  buildParentByChild,
  cleanTag,
  clamp,
  createHierarchyEdge,
  createRelationEdge,
  descendantIds,
  makeId,
  normalizeNodeData,
  normalizeTree,
  treeToMarkdown,
} from '../utils/treeUtils.js'

const HIERARCHY_EDGE_STYLE = {
  stroke: 'var(--edge)',
  strokeWidth: 2,
}

const RELATION_EDGE_STYLE = {
  stroke: 'var(--relation)',
  strokeDasharray: '7 6',
  strokeWidth: 1.8,
}

function createNode({ id = makeId('node'), parentId = null, position, data = {} }) {
  return {
    id,
    type: 'task',
    position,
    data: normalizeNodeData({
      parentId,
      ...data,
    }),
  }
}

function defaultTree() {
  const root = createNode({
    id: 'root',
    position: { x: 120, y: 120 },
    data: {
      title: 'Implement user management',
      content:
        'Break this feature into backend, frontend, and verification tasks that an AI coding agent can execute safely.',
      tags: ['ai-generated'],
      taskStatus: 'in-progress',
      width: 340,
    },
  })

  const children = [
    createNode({
      id: 'backend-api',
      parentId: 'root',
      position: { x: -260, y: 420 },
      data: {
        title: 'Backend API',
        content: 'Define routes, controllers, services, policies, and persistence boundaries.',
        tags: ['backend'],
      },
    }),
    createNode({
      id: 'frontend-ui',
      parentId: 'root',
      position: { x: 120, y: 420 },
      data: {
        title: 'Frontend Vue UI',
        content: 'Build forms, validation, empty states, and user management flows.',
        tags: ['frontend'],
      },
    }),
    createNode({
      id: 'test-suite',
      parentId: 'root',
      position: { x: 500, y: 420 },
      data: {
        title: 'Automated tests',
        content: 'Cover API behavior with PHPUnit and user flows with Playwright.',
        tags: ['test'],
      },
    }),
  ]

  return normalizeTree({
    nodes: [root, ...children],
    edges: children.map((child) => createHierarchyEdge('root', child.id)),
  })
}

export const useTreeStore = defineStore('tree', () => {
  const saved = loadTree() || defaultTree()
  const normalized = normalizeTree(saved)
  const nodes = ref(normalized.nodes)
  const edges = ref(normalized.edges)
  const loadingNodeIds = ref([])
  const selectedNodeId = ref(nodes.value[0]?.id || null)
  const searchQuery = ref('')
  const activeTagFilters = ref([])
  const focusMode = ref(false)
  const relationDraftSourceId = ref(null)
  const outlineCollapsedIds = ref([])
  const focusRequest = ref(null)

  const isBusy = computed(() => loadingNodeIds.value.length > 0)
  const hierarchyEdges = computed(() => edges.value.filter((edge) => edge.data?.kind !== 'relation'))
  const relationEdges = computed(() => edges.value.filter((edge) => edge.data?.kind === 'relation'))
  const nodeById = computed(() => new Map(nodes.value.map((node) => [node.id, node])))
  const childrenByParent = computed(() => buildChildrenByParent(edges.value))
  const parentByChild = computed(() => buildParentByChild(edges.value))
  const selectedNode = computed(() => nodeById.value.get(selectedNodeId.value) || null)

  const availableTags = computed(() => {
    const tags = new Set(DEFAULT_TAGS)
    for (const node of nodes.value) {
      for (const tag of node.data.tags || []) tags.add(tag)
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  })

  const matchingNodeIds = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return new Set()

    return new Set(
      nodes.value
        .filter((node) => {
          const searchable = [node.data.title, node.data.content, node.data.notes, ...(node.data.tags || [])]
            .join(' ')
            .toLowerCase()
          return searchable.includes(query)
        })
        .map((node) => node.id),
    )
  })

  const firstSearchMatchId = computed(() => Array.from(matchingNodeIds.value)[0] || null)

  const searchContextIds = computed(() => {
    const contextIds = new Set()
    if (!searchQuery.value.trim()) return contextIds

    for (const id of matchingNodeIds.value) {
      contextIds.add(id)
      for (const ancestorId of ancestorIds(id, parentByChild.value)) contextIds.add(ancestorId)
    }

    return contextIds
  })

  const tagVisibleIds = computed(() => {
    if (!activeTagFilters.value.length) return new Set(nodes.value.map((node) => node.id))

    const ids = new Set()
    for (const node of nodes.value) {
      const nodeTags = node.data.tags || []
      const matches = activeTagFilters.value.every((tag) => nodeTags.includes(tag))
      if (!matches) continue

      ids.add(node.id)
      for (const ancestorId of ancestorIds(node.id, parentByChild.value)) ids.add(ancestorId)
    }

    return ids
  })

  const collapsedHiddenIds = computed(() => {
    const hidden = new Set()
    for (const node of nodes.value) {
      if (!node.data.collapsed) continue
      for (const id of descendantIds(node.id, childrenByParent.value)) hidden.add(id)
    }
    return hidden
  })

  const visibleNodeIds = computed(() => {
    const ids = new Set()
    for (const node of nodes.value) {
      if (collapsedHiddenIds.value.has(node.id)) continue
      if (!tagVisibleIds.value.has(node.id)) continue
      ids.add(node.id)
    }
    return ids
  })

  const focusedBranchIds = computed(() => {
    const id = selectedNodeId.value
    if (!id) return new Set()

    return new Set([...ancestorIds(id, parentByChild.value), id, ...descendantIds(id, childrenByParent.value)])
  })

  const progressByNode = computed(() => {
    const cache = new Map()

    function progressFor(id) {
      if (cache.has(id)) return cache.get(id)

      const children = childrenByParent.value.get(id) || []
      if (children.length) {
        const total = children.reduce((sum, childId) => sum + progressFor(childId), 0)
        const progress = Math.round(total / children.length)
        cache.set(id, progress)
        return progress
      }

      const status = nodeById.value.get(id)?.data?.taskStatus
      const progress = status === 'done' ? 100 : status === 'in-progress' ? 50 : 0
      cache.set(id, progress)
      return progress
    }

    for (const node of nodes.value) progressFor(node.id)
    return cache
  })

  const flowNodes = computed(() =>
    nodes.value.map((node) => {
      const visible = visibleNodeIds.value.has(node.id)
      const isSearchActive = Boolean(searchQuery.value.trim())
      const isSearchMatch = matchingNodeIds.value.has(node.id)
      const isSearchContext = searchContextIds.value.has(node.id)
      const isFocusDimmed = focusMode.value && selectedNodeId.value && !focusedBranchIds.value.has(node.id)
      const isSearchDimmed = isSearchActive && !isSearchMatch && !isSearchContext

      return {
        ...node,
        hidden: !visible,
        selected: selectedNodeId.value === node.id,
        data: {
          ...node.data,
          progress: progressByNode.value.get(node.id) || 0,
          actualChildCount: childrenByParent.value.get(node.id)?.length || 0,
          hiddenDescendantCount: node.data.collapsed ? descendantIds(node.id, childrenByParent.value).length : 0,
          searchMatch: isSearchMatch,
          dimmed: Boolean(isFocusDimmed || isSearchDimmed),
          relationDraftSourceId: relationDraftSourceId.value,
        },
      }
    }),
  )

  const flowEdges = computed(() =>
    edges.value.map((edge) => {
      const kind = edge.data?.kind || 'hierarchy'
      const sourceVisible = visibleNodeIds.value.has(edge.source)
      const targetVisible = visibleNodeIds.value.has(edge.target)
      const dimmed =
        focusMode.value &&
        selectedNodeId.value &&
        (!focusedBranchIds.value.has(edge.source) || !focusedBranchIds.value.has(edge.target))

      return {
        ...edge,
        label: kind === 'relation' ? edge.data?.label || edge.label || '' : edge.label,
        hidden: !sourceVisible || !targetVisible,
        animated: kind === 'hierarchy' && loadingNodeIds.value.includes(edge.source),
        style: {
          ...(kind === 'relation' ? RELATION_EDGE_STYLE : HIERARCHY_EDGE_STYLE),
          opacity: dimmed ? 0.16 : 1,
        },
        class: kind === 'relation' ? 'edge-relation' : 'edge-hierarchy',
      }
    }),
  )

  const outlineRows = computed(() => {
    const rows = []
    const collapsed = new Set(outlineCollapsedIds.value)

    function walk(id, depth = 0) {
      const node = nodeById.value.get(id)
      if (!node) return

      const children = childrenByParent.value.get(id) || []
      rows.push({
        id,
        node,
        depth,
        progress: progressByNode.value.get(id) || 0,
        hasChildren: children.length > 0,
        collapsed: collapsed.has(id),
      })

      if (collapsed.has(id)) return
      for (const childId of children) walk(childId, depth + 1)
    }

    if (nodeById.value.has('root')) {
      walk('root')
    } else {
      for (const node of nodes.value.filter((item) => !parentByChild.value.has(item.id))) {
        walk(node.id)
      }
    }

    return rows
  })

  watch(
    [nodes, edges],
    () => {
      saveTree({ nodes: nodes.value, edges: edges.value })
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      saveTreeNow({ nodes: nodes.value, edges: edges.value })
    })
  }

  function getNode(id) {
    return nodeById.value.get(id)
  }

  function selectNode(id) {
    if (!getNode(id)) return
    selectedNodeId.value = id
  }

  function requestFocusNode(id) {
    if (!getNode(id)) return
    expandAncestors(id)
    selectedNodeId.value = id
    focusRequest.value = { id, nonce: Date.now() }
  }

  function expandAncestors(id) {
    for (const ancestorId of ancestorIds(id, parentByChild.value)) {
      const ancestor = getNode(ancestorId)
      if (ancestor?.data?.collapsed) updateNodeData(ancestorId, { collapsed: false })
    }
  }

  function setNodeBusy(id, busy) {
    if (busy && !loadingNodeIds.value.includes(id)) loadingNodeIds.value.push(id)
    if (!busy) loadingNodeIds.value = loadingNodeIds.value.filter((item) => item !== id)
    if (busy) updateNodeData(id, { systemMessage: 'AI working...' })
  }

  function updateNodeData(id, patch) {
    const node = getNode(id)
    if (!node) return

    node.data = normalizeNodeData({
      ...node.data,
      ...patch,
      tags: patch.tags || node.data.tags,
    })
  }

  function updateNodePosition(id, position) {
    const node = getNode(id)
    if (!node) return
    node.position = {
      x: Math.round(position.x),
      y: Math.round(position.y),
    }
  }

  function updateNodeSize(id, size) {
    const node = getNode(id)
    if (!node) return
    updateNodeData(id, {
      width: clamp(Number(size.width || node.data.width), 280, 560),
      height: clamp(Number(size.height || node.data.height || 260), 230, 760),
    })
  }

  function autoLayout(rootId = 'root') {
    const positions = layoutTree(nodes.value, hierarchyEdges.value, rootId)
    for (const [id, position] of positions.entries()) updateNodePosition(id, position)
  }

  function createChildNodes(parentId, childPayloads, shouldLayout = true) {
    const parent = getNode(parentId)
    if (!parent) return []

    const count = clamp(childPayloads.length, 1, 12)
    const existingChildren = childrenByParent.value.get(parentId)?.length || 0

    const newNodes = Array.from({ length: count }, (_, index) => {
      const payload = childPayloads[index] || {}
      const id = makeId('node')

      return createNode({
        id,
        parentId,
        position: {
          x: parent.position.x + (existingChildren + index - count / 2) * 360,
          y: parent.position.y + 300,
        },
        data: {
          title: payload.title || `Child task ${existingChildren + index + 1}`,
          content: payload.content || payload.description || '',
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          taskStatus: payload.taskStatus || 'todo',
        },
      })
    })

    const newEdges = newNodes.map((child) => createHierarchyEdge(parentId, child.id))

    nodes.value = [...nodes.value, ...newNodes]
    edges.value = [...edges.value, ...newEdges]
    updateNodeData(parentId, { collapsed: false })
    selectedNodeId.value = newNodes[0]?.id || parentId

    if (shouldLayout) autoLayout('root')
    return newNodes
  }

  function createChildren(parentId) {
    const parent = getNode(parentId)
    if (!parent) return

    const count = clamp(Number(parent.data.childCount || 4), 1, 12)
    createChildNodes(
      parentId,
      Array.from({ length: count }, (_, index) => ({
        title: `Child task ${index + 1}`,
        content: '',
      })),
    )
  }

  function quickAddChild(parentId) {
    createChildNodes(parentId, [{ title: 'New task', content: '' }])
  }

  function duplicateNode(id) {
    const source = getNode(id)
    if (!source) return

    const sourceParentId = parentByChild.value.get(id) || null
    const subtreeIds = [id, ...descendantIds(id, childrenByParent.value)]
    const idMap = new Map(subtreeIds.map((item) => [item, makeId('node')]))

    const duplicatedNodes = subtreeIds.map((sourceId, index) => {
      const original = getNode(sourceId)
      const duplicateId = idMap.get(sourceId)
      const originalParentId = sourceId === id ? sourceParentId : parentByChild.value.get(sourceId)
      const mappedParentId = sourceId === id ? sourceParentId : idMap.get(originalParentId)

      return createNode({
        id: duplicateId,
        parentId: mappedParentId || null,
        position: {
          x: original.position.x + 48 + index * 8,
          y: original.position.y + 48 + index * 8,
        },
        data: {
          ...original.data,
          title: sourceId === id ? `${original.data.title} copy` : original.data.title,
          collapsed: false,
        },
      })
    })

    const duplicatedEdges = []
    if (sourceParentId) duplicatedEdges.push(createHierarchyEdge(sourceParentId, idMap.get(id)))

    for (const edge of hierarchyEdges.value) {
      if (!idMap.has(edge.source) || !idMap.has(edge.target)) continue
      duplicatedEdges.push(createHierarchyEdge(idMap.get(edge.source), idMap.get(edge.target)))
    }

    nodes.value = [...nodes.value, ...duplicatedNodes]
    edges.value = [...edges.value, ...duplicatedEdges]
    selectedNodeId.value = idMap.get(id)
    autoLayout('root')
  }

  function deleteNode(id) {
    if (id === 'root') return

    const fallbackSelectedId = parentByChild.value.get(id) || 'root'
    const idsToDelete = new Set([id, ...descendantIds(id, childrenByParent.value)])
    nodes.value = nodes.value.filter((node) => !idsToDelete.has(node.id))
    edges.value = edges.value.filter((edge) => !idsToDelete.has(edge.source) && !idsToDelete.has(edge.target))

    if (idsToDelete.has(selectedNodeId.value)) {
      selectedNodeId.value = fallbackSelectedId
    }
  }

  function toggleCollapse(id) {
    const node = getNode(id)
    if (!node) return
    updateNodeData(id, { collapsed: !node.data.collapsed })
  }

  function addTag(id, tag) {
    const node = getNode(id)
    const cleaned = cleanTag(tag)
    if (!node || !cleaned || node.data.tags.includes(cleaned)) return
    updateNodeData(id, { tags: [...node.data.tags, cleaned] })
  }

  function removeTag(id, tag) {
    const node = getNode(id)
    if (!node) return
    updateNodeData(id, { tags: node.data.tags.filter((item) => item !== tag) })
    activeTagFilters.value = activeTagFilters.value.filter((item) => item !== tag)
  }

  function toggleTagFilter(tag) {
    if (activeTagFilters.value.includes(tag)) {
      activeTagFilters.value = activeTagFilters.value.filter((item) => item !== tag)
      return
    }

    activeTagFilters.value = [...activeTagFilters.value, tag]
  }

  function clearTagFilters() {
    activeTagFilters.value = []
  }

  function toggleFocusMode() {
    focusMode.value = !focusMode.value
  }

  function beginRelation(sourceId) {
    if (!getNode(sourceId)) return
    relationDraftSourceId.value = relationDraftSourceId.value === sourceId ? null : sourceId
  }

  function completeRelation(targetId, label = '') {
    const sourceId = relationDraftSourceId.value
    if (!sourceId || sourceId === targetId || !getNode(sourceId) || !getNode(targetId)) return

    const exists = relationEdges.value.some((edge) => edge.source === sourceId && edge.target === targetId)
    if (!exists) edges.value = [...edges.value, createRelationEdge(sourceId, targetId, label)]
    relationDraftSourceId.value = null
  }

  function cancelRelation() {
    relationDraftSourceId.value = null
  }

  function createRelationFromConnection(connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) return

    const hierarchyExists = hierarchyEdges.value.some(
      (edge) => edge.source === connection.source && edge.target === connection.target,
    )
    if (hierarchyExists) return

    edges.value = [...edges.value, createRelationEdge(connection.source, connection.target)]
  }

  function removeEdge(id) {
    edges.value = edges.value.filter((edge) => edge.id !== id)
  }

  function toggleOutlineCollapsed(id) {
    if (outlineCollapsedIds.value.includes(id)) {
      outlineCollapsedIds.value = outlineCollapsedIds.value.filter((item) => item !== id)
      return
    }

    outlineCollapsedIds.value = [...outlineCollapsedIds.value, id]
  }

  function ancestorNodes(id) {
    return ancestorIds(id, parentByChild.value)
      .map((ancestorId) => getNode(ancestorId))
      .filter(Boolean)
  }

  async function aiDivide(parentId) {
    const parent = getNode(parentId)
    if (!parent) return

    const settingsStore = useSettingsStore()
    const raw = parent.data.childCount
    const count = raw != null ? clamp(Number(raw), 3, 8) : null

    try {
      setNodeBusy(parentId, true)
      const activePrompt = settingsStore.activeDividePrompt
      const tasks = await divideTask({
        provider: settingsStore.selectedProvider,
        node: parent,
        ancestors: ancestorNodes(parentId).map((node) => node.data),
        count,
        systemPrompt: activePrompt?.content || undefined,
      })
      createChildNodes(parentId, tasks)
      updateNodeData(parentId, { systemMessage: '' })
    } catch (error) {
      updateNodeData(parentId, { systemMessage: error.message })
      alert(error.message)
    } finally {
      setNodeBusy(parentId, false)
    }
  }

  async function aiReformulate(id) {
    const node = getNode(id)
    if (!node) return

    const settingsStore = useSettingsStore()

    try {
      setNodeBusy(id, true)
      const improved = await reformulateTask({
        provider: settingsStore.selectedProvider,
        node,
        ancestors: ancestorNodes(id).map((item) => item.data),
      })
      updateNodeData(id, { ...improved, systemMessage: '' })
    } catch (error) {
      updateNodeData(id, { systemMessage: error.message })
      alert(error.message)
    } finally {
      setNodeBusy(id, false)
    }
  }

  function resetTree() {
    clearTree()
    const fresh = defaultTree()
    nodes.value = fresh.nodes
    edges.value = fresh.edges
    selectedNodeId.value = 'root'
    searchQuery.value = ''
    activeTagFilters.value = []
    relationDraftSourceId.value = null
  }

  function importTree(payload) {
    const normalizedPayload = normalizeTree(payload?.tree || payload)
    if (!normalizedPayload.nodes.length) throw new Error('Invalid Mushajjir JSON file')

    nodes.value = normalizedPayload.nodes
    edges.value = normalizedPayload.edges
    selectedNodeId.value = nodes.value[0]?.id || null
    relationDraftSourceId.value = null
  }

  function exportTree() {
    return JSON.stringify(
      {
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        tree: { nodes: nodes.value, edges: edges.value },
      },
      null,
      2,
    )
  }

  function exportMarkdown() {
    return treeToMarkdown(nodes.value, edges.value, nodeById.value.has('root') ? 'root' : nodes.value[0]?.id)
  }

  return {
    nodes,
    edges,
    flowNodes,
    flowEdges,
    outlineRows,
    loadingNodeIds,
    isBusy,
    selectedNodeId,
    selectedNode,
    searchQuery,
    matchingNodeIds,
    firstSearchMatchId,
    activeTagFilters,
    availableTags,
    focusMode,
    relationDraftSourceId,
    focusRequest,
    statusOptions: TASK_STATUSES,
    updateNodeData,
    updateNodePosition,
    updateNodeSize,
    selectNode,
    requestFocusNode,
    expandAncestors,
    createChildren,
    createChildNodes,
    quickAddChild,
    duplicateNode,
    aiDivide,
    aiReformulate,
    deleteNode,
    toggleCollapse,
    addTag,
    removeTag,
    toggleTagFilter,
    clearTagFilters,
    toggleFocusMode,
    beginRelation,
    completeRelation,
    cancelRelation,
    createRelationFromConnection,
    removeEdge,
    toggleOutlineCollapsed,
    autoLayout,
    resetTree,
    importTree,
    exportTree,
    exportMarkdown,
  }
})
